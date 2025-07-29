import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    console.log("Fetching product with ID:", id)
    
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    console.log("Product service resolved:", !!productService)
    
    try {
      // Fetch single product by ID
      const product = await productService.retrieveProduct(id, {
        relations: ["variants", "tags", "metadata"]
      })
      
      console.log("Product fetched:", !!product)
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" })
      }
      
      // Format response to match expected structure
      const formatted = {
        id: product.id,
        title: product.title,
        description: product.description,
        status: product.status,
        metadata: product.metadata || {},
        variants: product.variants || [],
        tags: product.tags || [],
        created_at: product.created_at,
        updated_at: product.updated_at
      }
      
      res.json({ product: formatted })
      
    } catch (productError) {
      console.error("Could not fetch real product:", productError)
      return res.status(404).json({ error: "Product not found" })
    }
    
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).json({ 
      error: "Failed to fetch product",
      message: error.message 
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const { title, description, metadata } = req.body as {
      title?: string
      description?: string
      metadata?: Record<string, any>
    }
    
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Update the product
    await productService.updateProducts(id, {
      title,
      description,
      metadata
    })
    
    // Fetch the updated product to return it
    const updatedProduct = await productService.retrieveProduct(id, {
      relations: ["variants", "tags", "metadata"]
    })
    
    res.json({ product: updatedProduct })
    
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ 
      error: "Failed to update product",
      message: error.message 
    })
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
];
