import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { PrintfulStudioComposerData } from "../../../../../modules/printful/services/studio/types"

// Shared session storage (imported from parent route in production, use centralized store)
declare global {
  var __printful_studio_composer_sessions: Map<string, PrintfulStudioComposerData> | undefined
}

if (!global.__printful_studio_composer_sessions) {
  global.__printful_studio_composer_sessions = new Map()
}

const composerSessions = global.__printful_studio_composer_sessions

/**
 * GET /admin/printful-studio/composer/:sessionId
 * Get composer session details
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const sessionId = req.params.sessionId

    const session = composerSessions.get(sessionId)

    if (!session) {
      return res.status(404).json({
        message: "Composer session not found"
      })
    }

    res.json(session)
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to get composer session",
      error: error.message
    })
  }
}

/**
 * PUT /admin/printful-studio/composer/:sessionId
 * Update composer session data
 */
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const sessionId = req.params.sessionId
    const updates = req.body as Partial<PrintfulStudioComposerData>

    const session = composerSessions.get(sessionId)

    if (!session) {
      return res.status(404).json({
        message: "Composer session not found"
      })
    }

    // Update session with provided data
    const updatedSession: PrintfulStudioComposerData = {
      ...session,
      ...updates,
      session_id: sessionId, // Prevent overriding session ID
      updated_at: new Date().toISOString()
    }

    composerSessions.set(sessionId, updatedSession)

    res.json(updatedSession)
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to update composer session",
      error: error.message
    })
  }
}

/**
 * DELETE /admin/printful-studio/composer/:sessionId
 * Delete composer session
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const sessionId = req.params.sessionId

    const existed = composerSessions.delete(sessionId)

    if (!existed) {
      return res.status(404).json({
        message: "Composer session not found"
      })
    }

    res.json({ success: true, deleted: sessionId })
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to delete composer session",
      error: error.message
    })
  }
}
