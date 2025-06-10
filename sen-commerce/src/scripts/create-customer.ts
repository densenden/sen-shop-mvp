import { MedusaContainer } from "@medusajs/framework/types"

export default async function createCustomer({ container }: { container: MedusaContainer }) {
  console.log("Creating customer user...")

  const customerModule = container.resolve("@medusajs/customer") as any
  
  try {
    // Check if customer already exists
    const existingCustomers = await customerModule.listCustomers({
      email: "customer@example.com"
    })

    if (existingCustomers.length === 0) {
      // Create new customer
      const customer = await customerModule.createCustomers({
        email: "customer@example.com",
        password: "customer123",
        first_name: "Test",
        last_name: "Customer",
        phone: "+1234567890"
      })
      
      console.log("Created customer:", customer.email)
      console.log("\nCustomer login credentials:")
      console.log("Email: customer@example.com")
      console.log("Password: customer123")
    } else {
      console.log("Customer already exists")
    }
  } catch (error) {
    console.error("Error creating customer:", error)
  }
} 