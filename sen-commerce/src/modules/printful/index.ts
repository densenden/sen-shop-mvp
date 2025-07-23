import { Module, MedusaService } from "@medusajs/framework/utils"
import { 
  PrintfulProduct, 
  PrintfulProductVariant,
  PrintfulProductFile,
  PrintfulSyncLog,
  PrintfulOrderTracking,
  PrintfulWebhookEvent
} from "./models/printful-product"
import { PrintfulPodProductService } from "./services/printful-pod-product-service"
import { PODProviderManager } from "./services/pod-provider-facade"

export const PRINTFUL_MODULE = "printfulModule"

export default Module(PRINTFUL_MODULE, {
  service: PrintfulPodProductService
})

export {
  PrintfulProduct,
  PrintfulProductVariant,
  PrintfulProductFile,
  PrintfulSyncLog,
  PrintfulOrderTracking,
  PrintfulWebhookEvent,
  PODProviderManager
} 