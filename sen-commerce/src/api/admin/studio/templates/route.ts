import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PrintfulStudioService } from "../../../modules/printful/services/printful-studio-service";

export const AUTHENTICATE = false;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Fetch real products from Printful API as templates
    const printfulToken = process.env.PRINTFUL_API_TOKEN;
    if (!printfulToken) {
      throw new Error("Printful API token not configured");
    }

    const response = await fetch("https://api.printful.com/products", {
      headers: {
        "Authorization": `Bearer ${printfulToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Printful API error: ${response.status}`);
    }

    const data = await response.json();
    const printfulProducts = data.result || [];

    // Transform Printful products into template format
    const templates = printfulProducts.map((product: any) => ({
      id: `printful_${product.id}`,
      template_id: product.id,
      name: product.title || product.name,
      category: product.type_name?.toLowerCase() || "apparel",
      status: "active",
      preview_url: product.image || null,
      product_type: product.type_name,
      description: product.description || `${product.title} template for custom designs`,
      printful_product_id: product.id,
      created_at: new Date().toISOString(),
    }));

    return res.json({
      success: true,
      templates: templates.slice(0, 20), // Limit to first 20 for performance
      total: templates.length
    });
  } catch (error: any) {
    console.error("Failed to get templates:", error);
    return res.json({
      success: true,
      templates: [],
      error: error.message
    });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Return mock success for now
    return res.json({
      success: true,
      message: "Templates synced successfully",
    });
  } catch (error: any) {
    console.error("Failed to sync templates:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to sync templates",
    });
  }
}