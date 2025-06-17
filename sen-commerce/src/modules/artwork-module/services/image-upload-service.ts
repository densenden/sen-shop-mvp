import { MedusaService } from "@medusajs/framework/utils"
import { createClient } from '@supabase/supabase-js'

interface FileServiceResult {
  url: string
  key?: string
}

interface FileUploadData {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  buffer: Buffer
  size: number
  filename: string
}

export class ImageUploadService extends MedusaService({}) {
  protected fileService_: any
  private supabase: any
  private bucketName: string = "artworks"

  constructor(container: any, options: any = {}) {
    super(container, options)
    
    // Initialize Supabase client for getting correct URLs
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey)
    }
    
    // Get the file service from the container
    // This will use the S3 provider configured in medusa-config.ts
    try {
      this.fileService_ = container.file || container.fileService || container.resolve("fileService")
    } catch (error) {
      console.log("File service not available in container")
    }
  }

  async uploadImage(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    if (!this.fileService_ && !this.supabase) {
      throw new Error("Neither file service nor Supabase is configured properly.")
    }

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const fileExt = fileName.split('.').pop() || 'jpg'
      const uniqueFileName = `${timestamp}-${randomId}.${fileExt}`
      
      // Try to use file service first
      if (this.fileService_) {
        try {
          // Create a file object for Medusa's file service
          const file: FileUploadData = {
            fieldname: 'file',
            originalname: fileName,
            encoding: '7bit',
            mimetype: mimeType,
            buffer: buffer,
            size: buffer.length,
            filename: uniqueFileName
          }

          // Upload using Medusa's file service
          const result = await this.fileService_.create(file) as FileServiceResult
          
          console.log("File service upload result:", result)
          
          // If we have Supabase client, get the proper public URL
          if (this.supabase && result.key) {
            const { data: { publicUrl } } = this.supabase.storage
              .from(this.bucketName)
              .getPublicUrl(result.key)
            
            console.log("Supabase public URL:", publicUrl)
            return publicUrl
          }
          
          return result.url
        } catch (fileServiceError) {
          console.log("File service upload failed, falling back to Supabase:", fileServiceError)
        }
      }
      
      // Fallback to direct Supabase upload
      if (this.supabase) {
        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .upload(uniqueFileName, buffer, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          throw new Error(`Supabase upload error: ${error.message}`)
        }

        const { data: { publicUrl } } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(uniqueFileName)

        console.log("Direct Supabase upload successful, URL:", publicUrl)
        return publicUrl
      }
      
      throw new Error("No upload method available")
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (!this.fileService_ && !this.supabase) {
      console.log("No deletion service configured")
      return
    }

    try {
      // Extract the key from the URL
      // For Supabase URLs like: https://xxx.supabase.co/storage/v1/object/public/artworks/filename.jpg
      const urlParts = imageUrl.split('/')
      const fileKey = urlParts[urlParts.length - 1]

      // Try file service first
      if (this.fileService_) {
        try {
          await this.fileService_.delete({ fileKey })
          console.log("Image deleted via file service:", fileKey)
          return
        } catch (error) {
          console.log("File service deletion failed:", error)
        }
      }
      
      // Fallback to Supabase
      if (this.supabase) {
        const { error } = await this.supabase.storage
          .from(this.bucketName)
          .remove([fileKey])
        
        if (error) {
          console.error('Supabase deletion error:', error)
        } else {
          console.log("Image deleted via Supabase:", fileKey)
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      // Don't throw here to avoid breaking the flow if deletion fails
    }
  }
} 