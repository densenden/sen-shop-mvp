import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"
import { PODProviderManager } from "../../../../modules/printful/services/pod-provider-facade"
import { randomUUID } from "crypto"

interface BulkOperation {
  id: string
  type: 'price_update' | 'status_change' | 'metadata_update' | 'delete'
  product_ids: string[]
  providers: string[]
  data: Record<string, any>
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed'
  progress: {
    total: number
    completed: number
    failed: number
    errors: Array<{ product_id: string; error: string }>
  }
  created_at: string
  started_at?: string
  completed_at?: string
  cancelled_at?: string
}

// In-memory store for bulk operations (in production, use Redis or database)
const bulkOperations = new Map<string, BulkOperation>()

/**
 * POST /api/admin/pod-products/bulk
 * Start a bulk operation on multiple POD products
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const {
      type,
      product_ids,
      providers,
      data
    } = req.body as {
      type: BulkOperation['type']
      product_ids: string[]
      providers?: string[]
      data: Record<string, any>
    }

    if (!type || !product_ids || product_ids.length === 0) {
      return res.status(400).json({
        message: "Type and product_ids are required"
      })
    }

    const operationId = randomUUID()
    const operation: BulkOperation = {
      id: operationId,
      type,
      product_ids,
      providers: providers || [],
      data,
      status: 'pending',
      progress: {
        total: product_ids.length,
        completed: 0,
        failed: 0,
        errors: []
      },
      created_at: new Date().toISOString()
    }

    bulkOperations.set(operationId, operation)

    // Start processing in background
    processBulkOperation(operationId, req.scope)

    res.status(202).json({
      operation_id: operationId,
      status: 'pending',
      message: 'Bulk operation started'
    })

  } catch (error: any) {
    console.error("Error starting bulk operation:", error)
    res.status(500).json({
      message: "Failed to start bulk operation",
      error: error.message
    })
  }
}

/**
 * GET /api/admin/pod-products/bulk/[id]
 * Get status of a bulk operation
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const operationId = req.params.id

    if (!operationId) {
      return res.status(400).json({
        message: "Operation ID is required"
      })
    }

    const operation = bulkOperations.get(operationId)

    if (!operation) {
      return res.status(404).json({
        message: "Bulk operation not found"
      })
    }

    res.json({
      operation,
      progress_percentage: Math.round((operation.progress.completed / operation.progress.total) * 100)
    })

  } catch (error: any) {
    console.error("Error getting bulk operation status:", error)
    res.status(500).json({
      message: "Failed to get bulk operation status",
      error: error.message
    })
  }
}

/**
 * DELETE /api/admin/pod-products/bulk/[id]
 * Cancel a running bulk operation
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const operationId = req.params.id

    if (!operationId) {
      return res.status(400).json({
        message: "Operation ID is required"
      })
    }

    const operation = bulkOperations.get(operationId)

    if (!operation) {
      return res.status(404).json({
        message: "Bulk operation not found"
      })
    }

    if (operation.status === 'completed' || operation.status === 'cancelled') {
      return res.status(400).json({
        message: "Cannot cancel completed or already cancelled operation"
      })
    }

    operation.status = 'cancelled'
    operation.cancelled_at = new Date().toISOString()
    bulkOperations.set(operationId, operation)

    res.json({
      message: "Bulk operation cancelled",
      operation_id: operationId
    })

  } catch (error: any) {
    console.error("Error cancelling bulk operation:", error)
    res.status(500).json({
      message: "Failed to cancel bulk operation",
      error: error.message
    })
  }
}

/**
 * Process bulk operation in background
 */
async function processBulkOperation(operationId: string, scope: any) {
  const operation = bulkOperations.get(operationId)
  if (!operation) return

  try {
    operation.status = 'running'
    operation.started_at = new Date().toISOString()
    bulkOperations.set(operationId, operation)

    const podProviderManager: PODProviderManager = scope.resolve("printfulModule")

    for (const productId of operation.product_ids) {
      // Check if operation was cancelled
      const currentOperation = bulkOperations.get(operationId)
      if (currentOperation?.status === 'cancelled') {
        break
      }

      try {
        await processSingleProduct(productId, operation, podProviderManager)
        operation.progress.completed++
      } catch (error: any) {
        operation.progress.failed++
        operation.progress.errors.push({
          product_id: productId,
          error: error.message
        })
      }

      bulkOperations.set(operationId, operation)
    }

    // Mark as completed if not cancelled
    if (operation.status !== 'cancelled') {
      operation.status = 'completed'
      operation.completed_at = new Date().toISOString()
      bulkOperations.set(operationId, operation)
    }

  } catch (error: any) {
    operation.status = 'failed'
    operation.progress.errors.push({
      product_id: 'general',
      error: error.message
    })
    bulkOperations.set(operationId, operation)
  }
}

/**
 * Process a single product in bulk operation
 */
async function processSingleProduct(
  productId: string,
  operation: BulkOperation,
  podProviderManager: PODProviderManager
) {
  // Determine provider for this product
  let provider: string | undefined

  if (operation.providers.length === 1) {
    provider = operation.providers[0]
  } else if (operation.providers.length > 1) {
    // Try to determine provider from product metadata or use first available
    provider = operation.providers[0]
  }

  switch (operation.type) {
    case 'price_update':
      await updateProductPrice(productId, operation.data, podProviderManager, provider)
      break

    case 'status_change':
      await updateProductStatus(productId, operation.data, podProviderManager, provider)
      break

    case 'metadata_update':
      await updateProductMetadata(productId, operation.data, podProviderManager, provider)
      break

    case 'delete':
      await deleteProduct(productId, podProviderManager, provider)
      break

    default:
      throw new Error(`Unknown operation type: ${operation.type}`)
  }
}

/**
 * Update product price
 */
async function updateProductPrice(
  productId: string,
  data: any,
  podProviderManager: PODProviderManager,
  provider?: string
) {
  const { price_adjustment_type, price_adjustment_value } = data

  // Get current product
  const product = await podProviderManager.getProduct(productId, provider)
  if (!product) {
    throw new Error(`Product ${productId} not found`)
  }

  let newPrice: number
  if (price_adjustment_type === 'percentage') {
    newPrice = (product.price || 0) * (1 + price_adjustment_value / 100)
  } else if (price_adjustment_type === 'fixed') {
    newPrice = (product.price || 0) + price_adjustment_value
  } else {
    newPrice = price_adjustment_value
  }

  await podProviderManager.updateProduct(productId, { price: newPrice }, provider)
}

/**
 * Update product status
 */
async function updateProductStatus(
  productId: string,
  data: any,
  podProviderManager: PODProviderManager,
  provider?: string
) {
  const { status } = data
  await podProviderManager.updateProduct(productId, { status }, provider)
}

/**
 * Update product metadata
 */
async function updateProductMetadata(
  productId: string,
  data: any,
  podProviderManager: PODProviderManager,
  provider?: string
) {
  const { metadata } = data
  await podProviderManager.updateProduct(productId, { metadata }, provider)
}

/**
 * Delete product
 */
async function deleteProduct(
  productId: string,
  podProviderManager: PODProviderManager,
  provider?: string
) {
  await podProviderManager.deleteProduct(productId, provider)
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]