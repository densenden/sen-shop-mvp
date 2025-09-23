import type { MedusaRequest } from "@medusajs/framework/http"
import type { PrintfulStudioVersion } from "../../../modules/printful/services/studio"
import { PrintfulStudioServiceV1, PrintfulStudioServiceV2 } from "../../../modules/printful/services/studio"

export function resolvePrintfulStudioService(req: MedusaRequest, versionParam: string) {
  const normalized = (versionParam || "").toLowerCase()

  if (normalized === "v1") {
    return new PrintfulStudioServiceV1(req.scope)
  }

  if (normalized === "v2") {
    return new PrintfulStudioServiceV2(req.scope)
  }

  throw new Error(`Unsupported Printful Studio version '${versionParam}'`)
}

export function assertVersion(versionParam: string): PrintfulStudioVersion {
  const normalized = (versionParam || "").toLowerCase()
  if (normalized === "v1" || normalized === "v2") {
    return normalized
  }
  throw new Error(`Unsupported Printful Studio version '${versionParam}'`)
}
