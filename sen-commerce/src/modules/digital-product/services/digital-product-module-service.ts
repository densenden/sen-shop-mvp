import { MedusaService } from "@medusajs/framework/utils"
import { DigitalProduct, DigitalProductDownload } from "../models"
import { FileUploadService } from "./file-upload-service"
import crypto from "crypto"

// Main service for managing digital products
export class DigitalProductModuleService extends MedusaService({
  DigitalProduct,
  DigitalProductDownload
}) {
  protected fileUploadService_: FileUploadService

  constructor(container: any, options?: any) {
    super(container, options)
    this.fileUploadService_ = new FileUploadService(container, options)
  }

  // Create a digital product with file upload
  async createDigitalProduct(data: {
    name: string
    description?: string
    fileBuffer: Buffer
    fileName: string
    mimeType: string
  }) {
    const { fileBuffer, fileName, mimeType, ...productData } = data
    
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (fileBuffer.length > maxSize) {
      throw new Error(`File too large: ${(fileBuffer.length / (1024 * 1024)).toFixed(1)}MB exceeds the 50MB limit`)
    }
    
    // Upload file to Supabase
    const uploadResult = await this.fileUploadService_.uploadFile(
      fileBuffer,
      fileName,
      mimeType
    )
    
    // Create digital product record
    const digitalProduct = await this.createDigitalProducts({
      ...productData,
      file_url: uploadResult.url,
      file_key: uploadResult.key,
      file_size: uploadResult.size,
      mime_type: uploadResult.mimeType
    })
    
    return digitalProduct
  }

  // Generate download access for an order
  async createDownloadAccess(data: {
    digital_product_id: string
    order_id: string
    customer_id: string
    expires_in_days?: number
  }) {
    // Generate unique download token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Calculate expiry date (default 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (data.expires_in_days || 7))
    
    const downloadAccess = await this.createDigitalProductDownloads({
      digital_product_id: data.digital_product_id,
      order_id: data.order_id,
      customer_id: data.customer_id,
      token: token,
      expires_at: expiresAt,
      is_active: true
    })
    
    return downloadAccess
  }

  // Validate and get download URL
  async getDownloadUrl(token: string): Promise<{
    url: string
    product: any
  }> {
    // Find download record by token
    const [download] = await this.listDigitalProductDownloads({
      filters: { token },
      relations: ["digital_product"]
    })
    
    if (!download) {
      throw new Error("Invalid download token")
    }
    
    // Check if expired
    if (download.expires_at && new Date(download.expires_at) < new Date()) {
      throw new Error("Download link has expired")
    }
    
    // Check if still active
    if (!download.is_active) {
      throw new Error("Download link is no longer active")
    }
    
    // Get the digital product
    const [digitalProduct] = await this.listDigitalProducts({
      filters: { id: download.digital_product_id }
    })
    
    if (!digitalProduct) {
      throw new Error("Digital product not found")
    }
    
    // Check max downloads limit
    if (digitalProduct.max_downloads > 0 && 
        download.download_count >= digitalProduct.max_downloads) {
      throw new Error("Maximum download limit reached")
    }
    
    // Update download count
    await this.updateDigitalProductDownloads({
      id: download.id,
      download_count: download.download_count + 1,
      last_downloaded_at: new Date()
    })
    
    // Return public URL (since bucket is public)
    return {
      url: digitalProduct.file_url,
      product: digitalProduct
    }
  }

  // Delete digital product and its file
  async deleteDigitalProductWithFile(id: string) {
    const [product] = await this.listDigitalProducts({
      filters: { id }
    })
    
    if (product && product.file_key) {
      // Delete file from storage
      await this.fileUploadService_.deleteFile(product.file_key)
    }
    
    // Delete database record
    await this.deleteDigitalProducts(id)
  }
} 