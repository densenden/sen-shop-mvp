import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GelatoPodService } from "../../../../../modules/gelato/services/gelato-pod-service"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { template_id, artwork_url, variant_ids } = req.body as {
      template_id: string
      artwork_url: string
      variant_ids: string[]
    }

    if (!template_id || !artwork_url) {
      return res.status(400).json({ error: "template_id and artwork_url are required" })
    }

    const gelatoService = new GelatoPodService(req.scope)

    console.log('[gelato-create-product] Creating product from template:', {
      template_id,
      artwork_url,
      variant_ids
    })

    // Create product from template with artwork
    const product = await gelatoService.createProductFromTemplate(
      template_id,
      artwork_url,
      {
        title: `Product from ${template_id}`,
        description: 'Created via POD Studio'
      }
    )

    console.log('[gelato-create-product] Product created:', product.id || product.productId)

    // Wait for mockups to be generated (Gelato generates them automatically)
    // Note: This might take some time, so we may need to poll or use webhooks
    let mockupUrls: string[] = []
    try {
      const productId = product.id || product.productId
      mockupUrls = await gelatoService.waitForMockups(productId, 60000) // Wait up to 60 seconds
    } catch (error) {
      console.warn('[gelato-create-product] Mockups not ready yet, will be available later')
    }

    res.json({
      product,
      mockup_urls: mockupUrls
    })
  } catch (error: any) {
    console.error("[gelato-create-product] Error:", error)
    res.status(500).json({ error: error.message })
  }
}
