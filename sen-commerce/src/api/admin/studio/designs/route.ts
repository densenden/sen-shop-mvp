import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const AUTHENTICATE = false;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Return mock data for now
    return res.json({
      success: true,
      designs: [
        {
          id: "design_1",
          name: "Summer Collection",
          artist_id: "artist_123",
          status: "completed",
          created_at: new Date().toISOString(),
        }
      ],
    });
  } catch (error: any) {
    console.error("Failed to fetch designs:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch designs",
    });
  }
}