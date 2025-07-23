import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("[Test Product Sync] GET request received")
    
    let printfulProducts: any[] = []
    let digitalProducts: any[] = []
    let existingPrintfulProducts: any[] = []

    // Try to get Printful products
    try {
      const printfulService = req.scope.resolve("printfulModule") as any
      console.log("Printful service resolved:", !!printfulService)
      
      if (printfulService) {
        console.log("Fetching Printful store products...")
        printfulProducts = await printfulService.fetchStoreProducts()
        console.log("Printful products fetched:", printfulProducts.length)
        
        console.log("Fetching Printful catalog products...")
        const catalogProducts = await printfulService.fetchCatalogProducts()
        console.log("Catalog products fetched:", catalogProducts.length)
        
        // Add catalog products to the available products list
        const catalogFormatted = catalogProducts.slice(0, 10).map((product: any) => ({
          id: `catalog-${product.id}`,
          name: product.name,
          description: product.description,
          thumbnail_url: product.image,
          status: 'available',
          provider: 'printful',
          already_imported: false,
          product_type: 'catalog'
        }))
        
        // Combine store and catalog products
        printfulProducts = [...printfulProducts, ...catalogFormatted]
      }
    } catch (error) {
      console.error("Printful service error:", error.message)
    }

    // Try to get digital products
    try {
      const digitalProductService = req.scope.resolve("digitalProductModuleService") as any
      digitalProducts = await digitalProductService.listDigitalProducts({})
    } catch (error) {
      console.log("Digital product service not available:", error.message)
    }
    
    // Format available products for import
    const availableProducts = {
      printful: printfulProducts.map(p => ({
        id: p.id || p.external_id || `product-${p.name}`,
        name: p.name,
        description: p.description || `${p.name} - Available for custom printing`,
        thumbnail_url: p.thumbnail_url || p.image,
        status: 'available',
        provider: 'printful',
        already_imported: false,
        product_type: p.product_type || 'store'
      })),
      digital: digitalProducts.map(dp => ({
        id: dp.id,
        name: dp.name,
        description: dp.description,
        file_size: dp.file_size,
        mime_type: dp.mime_type,
        status: 'available',
        provider: 'digital',
        already_imported: false
      }))
    }

    res.json({
      success: true,
      available_products: availableProducts,
      logs: [],
      stats: { total: 0, pending: 0, success: 0, failed: 0, in_progress: 0 }
    })
    
  } catch (error) {
    console.error("[Test Product Sync] Error:", error)
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch sync data",
      message: error.message 
    })
  }
}