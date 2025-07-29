import { model } from "@medusajs/framework/utils"

export const CustomOrder = model.define("custom_order", {
  id: model.id().primaryKey(),
  display_id: model.number().index(),
  customer_id: model.text().index(),
  email: model.text(),
  status: model.enum([
    "pending",
    "processing", 
    "completed",
    "cancelled",
    "requires_action"
  ]).default("pending"),
  fulfillment_status: model.enum([
    "not_fulfilled",
    "partially_fulfilled",
    "fulfilled",
    "partially_shipped",
    "shipped",
    "cancelled"
  ]).default("not_fulfilled"),
  payment_status: model.enum([
    "not_paid",
    "awaiting",
    "captured",
    "partially_refunded",
    "refunded",
    "cancelled"
  ]).default("not_paid"),
  currency_code: model.text().default("usd"),
  total: model.bigNumber(),
  subtotal: model.bigNumber(),
  tax_total: model.bigNumber().default(0),
  discount_total: model.bigNumber().default(0),
  shipping_total: model.bigNumber().default(0),
  gift_card_total: model.bigNumber().default(0),
  metadata: model.json().nullable(),
}).indexes([
  {
    on: ["customer_id", "created_at"],
  },
  {
    on: ["display_id"],
    unique: true,
  }
])

export const CustomOrderItem = model.define("custom_order_item", {
  id: model.id().primaryKey(),
  order_id: model.text().index(),
  product_id: model.text().nullable(),
  variant_id: model.text().nullable(),
  title: model.text(),
  description: model.text().nullable(),
  thumbnail: model.text().nullable(),
  quantity: model.number(),
  unit_price: model.bigNumber(),
  total: model.bigNumber(),
  subtotal: model.bigNumber(),
  tax_total: model.bigNumber().default(0),
  discount_total: model.bigNumber().default(0),
  metadata: model.json().nullable(),
}).indexes([
  {
    on: ["order_id"],
  }
])

export const CustomOrderShippingAddress = model.define("custom_order_shipping_address", {
  id: model.id().primaryKey(),
  order_id: model.text().index(),
  first_name: model.text(),
  last_name: model.text(),
  company: model.text().nullable(),
  address_1: model.text(),
  address_2: model.text().nullable(),
  city: model.text(),
  province: model.text().nullable(),
  postal_code: model.text(),
  country_code: model.text(),
  phone: model.text().nullable(),
})