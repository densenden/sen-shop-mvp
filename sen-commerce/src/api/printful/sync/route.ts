import { PrintfulPodProductService } from "../../../modules/printful/services/printful-pod-product-service"

// Simple Medusa/Express-style handler for POST /printful/sync
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Expect body: { mappings: [{ printfulProductId, artworkId }] }
  const { mappings } = req.body;
  if (!Array.isArray(mappings)) {
    res.status(400).json({ error: "Missing or invalid mappings array" });
    return;
  }

  const service = new PrintfulPodProductService();
  let success = 0, failed = 0, errors: any[] = [];
  for (const { printfulProductId, artworkId } of mappings) {
    try {
      // Fetch product details from Printful
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