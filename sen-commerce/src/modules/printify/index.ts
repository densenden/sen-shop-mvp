import { Module } from "@medusajs/framework/utils"
import PrintifyService from "./services/printify-service"

export const PRINTIFY_MODULE = "printifyService"

export default Module(PRINTIFY_MODULE, {
  service: PrintifyService,
})
