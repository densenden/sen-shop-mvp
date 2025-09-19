import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PrintfulStudioService } from "../../../modules/printful/services/printful-studio-service";

export const AUTHENTICATE = false;

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const {
      artistId,
      templateId,
      productData,
      returnUrl,
      cancelUrl,
      productType
    } = req.body as any;
    
    if (!artistId) {
      return res.status(400).json({
        success: false,
        message: "Artist ID is required",
      });
    }
    
    // Generate a session token for tracking
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the Studio URL with proper parameters
    const studioBaseUrl = process.env.PRINTFUL_STUDIO_IFRAME_URL || "https://create.printful.com";
    const storeId = process.env.PRINTFUL_STORE_ID;
    
    const params = new URLSearchParams();
    params.append('store_id', storeId || '');
    params.append('session_token', sessionToken);
    params.append('artist_id', artistId);
    
    if (templateId) {
      params.append('template_id', templateId);
    }
    
    if (productType) {
      params.append('product_type', productType);
    }
    
    if (returnUrl) {
      params.append('return_url', returnUrl);
    } else {
      // Default return URL to our admin
      params.append('return_url', `${process.env.VITE_BACKEND_URL || 'http://localhost:9000'}/admin/printful-studio`);
    }
    
    if (cancelUrl) {
      params.append('cancel_url', cancelUrl);
    }
    
    const studioUrl = `${studioBaseUrl}?${params.toString()}`;
    
    return res.json({
      success: true,
      sessionToken,
      studioUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      message: "Studio session created successfully"
    });
  } catch (error: any) {
    console.error("Failed to create studio session:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create studio session",
    });
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const studioService = req.scope.resolve("printfulStudioService") as PrintfulStudioService;
    const { token } = req.query as any;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Session token is required",
      });
    }
    
    const session = await studioService.getSessionByToken(token);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found or expired",
      });
    }
    
    return res.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error("Failed to get studio session:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get studio session",
    });
  }
}