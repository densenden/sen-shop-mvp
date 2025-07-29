import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { ICartModuleService, ISalesChannelModuleService } from "@medusajs/types"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    const salesChannelService: ISalesChannelModuleService = req.scope.resolve(Modules.SALES_CHANNEL)
    
    const { region_id, currency_code = 'usd' } = req.body as any

    // Get default sales channel
    const [defaultSalesChannel] = await salesChannelService.listSalesChannels({
      name: "Default"
    })

    const cart = await cartService.createCarts({
      currency_code,
      region_id: region_id || undefined,
      sales_channel_id: defaultSalesChannel?.id
    })

    // Store cart ID in session
    if (req.session) {
      req.session.cart_id = (cart as any).id
    }

    res.json({ cart })
  } catch (error) {
    console.error("Error creating cart:", error)
    res.status(500).json({ error: "Failed to create cart", message: error.message })
  }
}
