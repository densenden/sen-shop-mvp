import { PrintfulPodProductService } from "../../../modules/printful/services/printful-pod-product-service"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const service = new PrintfulPodProductService();
  const products = await service.fetchPrintfulProducts();
  res.json({ products });
} 