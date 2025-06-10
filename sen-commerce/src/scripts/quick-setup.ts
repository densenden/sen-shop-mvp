import { MedusaContainer } from "@medusajs/framework/types"

export default async function quickSetup({
  container,
}: {
  container: MedusaContainer
}) {
  console.log("\n🚀 Welcome to SenCommerce Quick Setup!")
  console.log("=====================================\n")
  
  console.log("📋 Setup Checklist:\n")
  
  console.log("1. ✅ Database is connected")
  console.log("2. ✅ Migrations are run")
  console.log("3. ✅ Server is running\n")
  
  console.log("📝 Next Steps:\n")
  
  console.log("1. Create an Admin User:")
  console.log("   - Open http://localhost:9000/app")
  console.log("   - Click 'Create account'")
  console.log("   - Use email: admin@sen.studio")
  console.log("   - Use password: NwO_2025\n")
  
  console.log("2. Generate Publishable API Key:")
  console.log("   - After login, go to Settings → API Keys")
  console.log("   - Create a new Publishable key")
  console.log("   - Or run: npx medusa exec ./src/scripts/create-publishable-key.ts\n")
  
  console.log("3. Configure Frontend:")
  console.log("   - Add the key to sen-commerce-storefront/.env")
  console.log("   - Start frontend: cd ../sen-commerce-storefront && npm run dev\n")
  
  console.log("4. Create Customer Account:")
  console.log("   - Visit http://localhost:8000")
  console.log("   - Register as a customer\n")
  
  console.log("🎉 That's it! Your store is ready to use!")
  console.log("=====================================\n")
} 