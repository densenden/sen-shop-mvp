import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const AUTHENTICATE = false;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Return mock data for now
    return res.json({
      success: true,
      products: [
        {
          id: "studio_product_1",
          design_id: "design_123",
          title: "Studio T-Shirt",
          status: "active",
          created_at: new Date().toISOString(),
        }
      ],
    });
  } catch (error: any) {
    console.error("Failed to fetch studio products:", error);
    return res.json({
      success: true,
      products: [],
    });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { designId } = req.body as any;
    
    if (!designId) {
      return res.status(400).json({
        success: false,
        message: "Design ID is required",
      });
    }
    
    // Return mock success for now
    return res.json({
      success: true,
      product: {
        id: "studio_product_new",
        design_id: designId,
        title: `Studio Product ${designId}`,
        status: "created",
      },
    });
  } catch (error: any) {
    console.error("Failed to create product from design:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
}