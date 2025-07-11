import { PrintfulPodProductService } from "../../../modules/printful/services/printful-pod-product-service"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

interface SyncRequestBody {
  mappings: Array<{
    printfulProductId: string
    artworkId: string
  }>
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { mappings } = req.body as SyncRequestBody;
  if (!Array.isArray(mappings)) {
    res.status(400).json({ error: "Missing or invalid mappings array" });
    return;
  }

  // Instantiate service with Medusa v2 pattern (no repository)
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
  res.json({ success, failed, errors });
} 