import { MedusaService } from "@medusajs/framework/utils"

type InjectedDependencies = {
  // Add any required dependencies here
}

class GelatoService extends MedusaService({}) {
  private apiKey: string
  private baseUrl = "https://gelato.com/api/v1"

  constructor(container: InjectedDependencies) {
    super(...arguments)

    this.apiKey = process.env.GELATO_API_KEY || ""

    if (!this.apiKey) {
      console.warn("[GelatoService] GELATO_API_KEY not configured")
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[GelatoService] API Error: ${response.status} ${errorText}`)
      throw new Error(`Gelato API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  // ========== CATALOG ==========

  async listProducts(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    console.log("[GelatoService] Listing catalog products")
    return this.request(`/products${query}`)
  }

  async getProduct(productId: string) {
    console.log("[GelatoService] Fetching product:", productId)
    return this.request(`/products/${productId}`)
  }

  async listProductVariants(productId: string) {
    console.log("[GelatoService] Listing variants for product:", productId)
    return this.request(`/products/${productId}/variants`)
  }

  // ========== ORDERS ==========

  async createOrder(orderData: any) {
    console.log("[GelatoService] Creating order")
    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify(orderData)
    })
  }

  async getOrder(orderId: string) {
    console.log("[GelatoService] Fetching order:", orderId)
    return this.request(`/orders/${orderId}`)
  }

  async listOrders(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.status) queryParams.append("status", params.status)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    console.log("[GelatoService] Listing orders")
    return this.request(`/orders${query}`)
  }

  async cancelOrder(orderId: string) {
    console.log("[GelatoService] Cancelling order:", orderId)
    return this.request(`/orders/${orderId}/cancel`, {
      method: "POST"
    })
  }

  // ========== FILES/ARTWORK ==========

  async uploadFile(fileData: { url: string; name: string }) {
    console.log("[GelatoService] Uploading file:", fileData.name)
    return this.request("/files", {
      method: "POST",
      body: JSON.stringify(fileData)
    })
  }

  async getFile(fileId: string) {
    console.log("[GelatoService] Fetching file:", fileId)
    return this.request(`/files/${fileId}`)
  }

  // ========== TEMPLATES ==========

  async listTemplates() {
    console.log("[GelatoService] Listing templates")
    return this.request("/templates")
  }

  async getTemplate(templateId: string) {
    console.log("[GelatoService] Fetching template:", templateId)
    return this.request(`/templates/${templateId}`)
  }

  async createProductFromTemplate(templateData: any) {
    console.log("[GelatoService] Creating product from template")
    return this.request("/products/from-template", {
      method: "POST",
      body: JSON.stringify(templateData)
    })
  }

  // ========== SHIPPING ==========

  async calculateShipping(shippingData: any) {
    console.log("[GelatoService] Calculating shipping cost")
    return this.request("/shipping/calculate", {
      method: "POST",
      body: JSON.stringify(shippingData)
    })
  }

  async listShippingMethods() {
    console.log("[GelatoService] Listing shipping methods")
    return this.request("/shipping/methods")
  }

  // ========== WEBHOOKS ==========

  async listWebhooks() {
    console.log("[GelatoService] Listing webhooks")
    return this.request("/webhooks")
  }

  async createWebhook(webhookData: { url: string; events: string[] }) {
    console.log("[GelatoService] Creating webhook")
    return this.request("/webhooks", {
      method: "POST",
      body: JSON.stringify(webhookData)
    })
  }

  async updateWebhook(webhookId: string, webhookData: { url: string; events: string[] }) {
    console.log("[GelatoService] Updating webhook:", webhookId)
    return this.request(`/webhooks/${webhookId}`, {
      method: "PUT",
      body: JSON.stringify(webhookData)
    })
  }

  async deleteWebhook(webhookId: string) {
    console.log("[GelatoService] Deleting webhook:", webhookId)
    return this.request(`/webhooks/${webhookId}`, {
      method: "DELETE"
    })
  }
}

export default GelatoService