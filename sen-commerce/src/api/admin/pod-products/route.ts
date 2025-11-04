import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"
import { PODProviderManager } from "../../../modules/printful/services/pod-provider-facade"

interface PODProductQueryParams {
  provider?: string | string[]
  q?: string
  limit?: string
  offset?: string
  status?: string
  sort?: string
  order?: 'asc' | 'desc'
}

interface PODProductWithSync {
  id: string
  name: string
  description?: string
  thumbnail_url: string
  price?: number
  variants?: any[]
  metadata?: Record<string, any>
  provider: string
  sync_status?: {
    last_sync: string
    status: 'synced' | 'syncing' | 'error' | 'never'
    error_message?: string
  }
}

/**
 * GET /api/admin/pod-products
 * Unified endpoint to fetch products from all POD providers
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const {
      provider,
      q,
      limit = '50',
      offset = '0',
      status,
      sort = 'name',
      order = 'asc'
    } = req.query as PODProductQueryParams

    const podProviderManager: PODProviderManager = req.scope.resolve("printfulModule")

    let products: PODProductWithSync[] = []

    // Fetch from specific providers or all providers
    if (provider) {
      const providers = Array.isArray(provider) ? provider : [provider]
      products = await podProviderManager.fetchProductsFromProviders(providers)
    } else {
      products = await podProviderManager.fetchProductsFromAllProviders()
    }

    // Add sync status information
    const productsWithSync = await Promise.all(
      products.map(async (product) => {
        const syncStatus = await getSyncStatus(product.id, product.provider)
        return {
          ...product,
          sync_status: syncStatus
        }
      })
    )

    // Apply search filter
    let filteredProducts = productsWithSync
    if (q) {
      const searchTerm = q.toLowerCase()
      filteredProducts = productsWithSync.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
      )
    }

    // Apply status filter
    if (status) {
      filteredProducts = filteredProducts.filter(product =>
        product.sync_status?.status === status
      )
    }

    // Sort products
    filteredProducts.sort((a, b) => {
      const direction = order === 'desc' ? -1 : 1
      const aValue = getValueForSort(a, sort)
      const bValue = getValueForSort(b, sort)

      if (aValue < bValue) return -1 * direction
      if (aValue > bValue) return 1 * direction
      return 0
    })

    // Apply pagination
    const limitNum = parseInt(limit)
    const offsetNum = parseInt(offset)
    const paginatedProducts = filteredProducts.slice(offsetNum, offsetNum + limitNum)

    // Get provider health status
    const healthStatuses = await podProviderManager.checkAllProvidersHealth()

    res.json({
      products: paginatedProducts,
      count: filteredProducts.length,
      total: filteredProducts.length,
      has_more: offsetNum + limitNum < filteredProducts.length,
      provider_health: healthStatuses,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: filteredProducts.length
      }
    })

  } catch (error: any) {
    console.error("Error fetching POD products:", error)
    res.status(500).json({
      message: "Failed to fetch POD products",
      error: error.message
    })
  }
}

/**
 * Helper function to get sync status for a product
 */
async function getSyncStatus(productId: string, provider: string) {
  try {
    // In a real implementation, this would check a sync status table/cache
    // For now, we'll return mock status
    const statuses = ['synced', 'syncing', 'error', 'never'] as const
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    return {
      last_sync: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random within last 24h
      status: randomStatus,
      error_message: randomStatus === 'error' ? 'API rate limit exceeded' : undefined
    }
  } catch (error) {
    return {
      last_sync: '',
      status: 'never' as const,
      error_message: 'Unable to determine sync status'
    }
  }
}

/**
 * Helper function to get value for sorting
 */
function getValueForSort(product: PODProductWithSync, sortField: string): any {
  switch (sortField) {
    case 'name':
      return product.name || ''
    case 'price':
      return product.price || 0
    case 'provider':
      return product.provider || ''
    case 'sync_status':
      return product.sync_status?.last_sync || ''
    default:
      return product.name || ''
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]