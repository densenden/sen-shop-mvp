import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IProductModuleService, IPricingModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    console.log("Fetching product with ID:", id)
    
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingService: IPricingModuleService = req.scope.resolve(Modules.PRICING)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    console.log("Services resolved:", !!productService, !!pricingService)
    
    try {
      // Fetch product with variants using the query service for better relations
      const { data: [product] } = await query.graph({
        entity: "product",
        filters: { id },
        fields: [
          "id",
          "title", 
          "description",
          "status",
          "metadata",
          "created_at",
          "updated_at",
          "variants.*",
          "variants.price_set.*",
          "variants.price_set.prices.*"
        ],
      })
      
      console.log("Product fetched with pricing:", !!product)
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" })
      }
      
      // Format variants with pricing
      const formattedVariants = (product.variants || []).map((variant: any) => {
        const prices = variant.price_set?.prices || []
        const defaultPrice = prices.find((p: any) => p.currency_code === 'usd') || prices[0]
        
        return {
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          price_set_id: variant.price_set?.id,
          price: defaultPrice?.amount || 0,
          currency_code: defaultPrice?.currency_code || 'usd',
          prices: prices.map((p: any) => ({
            amount: p.amount,
            currency_code: p.currency_code
          })),
          created_at: variant.created_at,
          updated_at: variant.updated_at
        }
      })
      
      // Format response to match expected structure
      const formatted = {
        id: product.id,
        title: product.title,
        description: product.description,
        status: product.status,
        metadata: product.metadata || {},
        variants: formattedVariants,
        tags: product.tags || [],
        created_at: product.created_at,
        updated_at: product.updated_at
      }
      
      res.json({ product: formatted })
      
    } catch (productError) {
      console.error("Could not fetch real product:", productError)
      return res.status(404).json({ error: "Product not found" })
    }
    
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).json({ 
      error: "Failed to fetch product",
      message: error.message 
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const { title, subtitle, description, handle, status, thumbnail, images, metadata } = req.body as {
      title?: string
      subtitle?: string
      description?: string
      handle?: string
      status?: string
      thumbnail?: string
      images?: Array<{ url: string }>
      metadata?: Record<string, any>
    }
    
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Prepare update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (subtitle !== undefined) updateData.subtitle = subtitle
    if (description !== undefined) updateData.description = description
    if (handle !== undefined) updateData.handle = handle
    if (status !== undefined) updateData.status = status
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail
    if (images !== undefined) updateData.images = images
    if (metadata !== undefined) updateData.metadata = metadata
    
    console.log(`[UPDATE PRODUCT] Updating product ${id} with:`, updateData)
    
    // Update the product
    await productService.updateProducts(id, updateData)
    
    // Fetch the updated product to return it
    const updatedProduct = await productService.retrieveProduct(id, {
      relations: ["variants", "tags", "metadata", "images"]
    })
    
    res.json({ 
      success: true,
      product: updatedProduct 
    })
    
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ 
      error: "Failed to update product",
      message: error.message 
    })
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
];
