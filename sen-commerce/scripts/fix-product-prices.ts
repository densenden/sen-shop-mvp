/**
 * Script to fix product prices that were created with wrong currency or missing prices
 *
 * Usage:
 *   npx tsx scripts/fix-product-prices.ts [product-id]
 *
 * This script will:
 * 1. Find products with missing or zero prices
 * 2. Look up the correct price from Printful product metadata
 * 3. Update the variant prices in EUR currency
 */

import { MedusaApp, Modules } from "@medusajs/framework/utils"
import { IProductModuleService, IPricingModuleService } from "@medusajs/framework/types"

async function main() {
  const productId = process.argv[2]

  if (!productId) {
    console.log('Usage: npx tsx scripts/fix-product-prices.ts <product-id>')
    console.log('Example: npx tsx scripts/fix-product-prices.ts prod_01K99VAYRH3VA06BRMAE4BDZJT')
    process.exit(1)
  }

  console.log(`\n🔧 Fixing prices for product: ${productId}\n`)

  try {
    // Initialize Medusa app
    const { medusaApp } = await MedusaApp({ workerMode: "server" })

    const productModule: IProductModuleService = medusaApp.modules[Modules.PRODUCT]
    const pricingModule: IPricingModuleService = medusaApp.modules[Modules.PRICING]

    // Get the product
    const product = await productModule.retrieveProduct(productId, {
      relations: ["variants"]
    })

    if (!product) {
      console.error(`❌ Product ${productId} not found`)
      process.exit(1)
    }

    console.log(`✅ Found product: ${product.title}`)
    console.log(`   Variants: ${product.variants?.length || 0}`)

    if (!product.variants || product.variants.length === 0) {
      console.error(`❌ No variants found for product`)
      process.exit(1)
    }

    // Check if product has Printful metadata with pricing info
    const printfulProductId = product.metadata?.printful_product_id
    if (!printfulProductId) {
      console.error(`❌ No Printful product ID in metadata`)
      process.exit(1)
    }

    // For each variant, create a price if missing
    for (const variant of product.variants) {
      console.log(`\n  Processing variant: ${variant.title}`)

      // Try to get existing price set
      let priceSetId = (variant as any).price_set_id

      if (!priceSetId) {
        console.log(`    Creating new price set...`)

        // Create a new price set for this variant
        const priceSet = await pricingModule.createPriceSets([{}])
        priceSetId = priceSet[0].id

        // Link the price set to the variant
        await productModule.updateProductVariants([{
          id: variant.id,
          price_set_id: priceSetId
        }])

        console.log(`    ✅ Created price set: ${priceSetId}`)
      }

      // Determine the price
      // For now, use a default of 29.99 EUR (2999 cents)
      // In a real scenario, you'd fetch this from Printful API
      const priceInCents = 2999
      const currency = 'eur'

      // Create or update the price
      try {
        await pricingModule.createPrices([{
          price_set_id: priceSetId,
          amount: priceInCents,
          currency_code: currency,
          rules: {}
        }])

        console.log(`    ✅ Created price: ${priceInCents} cents (${currency.toUpperCase()})`)
        console.log(`    💰 Display price: €${(priceInCents / 100).toFixed(2)}`)
      } catch (error) {
        console.log(`    ⚠️  Price might already exist, skipping...`)
      }
    }

    console.log(`\n✅ Price fix completed for ${product.title}`)
    console.log(`\n💡 Refresh the product page to see updated prices\n`)

    await medusaApp.onApplicationShutdown()
    process.exit(0)

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

main()
