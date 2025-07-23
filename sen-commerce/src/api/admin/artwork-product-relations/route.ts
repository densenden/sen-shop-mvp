import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

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

// In-memory storage for relations (in production, use database)
let artworkProductRelations: ArtworkProductRelation[] = []

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { artwork_id, product_id, product_type } = req.query

    let filteredRelations = artworkProductRelations

    if (artwork_id) {
      filteredRelations = filteredRelations.filter(r => r.artwork_id === artwork_id)
    }
    if (product_id) {
      filteredRelations = filteredRelations.filter(r => r.product_id === product_id)
    }
    if (product_type) {
      filteredRelations = filteredRelations.filter(r => r.product_type === product_type)
    }

    res.json({ relations: filteredRelations })
  } catch (error) {
    console.error("Error fetching artwork-product relations:", error)
    res.status(500).json({ error: "Failed to fetch relations" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { artwork_id, product_id, product_type, is_primary = false, position = 0 } = req.body as any

    if (!artwork_id || !product_id || !product_type) {
      return res.status(400).json({ error: "artwork_id, product_id, and product_type are required" })
    }

    // Check if relation already exists
    const existingRelation = artworkProductRelations.find(
      r => r.artwork_id === artwork_id && r.product_id === product_id
    )

    if (existingRelation) {
      return res.status(400).json({ error: "Relation already exists" })
    }

    // If this is primary, unset other primary relations for the same product
    if (is_primary) {
      artworkProductRelations.forEach(r => {
        if (r.product_id === product_id) {
          r.is_primary = false
        }
      })
    }

    const newRelation: ArtworkProductRelation = {
      id: `rel_${Date.now()}`,
      artwork_id,
      product_id,
      product_type,
      is_primary,
      position,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    artworkProductRelations.push(newRelation)

    res.json({ relation: newRelation })
  } catch (error) {
    console.error("Error creating artwork-product relation:", error)
    res.status(500).json({ error: "Failed to create relation" })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { artwork_id, product_id } = req.query

    if (!artwork_id || !product_id) {
      return res.status(400).json({ error: "artwork_id and product_id are required" })
    }

    const initialLength = artworkProductRelations.length
    artworkProductRelations = artworkProductRelations.filter(
      r => !(r.artwork_id === artwork_id && r.product_id === product_id)
    )

    if (artworkProductRelations.length === initialLength) {
      return res.status(404).json({ error: "Relation not found" })
    }

    res.json({ deleted: true })
  } catch (error) {
    console.error("Error deleting artwork-product relation:", error)
    res.status(500).json({ error: "Failed to delete relation" })
  }
}