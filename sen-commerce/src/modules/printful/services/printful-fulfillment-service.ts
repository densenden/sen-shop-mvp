import { MedusaService } from "@medusajs/framework/utils"
import { PrintfulOrderService } from "./printful-order-service"

interface FulfillmentWorkflowStep {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  timestamp?: string
  error?: string
}

interface PrintfulFulfillmentData {
  medusa_order_id: string
  printful_order_id: string
  status: string
  tracking_number?: string
  tracking_url?: string
  shipped_at?: string
  delivered_at?: string
  workflow_steps: FulfillmentWorkflowStep[]
}

export class PrintfulFulfillmentService extends MedusaService({}) {
  private orderService: PrintfulOrderService
  private container: any

  constructor(container: any, options?: any) {
    super(container, options)
    this.container = container
    this.orderService = new PrintfulOrderService(container, options)
  }

  // Main fulfillment workflow
  async processFulfillment(medusaOrder: any): Promise<PrintfulFulfillmentData> {
    const fulfillmentData: PrintfulFulfillmentData = {
      medusa_order_id: medusaOrder.id,
      printful_order_id: '',
      status: 'pending',
      workflow_steps: []
    }

    try {
      // Step 1: Validate order has Printful products
      const validationStep = await this.validateOrder(medusaOrder)
      fulfillmentData.workflow_steps.push(validationStep)
      
      if (validationStep.status === 'failed') {
        fulfillmentData.status = 'failed'
        return fulfillmentData
      }

      // Step 2: Convert Medusa order to Printful format
      const conversionStep = await this.convertOrder(medusaOrder)
      fulfillmentData.workflow_steps.push(conversionStep)
      
      if (conversionStep.status === 'failed') {
        fulfillmentData.status = 'failed'
        return fulfillmentData
      }

      // Step 3: Create order in Printful
      const creationStep = await this.createPrintfulOrder(medusaOrder)
      fulfillmentData.workflow_steps.push(creationStep)
      
      if (creationStep.status === 'failed') {
        fulfillmentData.status = 'failed'
        return fulfillmentData
      }

      // Extract Printful order ID from creation step
      const printfulOrderId = creationStep.id
      fulfillmentData.printful_order_id = printfulOrderId

      // Step 4: Confirm order for production
      const confirmationStep = await this.confirmOrder(printfulOrderId)
      fulfillmentData.workflow_steps.push(confirmationStep)
      
      if (confirmationStep.status === 'failed') {
        fulfillmentData.status = 'failed'
        return fulfillmentData
      }

      // Step 5: Update Medusa order with fulfillment info
      const updateStep = await this.updateMedusaOrder(medusaOrder.id, printfulOrderId)
      fulfillmentData.workflow_steps.push(updateStep)

      fulfillmentData.status = 'in_progress'
      return fulfillmentData

    } catch (error: any) {
      console.error('Fulfillment workflow error:', error)
      fulfillmentData.status = 'failed'
      fulfillmentData.workflow_steps.push({
        id: 'error',
        name: 'Workflow Error',
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error.message
      })
      return fulfillmentData
    }
  }

  // Validate that order contains Printful products
  private async validateOrder(medusaOrder: any): Promise<FulfillmentWorkflowStep> {
    const step: FulfillmentWorkflowStep = {
      id: 'validation',
      name: 'Validate Order',
      status: 'in_progress',
      timestamp: new Date().toISOString()
    }

    try {
      const items = medusaOrder.items || []
      const printfulItems = items.filter((item: any) => 
        item.metadata?.product_type === 'printful_pod'
      )

      if (printfulItems.length === 0) {
        step.status = 'failed'
        step.error = 'No Printful products found in order'
        return step
      }

      // Validate required fields
      if (!medusaOrder.shipping_address) {
        step.status = 'failed'
        step.error = 'Shipping address is required'
        return step
      }

      if (!medusaOrder.email) {
        step.status = 'failed'
        step.error = 'Customer email is required'
        return step
      }

      step.status = 'completed'
      return step

    } catch (error: any) {
      step.status = 'failed'
      step.error = error.message
      return step
    }
  }

  // Convert Medusa order to Printful format
  private async convertOrder(medusaOrder: any): Promise<FulfillmentWorkflowStep> {
    const step: FulfillmentWorkflowStep = {
      id: 'conversion',
      name: 'Convert Order Format',
      status: 'in_progress',
      timestamp: new Date().toISOString()
    }

    try {
      const printfulOrder = await this.orderService.convertMedusaOrderToPrintful(medusaOrder)
      
      if (!printfulOrder.items || printfulOrder.items.length === 0) {
        step.status = 'failed'
        step.error = 'No items to convert'
        return step
      }

      step.status = 'completed'
      return step

    } catch (error: any) {
      step.status = 'failed'
      step.error = error.message
      return step
    }
  }

