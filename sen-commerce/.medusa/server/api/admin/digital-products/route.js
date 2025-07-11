"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
console.log("[Medusa] Loaded /api/admin/digital-products route.ts");
const digital_product_1 = require("../../../modules/digital-product");
console.log("[Medusa] Testing minimal GET handler for admin/digital-products");
async function GET(req, res) {
    try {
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        const digitalProducts = await digitalProductService.listDigitalProducts();
        res.json({
            digital_products: digitalProducts || [],
            count: digitalProducts?.length || 0
        });
    }
    catch (error) {
        console.error("Error in GET /digital-products:", error);
        res.status(500).json({ error: error.message || "Failed to list digital products" });
    }
}
// // Type for file upload
// type FileUploadRequest = MedusaRequest<{
//   name: string
//   description?: string
// }> & {
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
// POST /admin/digital-products - Create a new digital product
async function POST(req, res) {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Create digital product with file
        const digitalProduct = await digitalProductService.createDigitalProduct({
            name: req.body.name,
            description: req.body.description,
            fileBuffer: req.file.buffer,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype
        });
        res.json({ digital_product: digitalProduct });
    }
    catch (error) {
        console.error("Error creating digital product:", error);
        // Check for multer file size error
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: "File too large! Maximum file size is 50MB." });
        }
        res.status(500).json({ error: error.message || "Failed to create digital product" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2RpZ2l0YWwtcHJvZHVjdHMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFTQSxrQkFZQztBQXVDRCxvQkF3QkM7QUFwRkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO0FBRXBFLHNFQUF5RTtBQUt6RSxPQUFPLENBQUMsR0FBRyxDQUFDLGlFQUFpRSxDQUFDLENBQUM7QUFFeEUsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRztJQUNoQyxJQUFJLENBQUM7UUFDSCxNQUFNLHFCQUFxQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHdDQUFzQixDQUFDLENBQUE7UUFDdkUsTUFBTSxlQUFlLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO1FBQ3pFLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxnQkFBZ0IsRUFBRSxlQUFlLElBQUksRUFBRTtZQUN2QyxLQUFLLEVBQUUsZUFBZSxFQUFFLE1BQU0sSUFBSSxDQUFDO1NBQ3BDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUN2RCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLGlDQUFpQyxFQUFFLENBQUMsQ0FBQTtJQUNyRixDQUFDO0FBQ0gsQ0FBQztBQUdELDBCQUEwQjtBQUMxQiwyQ0FBMkM7QUFDM0MsaUJBQWlCO0FBQ2pCLHlCQUF5QjtBQUN6QixTQUFTO0FBQ1QscUJBQXFCO0FBQ3JCLDJCQUEyQjtBQUMzQix1QkFBdUI7QUFDdkIsbUJBQW1CO0FBQ25CLE1BQU07QUFDTixJQUFJO0FBRUosNkRBQTZEO0FBQzdELDBFQUEwRTtBQUMxRSxhQUFhO0FBQ2IsNENBQTRDO0FBQzVDLHFFQUFxRTtBQUNyRSxxREFBcUQ7QUFFckQsK0NBQStDO0FBQy9DLG1GQUFtRjtBQUVuRixvQkFBb0I7QUFDcEIsb0RBQW9EO0FBQ3BELCtDQUErQztBQUMvQyxZQUFZO0FBQ1oseUJBQXlCO0FBQ3pCLDhFQUE4RTtBQUM5RSxvREFBb0Q7QUFDcEQsaUNBQWlDO0FBQ2pDLHNFQUFzRTtBQUN0RSxZQUFZO0FBQ1osU0FBUztBQUNULE9BQU87QUFFUCw4REFBOEQ7QUFDdkQsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRztJQUNqQyxJQUFJLENBQUM7UUFDSCw2QkFBNkI7UUFDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNkLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFBO1FBQzVELENBQUM7UUFDRCxNQUFNLHFCQUFxQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHdDQUFzQixDQUFDLENBQUE7UUFDdkUsbUNBQW1DO1FBQ25DLE1BQU0sY0FBYyxHQUFHLE1BQU0scUJBQXFCLENBQUMsb0JBQW9CLENBQUM7WUFDdEUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSTtZQUNuQixXQUFXLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXO1lBQ2pDLFVBQVUsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU07WUFDM0IsUUFBUSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWTtZQUMvQixRQUFRLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRO1NBQzVCLENBQUMsQ0FBQTtRQUNGLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtJQUMvQyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDdkQsbUNBQW1DO1FBQ25DLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3JDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsNENBQTRDLEVBQUUsQ0FBQyxDQUFBO1FBQ3RGLENBQUM7UUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLGtDQUFrQyxFQUFFLENBQUMsQ0FBQTtJQUN0RixDQUFDO0FBQ0gsQ0FBQyJ9