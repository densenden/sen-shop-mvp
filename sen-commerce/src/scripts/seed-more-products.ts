import { container } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function seedMoreProducts() {
  console.log("Starting to seed more products...")

  const productService = container.resolve(Modules.PRODUCT)
  const regionService = container.resolve(Modules.REGION)
  const artworkModule = container.resolve("artworkModuleService") as any

  try {
    // Get default region
    const [region] = await regionService.listRegions()
    if (!region) {
      console.error("No region found")
      return
    }

    // Get existing artworks
    const artworks = await artworkModule.listArtworks()
    console.log(`Found ${artworks.length} artworks`)

    // Define product templates
    const productTemplates = [
      {
        title: "Premium Canvas Print",
        description: "Museum-quality canvas print with your selected artwork. Stretched over wooden frame, ready to hang.",
        variants: [
          { title: "12x16 inches", price: 4500 },
          { title: "16x20 inches", price: 6500 },
          { title: "20x24 inches", price: 8500 },
          { title: "24x36 inches", price: 12000 }
        ],
        metadata: {
          fulfillment_type: "printful_pod",
          source_provider: "printful",
          product_type: "canvas_print"
        }
      },
      {
        title: "Fine Art Paper Print",
        description: "High-quality archival paper print. Perfect for framing or display.",
        variants: [
          { title: "8x10 inches", price: 2500 },
          { title: "11x14 inches", price: 3500 },
          { title: "16x20 inches", price: 4500 },
          { title: "18x24 inches", price: 5500 }
        ],
        metadata: {
          fulfillment_type: "printful_pod",
          source_provider: "printful",
          product_type: "paper_print"
        }
      },
      {
        title: "Digital Art Download",
        description: "High-resolution digital file of the artwork. Instant download after purchase.",
        variants: [
          { title: "Web Resolution (1920x1080)", price: 500 },
          { title: "Print Resolution (300 DPI)", price: 1500 },
          { title: "Commercial License", price: 5000 }
        ],
        metadata: {
          fulfillment_type: "digital_download",
          product_type: "digital_art"
        }
      },
      {
        title: "Art Poster",
        description: "Vibrant poster print on premium matte paper. Great for any room.",
        variants: [
          { title: "12x18 inches", price: 1800 },
          { title: "18x24 inches", price: 2500 },
          { title: "24x36 inches", price: 3500 }
        ],
        metadata: {
          fulfillment_type: "printful_pod",
          source_provider: "printful",
          product_type: "poster"
        }
      },
      {
        title: "Coffee Mug with Artwork",
        description: "Ceramic mug featuring your selected artwork. Dishwasher and microwave safe.",
        variants: [
          { title: "11oz White Mug", price: 1500 },
          { title: "15oz White Mug", price: 1800 },
          { title: "11oz Black Mug", price: 1600 }
        ],
        metadata: {
          fulfillment_type: "printful_pod",
          source_provider: "printful",
          product_type: "mug"
        }
      },
      {
        title: "Phone Case with Art",
        description: "Protective phone case featuring your selected artwork.",
        variants: [
          { title: "iPhone 15 Pro", price: 2500 },
          { title: "iPhone 14", price: 2500 },
          { title: "Samsung Galaxy S24", price: 2500 },
          { title: "Google Pixel 8", price: 2500 }
        ],
        metadata: {
          fulfillment_type: "printful_pod",
          source_provider: "printful",
          product_type: "phone_case"
        }
      },
      {
        title: "Art Tote Bag",
        description: "Eco-friendly tote bag featuring artwork. Perfect for shopping or everyday use.",
        variants: [
          { title: "Standard (15x15 inches)", price: 2200 },
          { title: "Large (18x18 inches)", price: 2800 }
        ],
        metadata: {
          fulfillment_type: "printful_pod",
          source_provider: "printful",
          product_type: "tote_bag"
        }
      },
      {
        title: "Metal Print",
        description: "Stunning metal print with vibrant colors and modern look. Ready to hang.",
        variants: [
          { title: "8x12 inches", price: 6500 },
          { title: "12x18 inches", price: 9500 },
          { title: "16x24 inches", price: 14500 },
          { title: "20x30 inches", price: 19500 }
        ],
        metadata: {
          fulfillment_type: "printful_pod",
          source_provider: "printful",
          product_type: "metal_print"
        }
      }
    ]

    // Create products
    for (const template of productTemplates) {
      try {
        const product = await productService.createProducts({
          title: template.title,
          description: template.description,
          handle: template.title.toLowerCase().replace(/\s+/g, '-'),
          metadata: template.metadata,
          status: "published",
          images: [],
          variants: template.variants.map(v => ({
            title: v.title,
            manage_inventory: template.metadata.fulfillment_type === "digital_download" ? false : true,
            prices: [
              {
                amount: v.price,
                currency_code: "usd"
              }
            ]
          }))
        })

        console.log(`Created product: ${product.title}`)

        // Link to random artwork if available
        if (artworks.length > 0) {
          const randomArtwork = artworks[Math.floor(Math.random() * artworks.length)]
          await artworkModule.linkArtworkToProduct(randomArtwork.id, product.id)
          console.log(`Linked ${product.title} to artwork: ${randomArtwork.title}`)
        }
      } catch (error) {
        console.error(`Error creating product ${template.title}:`, error)
      }
    }

    console.log("Finished seeding products")
  } catch (error) {
    console.error("Error seeding products:", error)
    throw error
  }
}

