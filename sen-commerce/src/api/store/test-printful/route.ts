import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("Testing Printful connection...")
    
    // Test direct API call to Printful
    const apiToken = process.env.PRINTFUL_API_TOKEN
    console.log("API Token exists:", !!apiToken)
    
    if (!apiToken) {
      return res.json({
        success: false,
        error: "PRINTFUL_API_TOKEN not configured",
        products: [],
        catalog_products: []
      })
    }
    
    let storeProducts = []
    let catalogProducts = []
    
    try {
      // Test V1 API - Store products
      console.log("Testing V1 API - Store products...")
      const storeResponse = await fetch("https://api.printful.com/store/products", {
        headers: { 
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (storeResponse.ok) {
        const storeData = await storeResponse.json()
        storeProducts = storeData.result || []
        console.log("Store products fetched:", storeProducts.length)
      } else {
        console.error("Store API error:", storeResponse.status, await storeResponse.text())
      }
    } catch (error) {
      console.error("Store API fetch error:", error)
    }
    
    try {
      // Test V2 API - Catalog products  
      console.log("Testing V2 API - Catalog products...")
      const catalogResponse = await fetch("https://api.printful.com/v2/catalog-products?limit=5", {
        headers: { 
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (catalogResponse.ok) {
        const catalogData = await catalogResponse.json()
        catalogProducts = catalogData.data || []
        console.log("Catalog products fetched:", catalogProducts.length)
      } else {
        console.error("Catalog API error:", catalogResponse.status, await catalogResponse.text())
      }
    } catch (error) {
      console.error("Catalog API fetch error:", error)
    }
    
    // Test service resolution
    let serviceResolved = false
    try {
      const printfulService = req.scope.resolve("printfulModule") as any
      serviceResolved = !!printfulService
      console.log("Printful service resolved:", serviceResolved)
    } catch (error) {
      console.error("Service resolution error:", error.message)
    }
    
    res.json({
      success: true,
      printful_api_token_configured: !!apiToken,
      service_resolved: serviceResolved,
      store_products: storeProducts,
      catalog_products: catalogProducts,
      store_products_count: storeProducts.length,
      catalog_products_count: catalogProducts.length
    })
    
  } catch (error) {
    console.error("Test Printful error:", error)
    res.status(500).json({ 
      success: false,
      error: error.message,
      products: [],
      catalog_products: []
    })
  }
}