  // Create order in Printful
  private async createPrintfulOrder(medusaOrder: any): Promise<FulfillmentWorkflowStep> {
    const step: FulfillmentWorkflowStep = {
      id: 'creation',
      name: 'Create Printful Order',
      status: 'in_progress',
      timestamp: new Date().toISOString()
    }

    try {
      const printfulOrderData = await this.orderService.convertMedusaOrderToPrintful(medusaOrder)
      const printfulOrder = await this.orderService.createOrder(printfulOrderData)
      
      step.status = 'completed'
      step.id = printfulOrder.id // Store the Printful order ID
      return step

    } catch (error: any) {
      step.status = 'failed'
      step.error = error.message
      return step
    }
  }

  // Confirm order for production
  private async confirmOrder(printfulOrderId: string): Promise<FulfillmentWorkflowStep> {
    const step: FulfillmentWorkflowStep = {
      id: 'confirmation',
      name: 'Confirm Order',
      status: 'in_progress',
      timestamp: new Date().toISOString()
    }

    try {
      await this.orderService.confirmOrder(printfulOrderId)
      step.status = 'completed'
      return step

    } catch (error: any) {
      step.status = 'failed'
      step.error = error.message
      return step
    }
  }

  // Update Medusa order with fulfillment information
  private async updateMedusaOrder(medusaOrderId: string, printfulOrderId: string): Promise<FulfillmentWorkflowStep> {
    const step: FulfillmentWorkflowStep = {
      id: 'update',
      name: 'Update Medusa Order',
      status: 'in_progress',
      timestamp: new Date().toISOString()
    }

    try {
      // Update order metadata with Printful info
      // This would use Medusa's order update workflow
      const { updateOrderWorkflow } = require("@medusajs/medusa/core-flows")
      
      await updateOrderWorkflow(this.container).run({
        input: {
          id: medusaOrderId,
          metadata: {
            printful_order_id: printfulOrderId,
            fulfillment_provider: 'printful'
          }
        }
      })

      step.status = 'completed'
      return step

    } catch (error: any) {
      step.status = 'failed'
      step.error = error.message
      return step
    }
  }

  // Check fulfillment status
  async checkFulfillmentStatus(printfulOrderId: string): Promise<any> {
    try {
      const printfulOrder = await this.orderService.getOrder(printfulOrderId)
      
      if (!printfulOrder) {
        return { status: 'not_found' }
      }

      return {
        status: printfulOrder.status,
        tracking_number: printfulOrder.tracking_number,
        tracking_url: printfulOrder.tracking_url,
        updated_at: printfulOrder.updated_at
      }

    } catch (error: any) {
      console.error('Error checking fulfillment status:', error)
      return { status: 'error', error: error.message }
    }
  }

  // Handle fulfillment status updates (called by webhooks)
  async handleStatusUpdate(printfulOrderId: string, newStatus: string, trackingData?: any): Promise<void> {
    try {
      // Find the corresponding Medusa order
      // This would query your database to find the order by printful_order_id
      console.log(`Handling status update for Printful order ${printfulOrderId}: ${newStatus}`)
      
      // Update the Medusa order status accordingly
      const statusMapping = {
        'pending': 'pending',
        'draft': 'pending',
        'confirmed': 'processing',
        'in_production': 'processing',
        'shipped': 'shipped',
        'delivered': 'delivered',
        'cancelled': 'cancelled'
      }

      const medusaStatus = statusMapping[newStatus] || 'pending'
      
      // Update order status in Medusa
      // This would use Medusa's fulfillment workflow
      console.log(`Updating Medusa order status to: ${medusaStatus}`)
      
      // If tracking info is available, update that too
      if (trackingData) {
        console.log(`Updating tracking info: ${trackingData.tracking_number}`)
      }

    } catch (error: any) {
      console.error('Error handling status update:', error)
      throw error
    }
  }

  // Cancel fulfillment
  async cancelFulfillment(printfulOrderId: string): Promise<boolean> {
    try {
      const success = await this.orderService.cancelOrder(printfulOrderId)
      
      if (success) {
        console.log(`Successfully cancelled Printful order: ${printfulOrderId}`)
      }
      
      return success

    } catch (error: any) {
      console.error('Error cancelling fulfillment:', error)
      throw error
    }
  }

  // Get fulfillment history
  async getFulfillmentHistory(printfulOrderId: string): Promise<any> {
    try {
      const order = await this.orderService.getOrder(printfulOrderId)
      
      if (!order) {
        return null
      }

      return {
        order_id: order.id,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        items: order.items
      }

    } catch (error: any) {
      console.error('Error getting fulfillment history:', error)
      throw error
    }
  }
}