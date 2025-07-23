console.log("[Medusa] Loaded /api/admin/product-sync route.ts")
import { PrintfulPodProductService } from "../../../modules/printful/services/printful-pod-product-service"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

interface SyncLog {
  id: string
  product_id?: string
  product_name?: string
  sync_type: string
  status: string
  provider_type: string
  error_message?: string
  sync_data?: any
  created_at: string
  completed_at?: string
}

interface SyncStats {
  total: number
  pending: number
  success: number
  failed: number
  in_progress: number
}

// In-memory storage for sync logs (in production, use database)
let syncLogs: SyncLog[] = []

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Product Sync] GET request received")
  try {
    let printfulProducts: any[] = []
    let digitalProducts: any[] = []
    let existingPrintfulProducts: any[] = []

    // Try to get Printful products
    try {
      const printfulService = req.scope.resolve("printfulModule") as any
      printfulProducts = await printfulService.fetchStoreProducts()
      existingPrintfulProducts = await printfulService.listPrintfulProducts()
    } catch (error) {
      console.log("Printful service not available:", error.message)
    }

    // Try to get digital products
    try {
      const digitalProductService = req.scope.resolve("digitalProductModuleService") as any
      digitalProducts = await digitalProductService.listDigitalProducts({})
    } catch (error) {
      console.log("Digital product service not available:", error.message)
    }
    
    // Calculate stats
    const stats = syncLogs.reduce((acc, log) => {
      acc.total += 1
      switch (log.status) {
        case "pending":
          acc.pending += 1
          break
        case "success":
          acc.success += 1
          break
        case "failed":
          acc.failed += 1
          break
        case "in_progress":
          acc.in_progress += 1
          break
      }
      return acc
    }, { total: 0, pending: 0, success: 0, failed: 0, in_progress: 0 })

    // Format available products for import
    const availableProducts = {
      printful: printfulProducts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        thumbnail_url: p.thumbnail_url,
        status: 'available',
        provider: 'printful',
        already_imported: existingPrintfulProducts.some(ep => ep.printful_product_id === p.id)
      })),
      digital: digitalProducts.map(dp => ({
        id: dp.id,
        name: dp.name,
        description: dp.description,
        file_size: dp.file_size,
        mime_type: dp.mime_type,
        status: 'available',
        provider: 'digital',
        already_imported: false // TODO: Check if linked to Medusa product
      }))
    }

    res.json({
      logs: syncLogs,
      stats,
      available_products: availableProducts
    })
  } catch (error) {
    console.error("[Product Sync] Error fetching sync data:", error)
    console.error("[Product Sync] Error stack:", error.stack)
    res.status(500).json({ error: "Failed to fetch sync data" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { action, provider = "printful", product_ids = [] } = req.body as {
      action: "bulk_import" | "update_prices" | "check_inventory" | "import_products"
      provider?: string
      product_ids?: string[]
    }

    if (action === "import_products") {
      return await importProducts(req, res, provider, product_ids)
    }

    // Create sync log entry
    const syncLog: SyncLog = {
      id: `sync_${Date.now()}`,
      sync_type: action,
      status: "in_progress",
      provider_type: provider,
      created_at: new Date().toISOString()
    }

    syncLogs.unshift(syncLog)

    // Process the sync asynchronously
    processSync(syncLog.id, action, provider)

    res.json({ success: true, syncId: syncLog.id })
  } catch (error) {
    console.error("Error starting sync:", error)
    res.status(500).json({ error: "Failed to start sync" })
  }
}

async function processSync(syncId: string, action: string, provider: string) {
  const logIndex = syncLogs.findIndex(log => log.id === syncId)
  if (logIndex === -1) return

  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))

    switch (action) {
      case "bulk_import":
        await performBulkImport(syncId, provider)
        break
      case "update_prices":
        await updatePrices(syncId, provider)
        break
      case "check_inventory":
        await checkInventory(syncId, provider)
        break
    }

    // Update log as completed
    syncLogs[logIndex].status = "success"
    syncLogs[logIndex].completed_at = new Date().toISOString()
  } catch (error) {
    // Update log as failed
    syncLogs[logIndex].status = "failed"
    syncLogs[logIndex].error_message = error instanceof Error ? error.message : "Unknown error"
    syncLogs[logIndex].completed_at = new Date().toISOString()
  }
}

async function performBulkImport(syncId: string, provider: string) {
  if (provider === "printful") {
    // Add individual product import logs
    const productLogs = [
      {
        id: `sync_${Date.now()}_1`,
        product_id: "prod_123",
        product_name: "Custom T-Shirt",
        sync_type: "import",
        status: "success",
        provider_type: provider,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      },
      {
        id: `sync_${Date.now()}_2`,
        product_id: "prod_124",
        product_name: "Art Print",
        sync_type: "import",
        status: "success",
        provider_type: provider,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }
    ]

    syncLogs.splice(1, 0, ...productLogs)
  }
}

