import { model } from "@medusajs/framework/utils"

export const ArtworkCollection = model.define("artwork_collection", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  topic: model.text().nullable(),
  month_created: model.text().nullable(),
  midjourney_version: model.text().nullable(),
  purpose: model.text().nullable(),
  thumbnail_url: model.text().nullable(),
  
  // Brand Story & Identity
  brand_story: model.text().nullable(),
  genesis_story: model.text().nullable(),
  design_philosophy: model.text().nullable(),
  
  // Marketing Keywords & Topics stored as JSON
  core_values: model.json().nullable(), // Array of strings
  visual_themes: model.json().nullable(), // Array of strings
  lifestyle_concepts: model.json().nullable(), // Array of strings
  
  // Campaign & Messaging
  campaign_ideas: model.json().nullable(), // Array of objects with title and description
  target_audience_messaging: model.text().nullable(),
  brand_tagline: model.text().nullable(),
  
  // Additional metadata
  brand_colors: model.json().nullable(), // Array of hex colors
  brand_fonts: model.json().nullable(), // Array of font names
  social_media_tags: model.json().nullable(), // Array of hashtags
}) 