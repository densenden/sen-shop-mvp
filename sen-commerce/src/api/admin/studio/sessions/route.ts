import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const AUTHENTICATE = false;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // For now, return mock data to test route loading
    return res.json({
      success: true,
      sessions: [
        {
          id: "session_1",
          session_token: "mock_token",
          status: "active",
          created_at: new Date().toISOString(),
        }
      ],
    });
  } catch (error: any) {
    console.error("Failed to fetch sessions:", error);
    return res.json({
      success: true,
      sessions: [],
    });
  }
}