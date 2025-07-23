import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { artwork_id } = req.query

    console.log("Debug: Requested artwork_id:", artwork_id)

    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
    
    if (!artworkModuleService) {
      return res.status(500).json({ 
        error: "Artwork module service not available" 
      })
    }

    // Try different ways to find the artwork
    console.log("Debug: Trying listAndCountArtworks with id filter...")
    try {
      const [artworks1] = await artworkModuleService.listAndCountArtworks({ id: artwork_id })
      console.log("Debug: artworks1 length:", artworks1?.length)
      if (artworks1?.length > 0) {
        console.log("Debug: Found artwork1:", artworks1[0].id, artworks1[0].title)
      }
    } catch (error) {
      console.log("Debug: listAndCountArtworks with id failed:", error.message)
    }

    console.log("Debug: Trying listAndCountArtworks without filter...")
    try {
      const [allArtworks] = await artworkModuleService.listAndCountArtworks({})
      console.log("Debug: All artworks count:", allArtworks?.length)
      if (allArtworks?.length > 0) {
        console.log("Debug: First artwork:", allArtworks[0].id, allArtworks[0].title)
        const foundArtwork = allArtworks.find(a => a.id === artwork_id)
        if (foundArtwork) {
          console.log("Debug: Found matching artwork:", foundArtwork.id, foundArtwork.title)
        } else {
          console.log("Debug: No matching artwork found with ID:", artwork_id)
        }
      }
    } catch (error) {
      console.log("Debug: listAndCountArtworks without filter failed:", error.message)
    }

    console.log("Debug: Trying listArtworks...")
    try {
      const artworks3 = await artworkModuleService.listArtworks({})
      console.log("Debug: listArtworks count:", artworks3?.length)
      if (artworks3?.length > 0) {
        console.log("Debug: First listArtworks result:", artworks3[0].id, artworks3[0].title)
      }
    } catch (error) {
      console.log("Debug: listArtworks failed:", error.message)
    }

    res.json({
      success: true,
      requested_id: artwork_id,
      message: "Check server logs for debug info"
    })

  } catch (error) {
    console.error("Debug artwork error:", error)
    res.status(500).json({ 
      error: "Debug failed",
      message: error.message 
    })
  }
}