// Printful module entry point
import { PrintfulProduct } from "./models/printful-product"
import { PrintfulPodProductService } from "./services/printful-pod-product-service"

export const service = PrintfulPodProductService

export { PrintfulProduct } from "./models/printful-product"

export const repository = PrintfulProduct

export default { service } 