import { MedusaService } from "@medusajs/framework/utils"
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

interface FileUploadResult {
  url: string
  key: string
  size: number
  mimeType: string
  thumbnailUrl?: string
  thumbnailKey?: string
}

// Service to handle file uploads to Supabase "print" bucket
export class FileUploadService extends MedusaService({}) {
  private supabase: any
  private bucketName: string = "print" // Your bucket name

  constructor(container: any, options: any = {}) {
    super(container, options)
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL and Key are required for digital products")
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  // Generate thumbnail for image files
  private async generateThumbnail(buffer: Buffer, mimeType: string): Promise<Buffer | null> {
    try {
      // Only generate thumbnails for image files
      if (!mimeType.startsWith('image/')) {
        return null
      }

      // Generate 500px width thumbnail
      const thumbnail = await sharp(buffer)
        .resize(500, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({
          quality: 85,
          progressive: true
        })
        .toBuffer()

      return thumbnail
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error)
      return null
    }
  }

  // Upload a digital product file with optional thumbnail generation
  async uploadFile(
    buffer: Buffer, 
    fileName: string, 
    mimeType: string
  ): Promise<FileUploadResult> {
    try {
      // Generate unique filename to avoid conflicts
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const fileExt = fileName.split('.').pop() || 'bin'
      const uniqueFileName = `digital-products/${timestamp}-${randomId}.${fileExt}`
      
      console.log(`Uploading file to Supabase: ${uniqueFileName}`)
      
      // Upload main file to Supabase
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(uniqueFileName, buffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error("Supabase upload error details:", error)
        if (error.message.includes("row-level security")) {
          throw new Error("Upload failed: Supabase bucket RLS policy blocks uploads. Please disable RLS or add an upload policy in Supabase dashboard.")
        }
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(uniqueFileName)

      console.log(`File uploaded successfully: ${publicUrl}`)
      
      const result: FileUploadResult = {
        url: publicUrl,
        key: uniqueFileName,
        size: buffer.length,
        mimeType: mimeType
      }

      // Generate and upload thumbnail for images
      const thumbnailBuffer = await this.generateThumbnail(buffer, mimeType)
      if (thumbnailBuffer) {
        const thumbnailFileName = `digital-products/thumbnails/${timestamp}-${randomId}.jpg`
        
        console.log(`Uploading thumbnail: ${thumbnailFileName}`)
        
        const { data: thumbData, error: thumbError } = await this.supabase.storage
          .from(this.bucketName)
          .upload(thumbnailFileName, thumbnailBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          })

        if (!thumbError) {
          const { data: { publicUrl: thumbnailUrl } } = this.supabase.storage
            .from(this.bucketName)
            .getPublicUrl(thumbnailFileName)
          
          result.thumbnailUrl = thumbnailUrl
          result.thumbnailKey = thumbnailFileName
          console.log(`Thumbnail uploaded successfully: ${thumbnailUrl}`)
        } else {
          console.warn('Failed to upload thumbnail:', thumbError)
        }
      }
      
      return result
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  // Delete a file from storage
  async deleteFile(fileKey: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([fileKey])
      
      if (error) {
        console.error('Delete error:', error)
      } else {
        console.log(`File deleted: ${fileKey}`)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      // Don't throw to avoid breaking flow
    }
  }

  // Delete both main file and thumbnail
  async deleteFileWithThumbnail(fileKey: string, thumbnailKey?: string): Promise<void> {
    const filesToDelete = [fileKey]
    if (thumbnailKey) {
      filesToDelete.push(thumbnailKey)
    }

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove(filesToDelete)
      
      if (error) {
        console.error('Delete error:', error)
      } else {
        console.log(`Files deleted: ${filesToDelete.join(', ')}`)
      }
    } catch (error) {
      console.error('Error deleting files:', error)
      // Don't throw to avoid breaking flow
    }
  }

  // Generate a time-limited signed URL for secure downloads
  async getSignedUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(fileKey, expiresIn)
    
    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }
    
    return data.signedUrl
  }
} 