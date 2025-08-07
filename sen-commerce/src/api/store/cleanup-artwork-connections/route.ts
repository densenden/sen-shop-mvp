import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"
import { ArtworkModuleService } from "../../../modules/artwork-module/services/artwork-module-service"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Store Cleanup] Starting cleanup of orphaned artwork connections")
  
  try {
    const artworkModuleService: ArtworkModuleService = req.scope.resolve(ARTWORK_MODULE)
    const productService = req.scope.resolve(Modules.PRODUCT)
    
    // Get all artworks
    const artworks = await artworkModuleService.listArtworks()
    console.log(`[Store Cleanup] Found ${artworks.length} artworks to check`)
    
    // Get all existing product IDs
    const products = await productService.listProducts({}, { select: ["id"] })
    const existingProductIds = new Set(products.map((p: any) => p.id))
    console.log(`[Store Cleanup] Found ${existingProductIds.size} existing products`)
    
    let updatedCount = 0
    let totalOrphanedConnections = 0
    
    // Check each artwork for orphaned product connections
    for (const artwork of artworks) {
      const currentProductIds = artwork.product_ids || []
      
      if (currentProductIds.length === 0) {
        console.log(`[Store Cleanup] Artwork ${artwork.id} (${artwork.title}) has no product connections`)
        continue
      }
      
      // Filter out product IDs that no longer exist
      const validProductIds = currentProductIds.filter((productId: string) => 
        existingProductIds.has(productId)
      )
      
      const orphanedCount = currentProductIds.length - validProductIds.length
      
      if (orphanedCount > 0) {
        console.log(`[Store Cleanup] Artwork ${artwork.id} (${artwork.title}):`)
        console.log(`  - Had ${currentProductIds.length} product connections`)
        console.log(`  - Found ${orphanedCount} orphaned connections`)
        console.log(`  - Keeping ${validProductIds.length} valid connections`)
        
        // Update the artwork with only valid product IDs
        await artworkModuleService.updateArtworks({
          id: artwork.id,
          product_ids: validProductIds
        })
        
        updatedCount++
        totalOrphanedConnections += orphanedCount
      } else {
        console.log(`[Store Cleanup] Artwork ${artwork.id} (${artwork.title}) has all valid connections (${validProductIds.length})`)
      }
    }
    
    console.log(`[Store Cleanup] Cleanup completed:`)
    console.log(`  - Updated ${updatedCount} artworks`)
    console.log(`  - Removed ${totalOrphanedConnections} orphaned connections`)
    
    res.json({
      success: true,
      message: `Cleanup completed successfully`,
      stats: {
        artworks_checked: artworks.length,
        artworks_updated: updatedCount,
        orphaned_connections_removed: totalOrphanedConnections,
        existing_products: existingProductIds.size
      }
    })
    
  } catch (error) {
    console.error("[Store Cleanup] Error cleaning up artwork connections:", error)
    res.status(500).json({
      success: false,
      error: "Failed to cleanup artwork connections",
      details: error.message
    })
  }
}