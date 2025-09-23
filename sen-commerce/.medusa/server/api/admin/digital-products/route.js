"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
exports.GET = GET;
console.log("[Medusa] Loaded /api/admin/digital-products route.ts");
const digital_product_1 = require("../../../modules/digital-product");
const middleware_1 = require("./middleware");
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
exports.POST = (0, middleware_1.withFileUpload)(async (req, res) => {
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
        res.status(500).json({ error: error.message || "Failed to create digital product" });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2RpZ2l0YWwtcHJvZHVjdHMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBVUEsa0JBWUM7QUF0QkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO0FBRXBFLHNFQUF5RTtBQUd6RSw2Q0FBNkM7QUFHN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpRUFBaUUsQ0FBQyxDQUFDO0FBRXhFLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUc7SUFDaEMsSUFBSSxDQUFDO1FBQ0gsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx3Q0FBc0IsQ0FBQyxDQUFBO1FBQ3ZFLE1BQU0sZUFBZSxHQUFHLE1BQU0scUJBQXFCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtRQUN6RSxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsZ0JBQWdCLEVBQUUsZUFBZSxJQUFJLEVBQUU7WUFDdkMsS0FBSyxFQUFFLGVBQWUsRUFBRSxNQUFNLElBQUksQ0FBQztTQUNwQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDdkQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxpQ0FBaUMsRUFBRSxDQUFDLENBQUE7SUFDckYsQ0FBQztBQUNILENBQUM7QUFHRCwwQkFBMEI7QUFDMUIsMkNBQTJDO0FBQzNDLGlCQUFpQjtBQUNqQix5QkFBeUI7QUFDekIsU0FBUztBQUNULHFCQUFxQjtBQUNyQiwyQkFBMkI7QUFDM0IsdUJBQXVCO0FBQ3ZCLG1CQUFtQjtBQUNuQixNQUFNO0FBQ04sSUFBSTtBQUVKLDZEQUE2RDtBQUM3RCwwRUFBMEU7QUFDMUUsYUFBYTtBQUNiLDRDQUE0QztBQUM1QyxxRUFBcUU7QUFDckUscURBQXFEO0FBRXJELCtDQUErQztBQUMvQyxtRkFBbUY7QUFFbkYsb0JBQW9CO0FBQ3BCLG9EQUFvRDtBQUNwRCwrQ0FBK0M7QUFDL0MsWUFBWTtBQUNaLHlCQUF5QjtBQUN6Qiw4RUFBOEU7QUFDOUUsb0RBQW9EO0FBQ3BELGlDQUFpQztBQUNqQyxzRUFBc0U7QUFDdEUsWUFBWTtBQUNaLFNBQVM7QUFDVCxPQUFPO0FBRVAsOERBQThEO0FBQ2pELFFBQUEsSUFBSSxHQUFHLElBQUEsMkJBQWMsRUFBQyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkYsSUFBSSxDQUFDO1FBQ0gsNkJBQTZCO1FBQzdCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDZCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQTtRQUM1RCxDQUFDO1FBRUQsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx3Q0FBc0IsQ0FBQyxDQUFBO1FBRXZFLG1DQUFtQztRQUNuQyxNQUFNLGNBQWMsR0FBRyxNQUFNLHFCQUFxQixDQUFDLG9CQUFvQixDQUFDO1lBQ3RFLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUk7WUFDbkIsV0FBVyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVztZQUNqQyxVQUFVLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNO1lBQzNCLFFBQVEsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVk7WUFDL0IsUUFBUSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUTtTQUM1QixDQUFDLENBQUE7UUFFRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsZUFBZSxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUE7SUFDL0MsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3ZELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksa0NBQWtDLEVBQUUsQ0FBQyxDQUFBO0lBQ3RGLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQSJ9