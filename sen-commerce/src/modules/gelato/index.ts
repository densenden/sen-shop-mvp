import { Module } from "@medusajs/framework/utils"
import { GelatoPodService } from "./services/gelato-pod-service"

export default Module("gelato", {
  service: GelatoPodService,
})
