import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log("Testing database connection...")
    
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
    console.log("Artwork module service resolved:", !!artworkModuleService)
    
    // Check what methods are available on the service
    const serviceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(artworkModuleService))
    console.log("Available service methods:", serviceMethods)
    
    let collections: any[] = []
    let artworks: any[] = []
    let error_info: any = null
    
    // Try to list collections
    try {
      collections = await artworkModuleService.listArtworkCollections({})
      console.log("Collections found:", collections?.length || 0)
    } catch (collectionsError) {
      console.error("Collections error:", collectionsError)
      error_info = { collections_error: collectionsError.message }
    }
    
    // Try to list artworks  
    try {
      artworks = await artworkModuleService.listArtworks({})
      console.log("Artworks found:", artworks?.length || 0)
    } catch (artworksError) {
      console.error("Artworks error:", artworksError)
      error_info = { ...error_info, artworks_error: artworksError.message }
    }
    
    res.json({
      success: true,
      service_methods: serviceMethods,
      collections_count: collections?.length || 0,
      artworks_count: artworks?.length || 0,
      collections: collections || [],
      artworks: artworks || [],
      error_info
    })
  } catch (error) {
    console.error("Database test error:", error)
    res.status(500).json({
      error: "Database test failed",
      message: error.message,
      stack: error.stack
    })
  }
}