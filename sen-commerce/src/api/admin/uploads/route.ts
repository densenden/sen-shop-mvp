import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import { ImageUploadService } from "../../../modules/artwork-module"

// Use Multer to handle file upload in memory
const upload = multer({ storage: multer.memoryStorage() })

// This handler will be used by Medusa's API route system
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log('[uploads] Request headers:', req.headers['content-type'])
  console.log('[uploads] Using array upload for file field - v2')
  
  // Multer needs to be called as middleware, so we wrap it in a promise
  // Handle 'file' field (supports both single and multiple with same field name)
  await new Promise<void>((resolve, reject) => {
    upload.array('file', 10)(req as any, res as any, (err: any) => {
      if (err) {
        console.error('[uploads] Multer error:', err)
        console.error('[uploads] Error type:', err.code)
        res.status(400).json({ error: err.message })
        return reject(err)
      }
      console.log('[uploads] Multer processing complete')
      resolve()
    })
  })
  
  // @ts-ignore - Handle both req.file and req.files
  const files = req.files || (req.file ? [req.file] : [])
  console.log('[uploads] Files received:', files.length)
  
  if (!files || files.length === 0) {
    res.status(400).json({ error: "No files uploaded" })
    return
  }
  
  try {
    // Create the upload service with the container (for DI)
    const imageUploadService = new ImageUploadService(req.scope)
    
    const uploadedFiles = []
    
    // Upload each file
    for (const file of files) {
      const publicUrl = await imageUploadService.uploadImage(
        file.buffer,
        file.originalname,
        file.mimetype
      )
      console.log('[uploads] Upload successful:', publicUrl)
      uploadedFiles.push({ url: publicUrl })
    }
    
    res.json({ files: uploadedFiles })
  } catch (err: any) {
    console.error('[uploads] Upload error:', err)
    res.status(500).json({ error: err.message || "Upload failed" })
  }
} 