import { MedusaService } from "@medusajs/framework/utils"
import { PrintfulProduct } from "../models/printful-product"

// This service handles fetching and importing Printful products
export class PrintfulPodProductService extends MedusaService({
  PrintfulProduct,
}) {
  private apiToken: string
  private apiBaseUrl: string

  constructor(container: any, options?: any) {
    super(container, options)
    this.apiToken = process.env.PRINTFUL_API_TOKEN || ""
    this.apiBaseUrl = "https://api.printful.com/v2"
  }

  // Fetch all products from Printful v2 catalog
  async fetchPrintfulProducts() {
    const res = await fetch(`${this.apiBaseUrl}/catalog-products`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    })
    if (!res.ok) throw new Error("Failed to fetch products from Printful")
    const data = await res.json()
    return data.result // Array of products
  }

  // Import a Printful product, create a shop product, and link to an artwork
  async importProductToArtwork(printfulProduct, artworkId) {
    // 1. Save to printful_product table using MedusaService method
    const printfulProductRecord = await this.createPrintfulProducts({
      artwork_id: artworkId,
      printful_product_id: printfulProduct.id,
      name: printfulProduct.name,
      thumbnail_url: printfulProduct.thumbnail_url,
      price: null, // Set if you want to sync price
    })
    // 2. Create a main shop product (pseudo-code)
    const shopProduct = await this.createProduct({
      title: printfulProduct.name,
      description: printfulProduct.description || '',
      images: [printfulProduct.thumbnail_url],
      status: 'published',
      // Add more fields as needed (options, variants, etc.)
      printful_product_id: printfulProduct.id, // Store for reference
      artwork_id: artworkId,
    })
    // 3. Update the artwork's product_ids (pseudo-code)
    await this.addProductToArtwork(artworkId, shopProduct.id)
    return { printfulProduct: printfulProductRecord, shopProduct }
  }

  // Pseudo product creation (replace with real logic)
  async createProduct(productData) {
    // TODO: Use Medusa's product service or workflow
    // Example: await productService.create(productData)
    return { id: `prod_${Math.random().toString(36).slice(2)}`, ...productData }
  }

  // Pseudo artwork update (replace with real logic)
  async addProductToArtwork(artworkId, productId) {
    // TODO: Fetch artwork, update product_ids array, and save
    // Example: await artworkService.addProduct(artworkId, productId)
    return true
  }

  // List all Printful products for an artwork
  async listPrintfulProductsForArtwork(artworkId) {
    // Use MedusaService method to fetch from the database
    return await this.listPrintfulProducts({ artwork_id: artworkId })
  }

  // Sync all Printful products, prompt for artwork association
  async syncAllProductsWithArtwork(artworkSelector) {
    const products = await this.fetchPrintfulProducts()
    for (const pfProduct of products) {
      // Prompt admin for artwork association (artworkSelector is a callback/UI trigger)
      const artworkId = await artworkSelector(pfProduct)
      await this.importProductToArtwork(pfProduct, artworkId)
    }
    return { count: products.length }
  }
} 