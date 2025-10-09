import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { randomUUID } from "crypto"
import type { PrintfulStudioComposerData } from "../../../../modules/printful/services/studio/types"

// Shared session storage
declare global {
  var __printful_studio_composer_sessions: Map<string, PrintfulStudioComposerData> | undefined
}

if (!global.__printful_studio_composer_sessions) {
  global.__printful_studio_composer_sessions = new Map()
}

const composerSessions = global.__printful_studio_composer_sessions

/**
 * GET /admin/printful-studio/composer
 * List all active composer sessions
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const sessions = Array.from(composerSessions.values())

    res.json({
      sessions,
      count: sessions.length
    })
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to list composer sessions",
      error: error.message
    })
  }
}

/**
 * POST /admin/printful-studio/composer
 * Create a new composer session
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { artwork_id, catalog_product_id } = req.body as {
      artwork_id?: string
      catalog_product_id?: string
    }

    console.log('[composer] Creating session with:', {
      artwork_id,
      artwork_id_type: typeof artwork_id,
      catalog_product_id
    })

    const sessionId = randomUUID()
    const now = new Date().toISOString()

    const session: PrintfulStudioComposerData = {
      session_id: sessionId,
      state: artwork_id ? 'product_selection' : 'artwork_selection',
      artwork: {
        artwork_id: artwork_id || null,
        artwork_url: null,
        artwork_title: null,
        printful_file_id: null,
        placements: []
      },
      product: catalog_product_id ? {
        catalog_product_id,
        catalog_product_name: '',
        selected_variant_ids: [],
        selected_colors: [],
        selected_sizes: []
      } : null,
      design: null,
      mockups: null,
      details: null,
      pricing: null,
      created_at: now,
      updated_at: now
    }

    // If artwork_id provided, fetch artwork details
    if (artwork_id) {
      try {
        const artworkModuleService = req.scope.resolve("artworkModuleService")
        const artworks = await artworkModuleService.listArtworks({ id: artwork_id }, { limit: 1 })

        if (artworks && artworks.length > 0) {
          const artwork = artworks[0]
          session.artwork.artwork_url = artwork.image_url
          session.artwork.artwork_title = artwork.title
        }
      } catch (error) {
        console.warn('Failed to fetch artwork details:', error)
      }
    }

    composerSessions.set(sessionId, session)

    res.json(session)
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to create composer session",
      error: error.message
    })
  }
}
