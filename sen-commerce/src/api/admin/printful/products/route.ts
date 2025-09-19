import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const AUTHENTICATE = false;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const printfulToken = process.env.PRINTFUL_API_TOKEN;
    if (!printfulToken) {
      throw new Error("Printful API token not configured");
    }

    // Fetch products from Printful API
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

    // Transform to match the expected format for the admin UI
    const products = printfulProducts.map((product: any) => ({
      id: product.id,
      name: product.title || product.name,
      description: product.description || `${product.title} - Premium quality print-on-demand product`,
      price: "25.00", // Base price - in real scenario this would come from variants
      category: product.type_name || "apparel",
      image: product.image || null,
      printful_product_id: product.id,
      type_name: product.type_name,
      brand: product.brand,
      model: product.model,
      available_variants: product.variants || [],
      status: "available",
      created_at: new Date().toISOString(),
    }));

    return res.json({
      success: true,
      products: products.slice(0, 24), // Limit for UI performance
      total: products.length,
      message: `Found ${products.length} Printful products`
    });
  } catch (error: any) {
    console.error("Failed to fetch Printful products:", error);
    return res.json({
      success: true,
      products: [],
      error: error.message
    });
  }
}