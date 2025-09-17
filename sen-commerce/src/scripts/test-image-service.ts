// Test script to verify ProductImageService functionality
import { ProductImageService } from "../services/product-image-service"

// Mock MedusaRequest for testing
const mockRequest = {
  scope: {
    resolve: (module: string) => {
      if (module === "fileModuleService") {
        return {
          uploadFiles: async (files: any[]) => {
            return [{ url: `http://test.com/uploaded-${Date.now()}.jpg` }]
          }
        }
      }
      if (module === "printfulModule") {
        return {
          generateAndWaitForMockups: async (productId: string, variantIds: string[], artworkUrl: string) => {
            return [`http://mockup1.com/${productId}`, `http://mockup2.com/${productId}`]
          },
          getCatalogProduct: async (productId: string) => {
            return {
              id: productId,
              image: `http://catalog.com/${productId}-main.jpg`,
              variants: [
                { id: "var1", image: `http://catalog.com/${productId}-var1.jpg` },
                { id: "var2", image: `http://catalog.com/${productId}-var2.jpg` }
              ]
            }
          }
        }
      }
      return null
    }
  }
} as any

async function testImageService() {
  console.log("Testing ProductImageService...")
  
  try {
    const imageService = new ProductImageService(mockRequest)
    
    // Test product data
    const testProduct = {
      id: "test-product-123",
      thumbnail_url: "http://printful.com/thumb.jpg",
      variants: [
        { id: "variant1", image: "http://printful.com/variant1.jpg" },
        { id: "variant2", image: "http://printful.com/variant2.jpg" }
      ]
    }
    
    const artworkUrl = "http://artwork.com/test-art.jpg"
    
    // Test comprehensive image collection
    console.log("Collecting images...")
    const imageCollection = await imageService.collectPrintfulImages(
      testProduct,
      artworkUrl,
      5, // max mockups
      15 // max total images
    )
    
    console.log("Image Collection Result:")
    console.log("- Total images:", imageCollection.images.length)
    console.log("- Thumbnail:", imageCollection.thumbnail)
    console.log("- Image sources:", imageCollection.metadata.image_sources)
    console.log("- Images:", imageCollection.images.map(img => `${img.type}: ${img.url}`))
    
    // Test conversion to Medusa format
    const medusaFormat = imageService.convertToMedusaFormat(imageCollection)
    console.log("\nMedusa Format:")
    console.log("- Thumbnail:", medusaFormat.thumbnail)
    console.log("- Images count:", medusaFormat.images.length)
    console.log("- Metadata keys:", Object.keys(medusaFormat.metadata))
    
    // Test merging with user uploads
    const userUploads = [
      { url: "http://user.com/upload1.jpg" },
      { url: "http://user.com/upload2.jpg" }
    ]
    
    const mergedCollection = await imageService.mergeWithUserUploads(imageCollection, userUploads)
    console.log("\nAfter merging user uploads:")
    console.log("- Total images:", mergedCollection.images.length)
    console.log("- User uploads:", mergedCollection.metadata.image_sources.user_uploads)
    console.log("- New thumbnail:", mergedCollection.thumbnail)
    
    console.log("\n✅ All tests passed!")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testImageService()
}

export { testImageService }