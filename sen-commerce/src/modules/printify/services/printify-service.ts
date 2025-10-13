import { MedusaService } from "@medusajs/framework/utils"

type InjectedDependencies = {
  // Add any required dependencies here
}

class PrintifyService extends MedusaService({}) {
  private apiToken: string
  private shopName: string
  private baseUrl = "https://api.printify.com/v1"

  constructor(container: InjectedDependencies) {
    super(...arguments)

    this.apiToken = process.env.PRINTIFY_API_TOKEN || ""
    this.shopName = process.env.PRINTIFY_SHOP_NAME || "SenCommerce"

    if (!this.apiToken) {
      console.warn("[PrintifyService] PRINTIFY_API_TOKEN not configured")
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[PrintifyService] API Error: ${response.status} ${errorText}`)
      throw new Error(`Printify API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  // ========== SHOPS ==========

  async listShops() {
    console.log("[PrintifyService] Listing shops")
    return this.request("/shops.json")
  }

  async disconnectShop(shopId: string) {
    console.log("[PrintifyService] Disconnecting shop:", shopId)
    return this.request(`/shops/${shopId}/connection.json`, {
      method: "DELETE"
    })
  }

  // ========== CATALOG (Blueprints) ==========

  async listBlueprints() {
    console.log("[PrintifyService] Fetching blueprints catalog")
    return this.request("/catalog/blueprints.json")
  }

  async getBlueprintDetails(blueprintId: number) {
    console.log("[PrintifyService] Fetching blueprint details:", blueprintId)
    return this.request(`/catalog/blueprints/${blueprintId}.json`)
  }

  async listBlueprintProviders(blueprintId: number) {
    console.log("[PrintifyService] Fetching providers for blueprint:", blueprintId)
    return this.request(`/catalog/blueprints/${blueprintId}/print_providers.json`)
  }

  async listBlueprintVariants(blueprintId: number, printProviderId: number) {
    console.log("[PrintifyService] Fetching variants for blueprint:", blueprintId, "provider:", printProviderId)
    return this.request(`/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`)
  }

  async getBlueprintProviderShipping(blueprintId: number, printProviderId: number) {
    console.log("[PrintifyService] Fetching shipping for blueprint:", blueprintId, "provider:", printProviderId)
    return this.request(`/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/shipping.json`)
  }

  async listPrintProviders() {
    console.log("[PrintifyService] Listing all print providers")
    return this.request("/catalog/print_providers.json")
  }

  async getPrintProviderDetails(printProviderId: number) {
    console.log("[PrintifyService] Fetching print provider details:", printProviderId)
    return this.request(`/catalog/print_providers/${printProviderId}.json`)
  }

  // ========== PRODUCTS ==========

  async listProducts(shopId: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    console.log("[PrintifyService] Listing products for shop:", shopId)
    return this.request(`/shops/${shopId}/products.json${query}`)
  }

  async getProduct(shopId: string, productId: string) {
    console.log("[PrintifyService] Fetching product:", productId, "from shop:", shopId)
    return this.request(`/shops/${shopId}/products/${productId}.json`)
  }

  async createProduct(shopId: string, productData: any) {
    console.log("[PrintifyService] Creating product in shop:", shopId)
    return this.request(`/shops/${shopId}/products.json`, {
      method: "POST",
      body: JSON.stringify(productData)
    })
  }

  async updateProduct(shopId: string, productId: string, productData: any) {
    console.log("[PrintifyService] Updating product:", productId)
    return this.request(`/shops/${shopId}/products/${productId}.json`, {
      method: "PUT",
      body: JSON.stringify(productData)
    })
  }

  async deleteProduct(shopId: string, productId: string) {
    console.log("[PrintifyService] Deleting product:", productId)
    return this.request(`/shops/${shopId}/products/${productId}.json`, {
      method: "DELETE"
    })
  }

  async publishProduct(shopId: string, productId: string, publishData: any) {
    console.log("[PrintifyService] Publishing product:", productId)
    return this.request(`/shops/${shopId}/products/${productId}/publish.json`, {
      method: "POST",
      body: JSON.stringify(publishData)
    })
  }

  async unpublishProduct(shopId: string, productId: string) {
    console.log("[PrintifyService] Unpublishing product:", productId)
    return this.request(`/shops/${shopId}/products/${productId}/unpublish.json`, {
      method: "POST"
    })
  }

  async setProductPublishingSucceeded(shopId: string, productId: string, externalData: any) {
    console.log("[PrintifyService] Setting product as published:", productId)
    return this.request(`/shops/${shopId}/products/${productId}/publishing_succeeded.json`, {
      method: "POST",
      body: JSON.stringify({ external: externalData })
    })
  }

  async setProductPublishingFailed(shopId: string, productId: string, reason: string) {
    console.log("[PrintifyService] Setting product publishing as failed:", productId)
    return this.request(`/shops/${shopId}/products/${productId}/publishing_failed.json`, {
      method: "POST",
      body: JSON.stringify({ reason })
    })
  }

  // ========== IMAGES ==========

  async uploadImage(shopId: string, imageData: { file_name: string; contents: string }) {
    console.log("[PrintifyService] Uploading image:", imageData.file_name)
    return this.request(`/shops/${shopId}/uploads/images.json`, {
      method: "POST",
      body: JSON.stringify(imageData)
    })
  }

  async uploadImageByUrl(shopId: string, imageUrl: string, fileName: string) {
    console.log("[PrintifyService] Uploading image from URL:", imageUrl)
    return this.request(`/shops/${shopId}/uploads/images.json`, {
      method: "POST",
      body: JSON.stringify({
        file_name: fileName,
        url: imageUrl
      })
    })
  }

  async getImageUpload(shopId: string, uploadId: string) {
    console.log("[PrintifyService] Fetching image upload status:", uploadId)
    return this.request(`/shops/${shopId}/uploads/${uploadId}.json`)
  }

  async archiveImage(shopId: string, uploadId: string) {
    console.log("[PrintifyService] Archiving image:", uploadId)
    return this.request(`/shops/${shopId}/uploads/${uploadId}/archive.json`, {
      method: "POST"
    })
  }

  async listImages(shopId: string) {
    console.log("[PrintifyService] Listing uploaded images")
    return this.request(`/shops/${shopId}/uploads.json`)
  }

  // ========== ORDERS ==========

  async listOrders(shopId: string, params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.status) queryParams.append("status", params.status)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    console.log("[PrintifyService] Listing orders for shop:", shopId)
    return this.request(`/shops/${shopId}/orders.json${query}`)
  }

  async getOrder(shopId: string, orderId: string) {
    console.log("[PrintifyService] Fetching order:", orderId)
    return this.request(`/shops/${shopId}/orders/${orderId}.json`)
  }

  async submitOrder(shopId: string, orderData: any) {
    console.log("[PrintifyService] Submitting order to shop:", shopId)
    return this.request(`/shops/${shopId}/orders.json`, {
      method: "POST",
      body: JSON.stringify(orderData)
    })
  }

  async cancelOrder(shopId: string, orderId: string) {
    console.log("[PrintifyService] Canceling order:", orderId)
    return this.request(`/shops/${shopId}/orders/${orderId}/cancel.json`, {
      method: "POST"
    })
  }

  async calculateShipping(shopId: string, lineItems: any[], addressTo: any) {
    console.log("[PrintifyService] Calculating shipping cost")
    return this.request(`/shops/${shopId}/orders/shipping.json`, {
      method: "POST",
      body: JSON.stringify({
        line_items: lineItems,
        address_to: addressTo
      })
    })
  }

  // ========== WEBHOOKS ==========

  async listWebhooks(shopId: string) {
    console.log("[PrintifyService] Listing webhooks for shop:", shopId)
    return this.request(`/shops/${shopId}/webhooks.json`)
  }

  async createWebhook(shopId: string, webhookData: { topic: string; url: string }) {
    console.log("[PrintifyService] Creating webhook:", webhookData.topic)
    return this.request(`/shops/${shopId}/webhooks.json`, {
      method: "POST",
      body: JSON.stringify(webhookData)
    })
  }

  async updateWebhook(shopId: string, webhookId: string, webhookData: { url: string }) {
    console.log("[PrintifyService] Updating webhook:", webhookId)
    return this.request(`/shops/${shopId}/webhooks/${webhookId}.json`, {
      method: "PUT",
      body: JSON.stringify(webhookData)
    })
  }

  async deleteWebhook(shopId: string, webhookId: string) {
    console.log("[PrintifyService] Deleting webhook:", webhookId)
    return this.request(`/shops/${shopId}/webhooks/${webhookId}.json`, {
      method: "DELETE"
    })
  }
}

export default PrintifyService
