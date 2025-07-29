import { Module } from "@medusajs/framework/utils"
import CustomerService from "./service"

export const CUSTOMER_MODULE = "customerModule"

export default Module(CUSTOMER_MODULE, {
  service: CustomerService,
})