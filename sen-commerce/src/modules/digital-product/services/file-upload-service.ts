import { MedusaService } from "@medusajs/framework/utils"
import { createClient } from '@supabase/supabase-js'

interface FileUploadResult {
  url: string
  key: string
  size: number
  mimeType: string
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

  // Upload a digital product file
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
      
      // Upload to Supabase
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
      
      return {
        url: publicUrl,
        key: uniqueFileName,
        size: buffer.length,
        mimeType: mimeType
      }
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