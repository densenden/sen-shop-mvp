import { PrintfulPodProductService } from "../../../modules/printful/services/printful-pod-product-service"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

interface SyncRequestBody {
  mappings: Array<{
    printfulProductId: string
    artworkId: string
  }>
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { mappings, productId } = req.body;

    // Support both single product sync and batch sync
    if (productId) {
      // Single product sync from admin UI
      const service = new PrintfulPodProductService(req.scope);
      const products = await service.fetchStoreProducts();
      const pfProduct = products.find(p => p.id == productId);
      
      if (!pfProduct) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found in Printful" 
        });
      }

      // Use a default artwork ID for now - in real implementation this would be selected by user
      await service.syncPrintfulProduct(pfProduct, "default_artwork");
      
      return res.json({
        success: true,
        message: `Product "${pfProduct.name || pfProduct.id}" synced successfully`,
        product: {
          id: productId,
          name: pfProduct.name,
          synced_at: new Date().toISOString(),
          status: "synced"
        }
      });
    }

    // Batch sync (original functionality)
    if (!Array.isArray(mappings)) {
      return res.status(400).json({ error: "Missing or invalid mappings array or productId" });
    }

    const service = new PrintfulPodProductService(req.scope)
    let success = 0, failed = 0, errors: any[] = [];
    for (const { printfulProductId, artworkId } of mappings) {
      try {
        const products = await service.fetchStoreProducts();
        const pfProduct = products.find(p => p.id === printfulProductId);
        if (!pfProduct) throw new Error("Product not found in Printful");
        await service.syncPrintfulProduct(pfProduct, artworkId);
        success++;
      } catch (e: any) {
        failed++;
        errors.push({ printfulProductId, error: e.message });
      }
    }
    return res.json({ success, failed, errors });
  } catch (error: any) {
    console.error("Sync error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to sync product" 
    });
  }
} 