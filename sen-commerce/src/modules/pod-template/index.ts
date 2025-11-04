import { Module } from "@medusajs/framework/utils"
import { PODTemplateModuleService } from "./services/pod-template-service"

export const PODTemplateModule = Module("pod-template", {
  service: PODTemplateModuleService,
})

export * from "./models"
export * from "./services/pod-template-service"