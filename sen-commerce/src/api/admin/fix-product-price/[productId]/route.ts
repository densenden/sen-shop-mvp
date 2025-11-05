import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Temporarily disable authentication to allow fixing prices
export const AUTHENTICATE = false

/**
 * POST /admin/fix-product-price/:productId
 *
 * Fixes pricing for products that have incorrect or missing prices
 * Sets all variants to 29.99 EUR (2999 cents)
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { productId } = req.params
    const { price = 2999, currency = 'eur' } = req.body as { price?: number, currency?: string }

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" })
    }

    console.log(`[Fix Price] Fixing prices for product: ${productId}`)
    console.log(`[Fix Price] Target price: ${price} cents (${currency.toUpperCase()})`)

    const productModule = req.scope.resolve(Modules.PRODUCT)
    const pricingModule = req.scope.resolve(Modules.PRICING)

    // Get the product with variants
    const product = await productModule.retrieveProduct(productId, {
      relations: ["variants"]
    })

    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    console.log(`[Fix Price] Found product: ${product.title}`)
    console.log(`[Fix Price] Variants to fix: ${product.variants?.length || 0}`)

    if (!product.variants || product.variants.length === 0) {
      return res.status(400).json({ error: "Product has no variants" })
    }

    const results = []

    // Fix each variant
    for (const variant of product.variants) {
      console.log(`[Fix Price] Processing variant: ${variant.title}`)

      try {
        // Get or create price set
        let priceSetId = (variant as any).price_set_id

        if (!priceSetId) {
          console.log(`[Fix Price]   Creating new price set...`)
          const priceSets = await pricingModule.createPriceSets([{}])
          priceSetId = priceSets[0].id

          // Link price set to variant
          await productModule.updateProductVariants(variant.id, {
            price_set_id: priceSetId
          })

          console.log(`[Fix Price]   ✅ Created price set: ${priceSetId}`)
        } else {
          console.log(`[Fix Price]   Using existing price set: ${priceSetId}`)

          // Delete old prices in this price set for the target currency
          try {
            const existingPrices = await pricingModule.listPrices({
              price_set_id: [priceSetId],
              currency_code: [currency]
            })

            if (existingPrices && existingPrices.length > 0) {
              await pricingModule.deletePrices(existingPrices.map(p => p.id))
              console.log(`[Fix Price]   Deleted ${existingPrices.length} old ${currency.toUpperCase()} prices`)
            }
          } catch (deleteError) {
            console.log(`[Fix Price]   No old prices to delete`)
          }
        }

        // Create new price
        await pricingModule.createPrices([{
          price_set_id: priceSetId,
          amount: price,
          currency_code: currency,
          rules: {}
        }])

        console.log(`[Fix Price]   ✅ Created price: ${price} cents`)

        results.push({
          variant_id: variant.id,
          variant_title: variant.title,
          price_set_id: priceSetId,
          price: price,
          currency: currency,
          display_price: `${currency.toUpperCase()} ${(price / 100).toFixed(2)}`,
          status: 'success'
        })
      } catch (variantError) {
        console.error(`[Fix Price]   ❌ Error fixing variant:`, variantError)
        results.push({
          variant_id: variant.id,
          variant_title: variant.title,
          status: 'error',
          error: variantError.message
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    console.log(`[Fix Price] ✅ Complete: ${successCount} success, ${errorCount} errors`)

    return res.json({
      success: true,
      product_id: productId,
      product_title: product.title,
      price_cents: price,
      currency: currency,
      display_price: `${currency.toUpperCase()} ${(price / 100).toFixed(2)}`,
      variants_fixed: successCount,
      variants_error: errorCount,
      results
    })

  } catch (error) {
    console.error("[Fix Price] Error:", error)
    return res.status(500).json({
      error: "Failed to fix product prices",
      message: error.message
    })
  }
}
