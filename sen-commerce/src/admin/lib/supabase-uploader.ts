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
  const filePath = `artworks/${fileName}`

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading to Supabase:', error)
    throw error
  }
}

export async function deleteImageFromSupabase(imageUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/')
    const filePath = urlParts.slice(-2).join('/') // Get 'artworks/filename.ext'

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