import { MedusaService } from "@medusajs/framework/utils"
import { Customer, CustomerAddress } from "../../models/customer"
import bcrypt from "bcrypt"

export default class CustomerService extends MedusaService({
  Customer,
  CustomerAddress,
}) {
  async createCustomer(data: {
    email: string
    password?: string
    first_name?: string
    last_name?: string
    phone?: string
    has_account?: boolean
  }) {
    // Check if customer already exists
    const existingCustomer = await this.listCustomers({ email: data.email })
    if (existingCustomer.length > 0) {
      throw new Error("Customer with this email already exists")
    }

    // Hash password if provided
    let password_hash = null
    if (data.password) {
      password_hash = await bcrypt.hash(data.password, 10)
    }

    // Create customer
    const customer = await this.createCustomers({
      ...data,
      password_hash,
      has_account: !!data.password,
    })

    return customer
  }

  async authenticateCustomer(email: string, password: string) {
    const customers = await this.listCustomers({ email })
    if (customers.length === 0) {
      throw new Error("Invalid email or password")
    }

    const customer = customers[0]
    if (!customer.password_hash) {
      throw new Error("Customer does not have a password set")
    }

    const isValid = await bcrypt.compare(password, customer.password_hash)
    if (!isValid) {
      throw new Error("Invalid email or password")
    }

    // Remove password hash from response
    const { password_hash, ...customerData } = customer
    return customerData
  }

  async updateCustomerPassword(customerId: string, oldPassword: string, newPassword: string) {
    const customer = await this.retrieveCustomer(customerId)
    
    if (!customer.password_hash) {
      throw new Error("Customer does not have a password set")
    }

    const isValid = await bcrypt.compare(oldPassword, customer.password_hash)
    if (!isValid) {
      throw new Error("Invalid old password")
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    await this.updateCustomers(customerId, {
      password_hash: newPasswordHash,
    })

    return { success: true }
  }

  async createCustomerAddress(customerId: string, addressData: any) {
    // Check if this should be the default address
    const existingAddresses = await this.listCustomerAddresses({ customer_id: customerId })
    
    const isFirstAddress = existingAddresses.length === 0
    const address = await this.createCustomerAddresses({
      ...addressData,
      customer_id: customerId,
      is_default_shipping: addressData.is_default_shipping ?? isFirstAddress,
      is_default_billing: addressData.is_default_billing ?? isFirstAddress,
    })

    return address
  }

  async setDefaultAddress(customerId: string, addressId: string, type: "shipping" | "billing") {
    // First, unset all other default addresses of this type
    const addresses = await this.listCustomerAddresses({ customer_id: customerId })
    
    for (const addr of addresses) {
      if (type === "shipping" && addr.is_default_shipping && addr.id !== addressId) {
        await this.updateCustomerAddresses(addr.id, { is_default_shipping: false })
      }
      if (type === "billing" && addr.is_default_billing && addr.id !== addressId) {
        await this.updateCustomerAddresses(addr.id, { is_default_billing: false })
      }
    }

    // Set the new default
    const updateData = type === "shipping" 
      ? { is_default_shipping: true }
      : { is_default_billing: true }
    
    await this.updateCustomerAddresses(addressId, updateData)
    
    return { success: true }
  }
}