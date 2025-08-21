import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createClient } from "@supabase/supabase-js"
import { DIGITAL_PRODUCT_MODULE } from "../../../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../../../modules/digital-product/services/digital-product-module-service"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("supabaseKey is required")
}

const supabase = createClient(supabaseUrl, supabaseKey)

// GET /store/download/secure/:token - Download digital product with Supabase authentication
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { token } = req.params
    
    if (!token) {
      return res.status(400).json({ error: "Download token required" })
    }
    
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Verify download access token
    const [downloadAccess] = await digitalProductService.listDigitalProductDownloads({
      filters: {
        token,
        is_active: true
      }
    })
    
    if (!downloadAccess) {
      return res.status(404).json({ error: "Invalid or expired download link" })
    }
    
    // Check if download has expired
    if (downloadAccess.expires_at && new Date() > new Date(downloadAccess.expires_at)) {
      return res.status(410).json({ error: "Download link has expired" })
    }
    
    // Check download count limit
    const digitalProduct = await digitalProductService.retrieveDigitalProduct(
      downloadAccess.digital_product_id
    )
    
    if (digitalProduct.max_downloads > 0 && 
        downloadAccess.download_count >= digitalProduct.max_downloads) {
      return res.status(429).json({ 
        error: "Maximum download limit reached" 
      })
    }
    
    // Get file from Supabase Storage
    let fileData: ArrayBuffer | null = null
    let contentType = digitalProduct.mime_type || 'application/octet-stream'
    
    if (digitalProduct.storage_bucket && digitalProduct.storage_path) {
      // Download from Supabase Storage
      const { data, error } = await supabase.storage
        .from(digitalProduct.storage_bucket)
        .download(digitalProduct.storage_path)
      
      if (error) {
        console.error("Supabase download error:", error)
        
        // Try to create a signed URL as fallback
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from(digitalProduct.storage_bucket)
          .createSignedUrl(digitalProduct.storage_path, 60) // 60 seconds expiry
        
        if (!urlError && signedUrlData?.signedUrl) {
          // Redirect to signed URL
          return res.redirect(signedUrlData.signedUrl)
        }
        
        return res.status(500).json({ 
          error: "Failed to retrieve file from storage" 
        })
      }
      
      if (data) {
        fileData = await data.arrayBuffer()
      }
    } else if (digitalProduct.file_url) {
      // Download from external URL
      try {
        const response = await fetch(digitalProduct.file_url)
        if (response.ok) {
          fileData = await response.arrayBuffer()
          contentType = response.headers.get('content-type') || contentType
        }
      } catch (error) {
        console.error("External download error:", error)
      }
    }
    
    if (!fileData) {
      return res.status(404).json({ 
        error: "File not found" 
      })
    }
    
    // Update download count
    await digitalProductService.updateDigitalProductDownload(
      downloadAccess.id,
      {
        download_count: downloadAccess.download_count + 1,
        last_downloaded_at: new Date()
      }
    )
    
    // Set appropriate headers for file download
    const fileName = digitalProduct.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const fileExtension = contentType.split('/').pop() || 'file'
    
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.${fileExtension}"`)
    res.setHeader('Content-Length', fileData.byteLength.toString())
    
    // Send the file data
    res.send(Buffer.from(fileData))
    
  } catch (error) {
    console.error("Download error:", error)
    res.status(500).json({ 
      error: "Failed to process download" 
    })
  }
}

// POST /store/download/secure/generate-link - Generate secure download link
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { order_id, product_id, customer_email } = req.body
    
    if (!order_id || !product_id) {
      return res.status(400).json({ 
        error: "Order ID and Product ID required" 
      })
    }
    
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Find the digital product
    const [digitalProduct] = await digitalProductService.listDigitalProducts({
      filters: {
        product_id
      }
    })
    
    if (!digitalProduct) {
      return res.status(404).json({ 
        error: "Digital product not found" 
      })
    }
    
    // Check if download access already exists
    const existingAccess = await digitalProductService.listDigitalProductDownloads({
      filters: {
        order_id,
        digital_product_id: digitalProduct.id
      }
    })
    
    if (existingAccess.length > 0) {
      // Return existing access
      const access = existingAccess[0]
      return res.json({
        download_url: `${process.env.STORE_URL || 'http://localhost:3000'}/api/store/download/secure/${access.token}`,
        token: access.token,
        expires_at: access.expires_at
      })
    }
    
    // Create new download access
    const downloadAccess = await digitalProductService.createDigitalProductDownload({
      digital_product_id: digitalProduct.id,
      order_id,
      customer_email,
      token: generateSecureToken(),
      is_active: true,
      download_count: 0,
      expires_at: digitalProduct.expires_in_days 
        ? new Date(Date.now() + digitalProduct.expires_in_days * 24 * 60 * 60 * 1000)
        : null
    })
    
    res.json({
      download_url: `${process.env.STORE_URL || 'http://localhost:3000'}/api/store/download/secure/${downloadAccess.token}`,
      token: downloadAccess.token,
      expires_at: downloadAccess.expires_at
    })
    
  } catch (error) {
    console.error("Error generating download link:", error)
    res.status(500).json({ 
      error: "Failed to generate download link" 
    })
  }
}

// Helper function to generate secure token
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}