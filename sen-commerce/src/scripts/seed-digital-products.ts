import { container } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function seedDigitalProducts() {
  console.log("Starting to seed digital products...")

  const digitalProductService = container.resolve("digitalProductModuleService") as any
  const productService = container.resolve(Modules.PRODUCT)
  const regionService = container.resolve(Modules.REGION)
  const pricingService = container.resolve(Modules.PRICING)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

  try {
    // Get default region and sales channel
    const [region] = await regionService.listRegions()
    if (!region) {
      console.error("No region found")
      return
    }

    let [defaultSalesChannel] = await salesChannelService.listSalesChannels({
      name: "Default",
    })

    if (!defaultSalesChannel) {
      defaultSalesChannel = await salesChannelService.createSalesChannels({
        name: "Default",
        description: "Default sales channel for all products",
      })
    }

    // Define digital products
    const digitalProducts = [
      {
        name: "Premium Stock Photos Collection",
        description: "50 high-resolution stock photos for commercial use",
        price: 4999, // $49.99
        metadata: {
          file_type: "zip",
          file_count: 50,
          license: "commercial"
        }
      },
      {
        name: "UI Design Templates Pack",
        description: "20 modern UI design templates for web and mobile",
        price: 7999, // $79.99
        metadata: {
          file_type: "zip",
          file_count: 20,
          software: "Figma, Sketch"
        }
      },
      {
        name: "Digital Art Wallpaper Pack",
        description: "Collection of 30 4K wallpapers",
        price: 1999, // $19.99
        metadata: {
          file_type: "zip",
          resolution: "4K",
          file_count: 30
        }
      },
      {
        name: "Logo Design Templates",
        description: "Professional logo templates ready for customization",
        price: 5999, // $59.99
        metadata: {
          file_type: "ai,psd,svg",
          editable: true
        }
      },
      {
        name: "Social Media Graphics Bundle",
        description: "Instagram and Facebook post templates",
        price: 2999, // $29.99
        metadata: {
          file_type: "psd,canva",
          platforms: "Instagram, Facebook, Twitter"
        }
      }
    ]

    for (const digitalProductData of digitalProducts) {
      try {
        // First, create a mock digital product record (without actual file)
        const digitalProduct = await digitalProductService.createDigitalProducts({
          name: digitalProductData.name,
          description: digitalProductData.description,
          file_url: `https://example.com/downloads/${digitalProductData.name.toLowerCase().replace(/\s+/g, '-')}.zip`,
          file_key: `digital-products/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.zip`,
          file_size: Math.floor(Math.random() * 10 * 1024 * 1024), // Random size up to 10MB
          mime_type: "application/zip",
          max_downloads: 0, // Unlimited
          is_active: true
        })

        console.log(`Created digital product: ${digitalProduct.name}`)

        // Create a Medusa product for it
        const product = await productService.createProducts({
          title: digitalProductData.name,
          description: digitalProductData.description,
          handle: digitalProductData.name.toLowerCase().replace(/\s+/g, '-'),
          status: "published",
          variants: [
            {
              title: "Digital Download",
              manage_inventory: false,
              allow_backorder: true,
            }
          ],
          metadata: {
            ...digitalProductData.metadata,
            fulfillment_type: "digital_download",
            digital_product_id: digitalProduct.id
          }
        })

        console.log(`Created Medusa product: ${product.title}`)

        // Add pricing
        if (product.variants && product.variants.length > 0) {
          await pricingService.addPrices({
            priceSetId: product.variants[0].price_set_id,
            prices: [{
              amount: digitalProductData.price,
              currency_code: "usd",
            }],
          })
        }

        // Link to sales channel
        const remoteLink = container.resolve("remoteLink")
        await remoteLink.create([
          {
            [Modules.PRODUCT]: { product_id: product.id },
            [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
          },
        ])

        console.log(`Successfully created and linked digital product: ${digitalProductData.name}`)
      } catch (error) {
        console.error(`Error creating digital product ${digitalProductData.name}:`, error)
      }
    }

    console.log("Finished seeding digital products")
  } catch (error) {
    console.error("Error seeding digital products:", error)
    throw error
  }
}