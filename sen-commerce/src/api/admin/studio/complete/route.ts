import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PrintfulStudioService } from "../../../modules/printful/services/printful-studio-service";
import { ProductService } from "@medusajs/medusa";
import crypto from "crypto";

export const AUTHENTICATE = false;

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Verify webhook signature if configured
    const signature = req.headers["x-printful-signature"] as string;
    if (signature && process.env.PRINTFUL_WEBHOOK_SECRET) {
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", process.env.PRINTFUL_WEBHOOK_SECRET)
        .update(payload)
        .digest("hex");
      
      if (signature !== expectedSignature) {
        return res.status(401).json({
          success: false,
          message: "Invalid webhook signature",
        });
      }
    }
    
    const studioService = req.scope.resolve("printfulStudioService") as PrintfulStudioService;
    const productService = req.scope.resolve("productService") as ProductService;
    
    const {
      sessionToken,
      designId,
      designData,
      mockupUrls,
      printFiles,
      productInfo,
    } = req.body as any;
    
    if (!sessionToken || !designId) {
      return res.status(400).json({
        success: false,
        message: "Session token and design ID are required",
      });
    }
    
    // Handle design completion
    const design = await studioService.handleDesignComplete({
      sessionToken,
      designId,
      designData,
      mockupUrls,
      printFiles,
      productInfo,
    });
    
    // Optionally auto-create product
    if (req.body.autoCreateProduct) {
      const { title, description, variants } = req.body.productData || {};
      
      // Create studio product
      const studioProduct = await studioService.createProductFromDesign(designId, {
        designId,
        artistId: design.artist_id,
        title: title || design.name,
        description: description || design.description,
        variants,
        images: mockupUrls,
        profitMargin: 0.30,
      });
      
      // Calculate pricing
      const pricing = studioService.calculatePricing(
        productInfo.pricing.basePrice,
        productInfo.pricing.printPrice
      );
      
      // Create Medusa product
      const medusaProduct = await productService.create({
        title: title || design.name,
        description: description || design.description,
        handle: `studio-${designId}`.toLowerCase(),
        status: "draft",
        images: mockupUrls.map((url: string) => ({ url })),
        options: [
          { title: "Size" },
          { title: "Color" },
        ],
        variants: variants?.map((v: any) => ({
          title: `${v.size} - ${v.color}`,
          sku: `STUDIO-${designId}-${v.size}-${v.color}`.toUpperCase(),
          prices: [
            {
              amount: Math.round(pricing.retailPrice * 100),
              currency_code: "usd",
            },
          ],
          options: [
            { value: v.size },
            { value: v.color },
          ],
          manage_inventory: false,
          metadata: {
            printful_variant_id: v.printfulVariantId,
            base_price: v.basePrice,
            print_price: v.printPrice,
          },
        })) || [],
        metadata: {
          source: "printful_studio",
          design_id: designId,
          artist_id: design.artist_id,
          cost: pricing.cost,
          profit_margin: 0.30,
        },
      });
      
      // Update studio product with Medusa product ID
      await studioService.atomicPhase_(async (manager) => {
        await manager.update(
          "printful_studio_products",
          { id: studioProduct.id },
          { medusa_product_id: medusaProduct.id }
        );
      });
      
      return res.json({
        success: true,
        design,
        product: medusaProduct,
      });
    }
    
    return res.json({
      success: true,
      design,
    });
  } catch (error: any) {
    console.error("Failed to handle design completion:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to handle design completion",
    });
  }
}