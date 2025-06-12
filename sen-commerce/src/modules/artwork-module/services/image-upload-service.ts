import { MedusaService } from "@medusajs/framework/utils"
import { createClient } from '@supabase/supabase-js'

export class ImageUploadService extends MedusaService({}) {
  private supabaseUrl: string
  private supabaseKey: string
  private bucketName: string
  private supabase: any

  constructor(container: any, options: any = {}) {
    super(container, options)
    
    this.supabaseUrl = process.env.SUPABASE_URL || ""
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""
    this.bucketName = process.env.SUPABASE_BUCKET_NAME || "artworks"
    
    if (this.supabaseUrl && this.supabaseKey) {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey)
    }
  }

  async uploadImage(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    if (!this.supabase) {
      throw new Error("Supabase not configured properly. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.")
    }

    try {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const fileExt = fileName.split('.').pop() || 'jpg'
      const filePath = `artworks/${timestamp}-${randomId}.${fileExt}`
      
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, buffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Supabase upload error: ${error.message}`)
      }

      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (!this.supabase) {
      console.log("Supabase not configured, skipping image deletion")
      return
    }

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/')
      const filePath = urlParts.slice(-2).join('/') // Get 'artworks/filename.ext'

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath])

      if (error) {
        console.error('Error deleting from Supabase:', error)
      }
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }
} 