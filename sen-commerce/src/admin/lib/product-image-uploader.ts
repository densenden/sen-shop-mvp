import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const bucketName = 'product-images'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not found in environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function uploadProductImageToSupabase(file: File, productId?: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(7)
  const fileName = productId ? 
    `${productId}/${timestamp}-${randomId}.${fileExt}` : 
    `${timestamp}-${randomId}.${fileExt}`

  console.log('[Product Image Upload] Starting upload:', {
    bucketName,
    fileName,
    originalName: file.name,
    fileSize: file.size,
    productId
  })

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('[Product Image Upload] Upload failed:', error)
      throw new Error(`Supabase upload error: ${error.message}`)
    }

    console.log('[Product Image Upload] Upload successful:', data)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    console.log('[Product Image Upload] Public URL:', publicUrl)

    // Test if the URL is accessible
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' })
      console.log('[Product Image Upload] URL accessibility test:', {
        status: response.status,
        ok: response.ok
      })
    } catch (testError) {
      console.warn('[Product Image Upload] URL test failed:', testError)
    }

    return publicUrl
  } catch (error) {
    console.error('Error uploading product image to Supabase:', error)
    throw error
  }
}

export async function deleteProductImageFromSupabase(imageUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl)
    const pathSegments = url.pathname.split('/')
    const bucketIndex = pathSegments.indexOf(bucketName)
    
    if (bucketIndex === -1) {
      throw new Error('Invalid image URL - bucket not found')
    }
    
    // Get everything after the bucket name as the file path
    const filePath = pathSegments.slice(bucketIndex + 1).join('/')

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error('Error deleting product image from Supabase:', error)
      throw error
    }

    console.log('[Product Image Upload] Successfully deleted:', filePath)
  } catch (error) {
    console.error('Error deleting product image:', error)
    throw error
  }
}

// Check if bucket exists and create it if it doesn't
export async function ensureProductImagesBucketExists(): Promise<void> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('Error listing buckets:', error)
      return
    }

    const bucketExists = buckets.some(bucket => bucket.name === bucketName)
    
    if (!bucketExists) {
      console.log(`[Product Images] Creating bucket: ${bucketName}`)
      
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
      
      if (createError) {
        console.error('Error creating product-images bucket:', createError)
        throw createError
      }
      
      console.log(`[Product Images] Successfully created bucket: ${bucketName}`)
    } else {
      console.log(`[Product Images] Bucket ${bucketName} already exists`)
    }
  } catch (error) {
    console.error('Error ensuring product-images bucket exists:', error)
    throw error
  }
}