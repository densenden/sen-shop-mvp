import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export default async function createPublishableKey() {
  console.log("Creating publishable API key...")
  
  try {
    const key = "pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0"
    
    // For now, let's just log that we need to create this key manually via the admin
    console.log("Key to create:", key)
    console.log("This key needs to be created via the Medusa admin interface or by running SQL directly")
    console.log("You can access the admin at: http://localhost:9000/app")
    
    // SQL to insert the key directly
    const sql = `
INSERT INTO publishable_api_key (id, title, created_at, updated_at) 
VALUES ('${key}', 'Storefront API Key', NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;
    `
    
    console.log("SQL to create key:")
    console.log(sql)
    
    return { success: true, key }
  } catch (error) {
    console.error("❌ Error:", error)
    return { success: false, error: error.message }
  }
}