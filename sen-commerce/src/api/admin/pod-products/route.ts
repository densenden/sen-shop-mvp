import { PrintfulPodProductService } from "../../../modules/artwork-module/services/printful-pod-product-service"

// GET /admin/pod-products - List all POD products
export async function GET(req, res) {
  const service = new PrintfulPodProductService()
  // TODO: Replace with real DB fetch
  const products = await service.listPodProductsForArtwork(null) // null = all
  res.status(200).json({ products })
}

// POST /admin/pod-products/sync - Sync with Printful
export async function POST(req, res) {
  const service = new PrintfulPodProductService()
  // TODO: Call your sync script/service here
  // For now, just simulate
  await service.fetchPrintfulProducts()
  res.status(200).json({ message: "Sync started" })
}

// PUT /admin/pod-products/:id - Update product details
export async function PUT(req, res) {
  const { id } = req.query
  const data = req.body
  // TODO: Update the product in your DB
  res.status(200).json({ message: "Product updated" })
}

// POST /admin/pod-products/:id/reset - Reset to Printful original
export async function RESET(req, res) {
  const { id } = req.query
  const service = new PrintfulPodProductService()
  // TODO: Fetch original from Printful and update DB
  res.status(200).json({ message: "Product reset to Printful original" })
} 