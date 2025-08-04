import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"

interface ArtworkProductRelation {
  id: string
  artwork_id: string
  product_id: string
  product_type: "digital" | "printful_pod" | "standard"
  is_primary: boolean
  position: number
  created_at: string
  updated_at: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { artwork_id, product_id, product_type } = req.query
    const artworkModuleService = req.scope.resolve("artworkModuleService")

    // Build filters
    const filters: any = {}
    if (artwork_id) filters.artwork_id = artwork_id
    if (product_id) filters.product_id = product_id  
    if (product_type) filters.product_type = product_type

    const relations = await artworkModuleService.listArtworkProductRelations({
      filters
    })

    res.json({ relations })
  } catch (error) {
    console.error("Error fetching artwork-product relations:", error)
    res.status(500).json({ error: "Failed to fetch relations" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { artwork_id, product_id, product_type, is_primary = false, position = 0 } = req.body as any
    const artworkModuleService = req.scope.resolve("artworkModuleService")

    if (!artwork_id || !product_id || !product_type) {
      return res.status(400).json({ error: "artwork_id, product_id, and product_type are required" })
    }

    // Check if relation already exists
    const existingRelations = await artworkModuleService.listArtworkProductRelations({
      filters: { artwork_id, product_id }
    })

    if (existingRelations.length > 0) {
      return res.status(400).json({ error: "Relation already exists" })
    }

    // If this is primary, unset other primary relations for the same product
    if (is_primary) {
      const productRelations = await artworkModuleService.listArtworkProductRelations({
        filters: { product_id }
      })
      
      for (const relation of productRelations) {
        if (relation.is_primary) {
          await artworkModuleService.updateArtworkProductRelations({
            id: relation.id,
            is_primary: false
          })
        }
      }
    }

    const newRelation = await artworkModuleService.createArtworkProductRelations({
      artwork_id,
      product_id,
      product_type,
      is_primary,
      position
    })

    res.json({ relation: newRelation })
  } catch (error) {
    console.error("Error creating artwork-product relation:", error)
    res.status(500).json({ error: "Failed to create relation" })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { artwork_id, product_id } = req.query
    const artworkModuleService = req.scope.resolve("artworkModuleService")

    if (!artwork_id || !product_id) {
      return res.status(400).json({ error: "artwork_id and product_id are required" })
    }

    // Find the relation to delete
    const relations = await artworkModuleService.listArtworkProductRelations({
      filters: { artwork_id, product_id }
    })

    if (relations.length === 0) {
      return res.status(404).json({ error: "Relation not found" })
    }

    // Delete the relation
    await artworkModuleService.deleteArtworkProductRelations(relations[0].id)

    res.json({ deleted: true })
  } catch (error) {
    console.error("Error deleting artwork-product relation:", error)
    res.status(500).json({ error: "Failed to delete relation" })
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]