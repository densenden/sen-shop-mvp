import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common digital file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/zip',
      'audio/mpeg',
      'video/mp4',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`))
    }
  }
})

// Middleware for single file upload
export const uploadMiddleware = upload.single('file')

// Wrapper to convert multer middleware for async/await
export function withFileUpload(handler: (req: MedusaRequest, res: MedusaResponse) => Promise<void>) {
  return (req: MedusaRequest, res: MedusaResponse) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error("Multer upload error:", err)
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "File too large! Maximum file size is 50MB." })
        }
        return res.status(400).json({ error: err.message })
      }
      handler(req, res).catch(error => {
        console.error("Handler error:", error)
        res.status(500).json({ error: error.message || "Internal server error" })
      })
    })
  }
}