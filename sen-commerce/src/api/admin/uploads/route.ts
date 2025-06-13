import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import { ImageUploadService } from "../../../modules/artwork-module/services/image-upload-service"

// Use Multer to handle file upload in memory
const upload = multer({ storage: multer.memoryStorage() })

// This handler will be used by Medusa's API route system
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log('[uploads] Request headers:', req.headers['content-type'])
  
  // Multer needs to be called as middleware, so we wrap it in a promise
  await new Promise<void>((resolve, reject) => {
    upload.single("file")(req as any, res as any, (err: any) => {
      if (err) {
        console.error('[uploads] Multer error:', err)
        res.status(400).json({ error: err.message })
        return reject(err)
      }
      resolve()
    })
  })
  
  // @ts-ignore
  const file = req.file
  console.log('[uploads] File received:', file ? file.originalname : 'No file')
  
  if (!file) {
    res.status(400).json({ error: "No file uploaded" })
    return
  }
  
  try {
    // Create the upload service (in real project, use DI)
    const imageUploadService = new ImageUploadService({})
    const publicUrl = await imageUploadService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype
    )
    console.log('[uploads] Upload successful:', publicUrl)
    res.json({ files: [{ url: publicUrl }] })
  } catch (err: any) {
    console.error('[uploads] Upload error:', err)
    res.status(500).json({ error: err.message || "Upload failed" })
  }
} 