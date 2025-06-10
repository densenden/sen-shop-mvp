import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function createPublishableKey({
  container,
}: {
  container: MedusaContainer
}) {
  try {
    const apiKeyModule = container.resolve(Modules.API_KEY)
    
    // Create a publishable API key for storefront
    const apiKey = await apiKeyModule.createApiKeys({
      title: "Storefront Publishable Key",
      type: "publishable",
      created_by: "system"
    })

    console.log("\n✅ Created Publishable API Key Successfully!")
    console.log("=====================================")
    console.log("Key:", apiKey.token)
    console.log("ID:", apiKey.id)
    console.log("\n📝 Next Steps:")
    console.log("1. Add this to your .env file in sen-commerce-storefront:")
    console.log(`   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${apiKey.token}`)
    console.log("\n2. Restart your frontend dev server")
    console.log("=====================================\n")
    
    return apiKey
  } catch (error: any) {
    console.error("\n❌ Error creating publishable key:", error.message)
    console.log("\n💡 Make sure:")
    console.log("1. Your Medusa server is running (npm run dev)")
    console.log("2. Database is properly connected")
    console.log("3. All migrations have been run")
    throw error
  }
} 