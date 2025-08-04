import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, IPricingModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Update Prices] POST request received")
  try {
    const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT);
    const pricingModuleService: IPricingModuleService = req.scope.resolve(Modules.PRICING);
    
    // Get all products with variants
    const products = await productModuleService.listProducts({}, {
      relations: ['variants']
    });
    
    console.log(`Found ${products.length} products to update prices for`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          if ((variant as any).price_set_id) {
            try {
              // Generate random price between $5-$100 based on product type
              let priceRange = [500, 10000]; // $5-$100 default
              
              // Check metadata for product type to set appropriate price ranges
              if (product.metadata?.fulfillment_type === 'digital') {
                priceRange = [500, 2500]; // $5-$25 for digital
              } else if (product.metadata?.fulfillment_type === 'printful_pod') {
                priceRange = [1500, 5000]; // $15-$50 for POD
              }
              
              const randomPrice = Math.floor(
                Math.random() * (priceRange[1] - priceRange[0]) + priceRange[0]
              );
              
              // Try to add price - if it already exists, this will fail silently
              await pricingModuleService.addPrices({
                priceSetId: (variant as any).price_set_id,
                prices: [{
                  amount: randomPrice,
                  currency_code: 'usd',
                }],
              });
              
              console.log(`Updated price for "${product.title}" to $${randomPrice/100}`);
              updatedCount++;
              
            } catch (err) {
              // Price might already exist, that's OK
              console.log(`Price already exists for "${product.title}" - skipping`);
              errorCount++;
            }
          }
        }
      }
    }
    
    res.json({
      success: true,
      message: `Price update completed`,
      stats: {
        total_products: products.length,
        prices_updated: updatedCount,
        already_existed: errorCount
      }
    });
    
  } catch (error) {
    console.error("[Update Prices] Error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update prices",
      details: error.message 
    });
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
];