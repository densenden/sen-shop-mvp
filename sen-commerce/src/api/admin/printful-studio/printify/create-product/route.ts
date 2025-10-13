import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRINTIFY_MODULE } from "../../../../../modules/printify"

// POST /admin/printful-studio/printify/create-product
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const printifyService = req.scope.resolve(PRINTIFY_MODULE) as any
  const { blueprint_id, print_provider_id, artwork_url, variants, title, description } = req.body as any

  try {
    // First, get shop ID
    const shopsData = await printifyService.listShops()
    const shop = shopsData.find((s: any) => s.title === process.env.PRINTIFY_SHOP_NAME)

    if (!shop) {
      throw new Error("Printify shop not found")
    }

    const shopId = shop.id

    // Upload artwork to Printify
    console.log("[Printify] Uploading artwork:", artwork_url)
    const uploadResult = await printifyService.uploadImageByUrl(
      shopId,
      artwork_url,
      "artwork.jpg"
    )

    console.log("[Printify] Upload result:", uploadResult)

    // Wait for image to process
    let imageReady = false
    let imageId = uploadResult.id
    let attempts = 0

    while (!imageReady && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const imageStatus = await printifyService.getImageUpload(shopId, imageId)
      console.log("[Printify] Image status:", imageStatus.status)

      if (imageStatus.status === "uploaded") {
        imageReady = true
        imageId = imageStatus.id
      } else if (imageStatus.status === "failed") {
        throw new Error("Image upload failed")
      }

      attempts++
    }

    if (!imageReady) {
      throw new Error("Image upload timed out")
    }

    // Create product with uploaded image
    const productData = {
      title: title || "Custom Product",
      description: description || "Created via POD Studio",
      blueprint_id: parseInt(blueprint_id),
      print_provider_id: parseInt(print_provider_id),
      variants: variants.map((v: any) => ({
        id: v.id,
        price: v.price || 2000, // Default price in cents
        is_enabled: true
      })),
      print_areas: [
        {
          variant_ids: variants.map((v: any) => v.id),
          placeholders: [
            {
              position: "front",
              images: [
                {
                  id: imageId,
                  x: 0.5,
                  y: 0.5,
                  scale: 1,
                  angle: 0
                }
              ]
            }
          ]
        }
      ]
    }

    console.log("[Printify] Creating product with data:", JSON.stringify(productData, null, 2))
    const product = await printifyService.createProduct(shopId, productData)

    res.json({
      success: true,
      product_id: product.id,
      shop_id: shopId,
      product
    })
  } catch (error) {
    console.error("[Printify API] Error creating product:", error)
    res.status(500).json({ error: error.message })
  }
}
