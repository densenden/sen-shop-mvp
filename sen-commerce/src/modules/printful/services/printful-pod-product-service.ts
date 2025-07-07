import { MedusaService } from "@medusajs/framework/utils"
import { PrintfulProduct } from "../models/printful-product"

// This service handles fetching and importing Printful products
export class PrintfulPodProductService extends MedusaService({
  PrintfulProduct,
}) {
  private apiToken: string
  private apiBaseUrl: string
  private container: any

  constructor(container: any, options?: any) {
    super(container, options)
    // Save the container for later use in other methods (for dependency injection)
    this.container = container
    this.apiToken = process.env.PRINTFUL_API_TOKEN || ""
    // NOTE: Do not use /v2 for store endpoints, only for catalog endpoints!
    this.apiBaseUrl = "https://api.printful.com"
  }

  // Fetch all products from Printful store (not catalog)
  async fetchPrintfulProducts() {
    // Debug: print the API token (remove after debugging!)
    console.log("PRINTFUL_API_TOKEN:", this.apiToken)
    const res = await fetch(`${this.apiBaseUrl}/store/products`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    })
    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful API error:", res.status, errorText)
      throw new Error("Failed to fetch products from Printful store")
    }
    const data = await res.json()
    return data.result // Array of store products
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
    // This will create a product in your shop using Medusa's workflow system
    // You need to have access to the container (dependency injection)
    const { createProductsWorkflow } = require("@medusajs/medusa/core-flows")
    // Prepare the product input (adjust fields as needed)
    const input = {
      products: [productData],
    }
    // Run the workflow to create the product
    const { result } = await createProductsWorkflow(this.container).run({ input })
    // result is an array of created products
    return result[0]
  }

  // Update the artwork's product_ids to include the new product
  async addProductToArtwork(artworkId, productId) {
    // This is a simple example, you may need to use your own artwork service or ORM
    // For now, let's assume you have an artworkService with an update method
    const artworkService = this.container.resolve("artworkService")
    // Fetch the artwork
    const artwork = await artworkService.retrieve(artworkId)
    // Add the new productId to the product_ids array (avoid duplicates)
    const productIds = Array.isArray(artwork.product_ids) ? artwork.product_ids : []
    if (!productIds.includes(productId)) {
      productIds.push(productId)
    }
    // Update the artwork
    await artworkService.update(artworkId, { product_ids: productIds })
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