async function updatePrices(syncId: string, provider: string) {
  // Simulate price update
  await new Promise(resolve => setTimeout(resolve, 1000))
}

async function checkInventory(syncId: string, provider: string) {
  // Simulate inventory check
  await new Promise(resolve => setTimeout(resolve, 1500))
}

async function importProducts(req: MedusaRequest, res: MedusaResponse, provider: string, productIds: string[]) {
  try {
    // Try to resolve services - use Medusa v2 service resolution
    let productService
    let printfulService
    let digitalProductService

    try {
      productService = req.scope.resolve(Modules.PRODUCT) // Medusa v2 product service
    } catch (error) {
      console.error("Could not resolve product service:", error)
      return res.status(500).json({ error: "Product service not available" })
    }

    if (provider === "printful") {
      try {
        printfulService = req.scope.resolve("printfulModule") as any
      } catch (error) {
        console.error("Could not resolve printfulModule:", error)
        return res.status(500).json({ error: "Printful service not available" })
      }
    }

    if (provider === "digital") {
      try {
        digitalProductService = req.scope.resolve("digitalProductModuleService") as any
      } catch (error) {
        console.error("Could not resolve digitalProductModuleService:", error)
        return res.status(500).json({ error: "Digital product service not available" })
      }
    }
    
    const importedProducts: any[] = []
    const errors: any[] = []

    for (const productId of productIds) {
      try {
        let medusaProduct

        if (provider === "printful") {
          // Get Printful product details
          const printfulProducts = await printfulService.fetchStoreProducts()
          const printfulProduct = printfulProducts.find(p => p.id === productId)
          
          if (!printfulProduct) {
            errors.push({ productId, error: "Product not found in Printful" })
            continue
          }

          // Create Medusa product
          medusaProduct = await productService.create({
            title: printfulProduct.name,
            description: printfulProduct.description,
            status: "draft",
            metadata: {
              fulfillment_type: "printful_pod",
              printful_product_id: printfulProduct.id,
              source_provider: "printful"
            }
          })

          // Create variants based on Printful variants or default variant
          const variantData = {
            title: "Default",
            sku: `printful-${printfulProduct.id}`,
            metadata: {
              printful_product_id: printfulProduct.id
            }
          }

          // Create variant (in v2, variants are created separately)
          const variantService = req.scope.resolve(Modules.PRODUCT)
          await variantService.createProductVariants([{
            ...variantData,
            product_id: medusaProduct.id
          }])

        } else if (provider === "digital") {
          // Get digital product details
          const digitalProduct = await digitalProductService.retrieve(productId)
          
          if (!digitalProduct) {
            errors.push({ productId, error: "Digital product not found" })
            continue
          }

          // Create Medusa product
          medusaProduct = await productService.create({
            title: digitalProduct.name,
            description: digitalProduct.description,
            status: "draft",
            tags: [{ value: "digital" }],
            metadata: {
              fulfillment_type: "digital_download",
              digital_product_id: digitalProduct.id,
              source_provider: "digital",
              file_size: digitalProduct.file_size,
              mime_type: digitalProduct.mime_type
            }
          })

          // Create single variant for digital product
          const variantData = {
            title: "Digital Download",
            sku: `digital-${digitalProduct.id}`,
            metadata: {
              digital_product_id: digitalProduct.id
            }
          }

          // Create variant (in v2, variants are created separately)
          const variantService = req.scope.resolve(Modules.PRODUCT)
          await variantService.createProductVariants([{
            ...variantData,
            product_id: medusaProduct.id
          }])
        }

        importedProducts.push({
          productId,
          medusaProductId: medusaProduct.id,
          provider
        })

        // Log successful import
        syncLogs.unshift({
          id: `import_${Date.now()}_${productId}`,
          product_id: medusaProduct.id,
          product_name: medusaProduct.title,
          sync_type: "import",
          status: "success",
          provider_type: provider,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })

      } catch (error) {
        errors.push({ 
          productId, 
          error: error instanceof Error ? error.message : "Unknown error" 
        })
        
        // Log failed import
        syncLogs.unshift({
          id: `import_${Date.now()}_${productId}`,
          product_id: productId,
          sync_type: "import",
          status: "failed",
          provider_type: provider,
          error_message: error instanceof Error ? error.message : "Unknown error",
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
      }
    }

    res.json({
      success: true,
      imported: importedProducts.length,
      failed: errors.length,
      imported_products: importedProducts,
      errors
    })

  } catch (error) {
    console.error("Error importing products:", error)
    res.status(500).json({ error: "Failed to import products" })
  }
}