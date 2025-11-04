import { model } from "@medusajs/framework/utils"

/**
 * POD Template Entity
 * Stores template configurations for Print-on-Demand products
 * Supports multiple providers (Printful, Printify, Gelato) with versioning
 */
export const PODTemplate = model.define("pod_template", {
  id: model.id().primaryKey(),

  // Basic template information
  name: model.text(),
  description: model.text().nullable(),
  provider: model.text(), // 'printful' | 'printify' | 'gelato'

  // Template configuration stored as JSON
  variant_configs: model.json(), // Sizes, colors, options, etc.
  pricing_rules: model.json(), // Markup percentage, minimum price, etc.

  // Template metadata and settings
  metadata: model.json().nullable(),
  status: model.text().default("draft"), // 'draft' | 'active' | 'archived'

  // Versioning support
  version: model.number().default(1),
  cloned_from: model.text().nullable(), // ID of template this was cloned from

}).indexes([
  {
    on: ["provider"],
    name: "idx_pod_template_provider"
  },
  {
    on: ["status"],
    name: "idx_pod_template_status"
  },
  {
    on: ["provider", "status"],
    name: "idx_pod_template_provider_status"
  },
  {
    on: ["created_at"],
    name: "idx_pod_template_created"
  }
])

/**
 * POD Template Version Entity
 * Tracks version history of template changes
 */
export const PODTemplateVersion = model.define("pod_template_version", {
  id: model.id().primaryKey(),

  // Link to parent template
  template_id: model.text().index(),

  // Version information
  version_number: model.number(),
  changes: model.json(), // What changed in this version
  change_summary: model.text().nullable(), // Human-readable summary

  // Who made the change (could be extended to link to user)
  created_by: model.text().nullable(),

}).indexes([
  {
    on: ["template_id"],
    name: "idx_pod_template_version_template"
  },
  {
    on: ["template_id", "version_number"],
    name: "idx_pod_template_version_unique",
    unique: true
  },
  {
    on: ["created_at"],
    name: "idx_pod_template_version_created"
  }
])

/**
 * Link between templates and products
 * Tracks which products were created from which templates
 */
export const PODTemplateProductLink = model.define("pod_template_product_link", {
  id: model.id().primaryKey(),

  // Links
  template_id: model.text().index(),
  product_id: model.text().index(), // Links to Medusa product
  template_version: model.number(), // Which version of template was used

  // Application details
  applied_at: model.dateTime().default(() => new Date()),
  overrides: model.json().nullable(), // Any custom overrides applied

}).indexes([
  {
    on: ["template_id"],
    name: "idx_pod_template_product_template"
  },
  {
    on: ["product_id"],
    name: "idx_pod_template_product_product"
  },
  {
    on: ["template_id", "product_id"],
    name: "idx_pod_template_product_unique",
    unique: true
  }
])