import { asClass } from "awilix"
import { PrintfulFulfillmentService } from "../modules/printful/services/printful-fulfillment-service"
import { PrintfulOrderService } from "../modules/printful/services/printful-order-service"

export default async function printfulServicesLoader({ container }) {
  try {
    container.register({
      printfulFulfillmentService: asClass(PrintfulFulfillmentService).singleton(),
      printfulOrderService: asClass(PrintfulOrderService).singleton()
    })
    
    console.log("Printful services registered successfully")
  } catch (error) {
    console.error("Failed to register Printful services:", error)
  }
}