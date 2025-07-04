import { PrintfulPodProductService } from "../../../modules/printful/services/printful-pod-product-service"

export async function POST(req, res) {
  const { mappings } = req.body;
  if (!Array.isArray(mappings)) {
    res.status(400).json({ error: "Missing or invalid mappings array" });
    return;
  }

  const printfulProductRepository = req.scope.resolve("printfulProductRepository")
  const service = new PrintfulPodProductService({ printfulProductRepository })
  let success = 0, failed = 0, errors: any[] = [];
  for (const { printfulProductId, artworkId } of mappings) {
    try {
      const products = await service.fetchPrintfulProducts();
      const pfProduct = products.find(p => p.id === printfulProductId);
      if (!pfProduct) throw new Error("Product not found in Printful");
      await service.importProductToArtwork(pfProduct, artworkId);
      success++;
    } catch (e) {
      failed++;
      errors.push({ printfulProductId, error: e.message });
    }
  }
  res.json({ success, failed, errors });
} 