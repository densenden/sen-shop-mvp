import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const bucketName = 'artworks'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not found in environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function uploadImageToSupabase(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = fileName  // Remove the "artworks/" prefix since bucket is already "artworks"

  console.log('[Supabase Upload] Starting upload:', {
    bucketName,
    filePath,
    fileName: file.name,
    fileSize: file.size
  })

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('[Supabase Upload] Upload failed:', error)
      throw new Error(`Supabase upload error: ${error.message}`)
    }

    console.log('[Supabase Upload] Upload successful:', data)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    console.log('[Supabase Upload] Public URL:', publicUrl)

    // Test if the URL is accessible
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' })
      console.log('[Supabase Upload] URL accessibility test:', {
        status: response.status,
        ok: response.ok
      })
    } catch (testError) {
      console.warn('[Supabase Upload] URL test failed:', testError)
    }

    return publicUrl
  } catch (error) {
    console.error('Error uploading to Supabase:', error)
    throw error
  }
}

export async function deleteImageFromSupabase(imageUrl: string): Promise<void> {
  try {
    // Extract file path from URL - just get the filename
    const urlParts = imageUrl.split('/')
    const filePath = urlParts[urlParts.length - 1] // Get just the filename

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error('Error deleting from Supabase:', error)
    }
  } catch (error) {
    console.error('Error deleting image:', error)
  }
} 