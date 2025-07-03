import { PrintfulPodProductService } from "../../../modules/printful/services/printful-pod-product-service"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export default async function handler(req: MedusaRequest, res: MedusaResponse) {
  let user: any = null;
  try {
    user = req.scope.resolve("user");
  } catch (e) {}
  if (!user || !user.is_admin) {
    return res.status(401).json({ error: "Unauthorized: Admins only" })
  }

  try {
    const printfulProductRepository = req.scope.resolve("printfulProductRepository")
    const service = new PrintfulPodProductService({ printfulProductRepository })
    const products = await service.fetchPrintfulProducts()
    res.json({ products })
  } catch (error: any) {
    console.error("Error fetching Printful products:", error)
    res.status(500).json({ error: error.message || "Failed to fetch Printful products" })
  }
} 