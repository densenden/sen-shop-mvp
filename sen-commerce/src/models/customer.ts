import { model } from "@medusajs/framework/utils"

export const Customer = model.define("customer", {
  id: model.id().primaryKey(),
  email: model.text().unique().index(),
  password_hash: model.text(),
  first_name: model.text().nullable(),
  last_name: model.text().nullable(),
  phone: model.text().nullable(),
  has_account: model.boolean().default(false),
  // Email preferences
  email_notifications: model.boolean().default(true), // Order confirmations, download links, etc.
  marketing_emails: model.boolean().default(true), // Promotional emails, newsletters
  metadata: model.json().nullable(),
})

export const CustomerAddress = model.define("customer_address", {
  id: model.id().primaryKey(),
  customer_id: model.text().index(),
  address_name: model.text().nullable(),
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
  is_default_shipping: model.boolean().default(false),
  is_default_billing: model.boolean().default(false),
  metadata: model.json().nullable(),
}).indexes([
  {
    on: ["customer_id"],
  }
])