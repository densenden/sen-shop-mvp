console.log("[Medusa] Loaded /api/admin/digital-products route.ts");
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_PRODUCT_MODULE } from "../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../modules/digital-product/services/digital-product-module-service"
import { Modules } from "@medusajs/framework/utils"


console.log("[Medusa] Testing minimal GET handler for /api/admin/digital-products");

export async function GET(req, res) {
  res.json({ message: "Hello from digital-products minimal handler!" });
}


// // Type for file upload
// type FileUploadRequest = MedusaRequest<{
//   name: string
//   description?: string
// }> & {
//   file?: {
//     buffer: Buffer
//     originalname: string
//     mimetype: string
//     size: number
//   }
// }

// // GET /admin/digital-products - List all digital products
// // export async function GET(req: MedusaRequest, res: MedusaResponse) {
// //   try {
// //     // Get the digital product service
// //     const digitalProductService: DigitalProductModuleService = 
// //       req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
// //     // Simple list without any parameters
// //     const digitalProducts = await digitalProductService.listDigitalProducts()
    
// //     res.json({
// //       digital_products: digitalProducts || [],
// //       count: digitalProducts?.length || 0
// //     })
// //   } catch (error) {
// //     console.error("Error in GET /digital-products - Full error:", error)
// //     console.error("Error stack:", error.stack)
// //     res.status(500).json({ 
// //       error: error.message || "Failed to list digital products" 
// //     })
// //   }
// // }

// // POST /admin/digital-products - Create a new digital product
// export async function POST(req: FileUploadRequest, res: MedusaResponse) {
//   try {
//     // Check if file was uploaded
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" })
//     }
    
//     const digitalProductService: DigitalProductModuleService = 
//       req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
//     // Create digital product with file
//     const digitalProduct = await digitalProductService.createDigitalProduct({
//       name: req.body.name,
//       description: req.body.description,
//       fileBuffer: req.file.buffer,
//       fileName: req.file.originalname,
//       mimeType: req.file.mimetype
//     })
    
//     res.json({
//       digital_product: digitalProduct
//     })
//   } catch (error) {
//     console.error("Error creating digital product:", error)
    
//     // Check for multer file size error
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ 
//         error: "File too large! Maximum file size is 50MB." 
//       })
//     }
    
//     res.status(500).json({ 
//       error: error.message || "Failed to create digital product" 
//     })
//   }
// } 