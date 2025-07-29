import { Module } from "@medusajs/framework/utils"
import OrderService from "./service"

export const ORDER_MODULE = "orderModule"

export default Module(ORDER_MODULE, {
  service: OrderService,
})