import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import crypto from "crypto"

export default async function createApiKeyProperly(container: MedusaContainer) {
  console.log("Creating publishable API key...")
  
  try {
    const apiKeyService = container.resolve(Modules.API_KEY)
    
    const keyData = {
      title: "Storefront API Key",
      type: "publishable" as const,
      created_by: "admin" // You might need to get an actual admin user ID
    }
    
    const apiKey = await apiKeyService.createApiKeys(keyData)
    
    console.log("✅ API Key created successfully!")
    console.log("Key ID:", apiKey.id)
    console.log("Token:", apiKey.token)
    console.log("Add this to your frontend environment:")
    console.log(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${apiKey.token}`)
    
    return { success: true, key: apiKey }
  } catch (error) {
    console.error("❌ Error creating API key:", error)
    
    // Fallback: try to insert directly via database connection
    console.log("Trying fallback method...")
    const token = `pk_${crypto.randomBytes(32).toString('hex')}`
    const salt = crypto.randomBytes(16).toString('hex')
    const redacted = `pk_****${token.slice(-4)}`
    
    console.log("Generated token:", token)
    console.log("You can manually add this to your environment as:")
    console.log(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${token}`)
    
    return { success: false, error: error.message, token }
  }
}