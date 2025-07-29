import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Input, Textarea } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import ArtworkSelector from "../../../components/artworks/artwork-selector"

interface Artwork {
  id: string
  title: string
  product_ids?: string[]
}

interface Product {
  id: string
  title: string
  description?: string
  variants?: any[]
}

const ProductEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [artworkId, setArtworkId] = useState("")
  const [currentArtwork, setCurrentArtwork] = useState<Artwork | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/admin/products/${id}`)
        const data = await response.json()
        setProduct(data.product)
        setTitle(data.product.title)
        setDescription(data.product.description || "")
        
        // Find which artwork contains this product
        if (id) {
          await findArtworkForProduct(id)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const findArtworkForProduct = async (productId: string) => {
    try {
      const response = await fetch(`/admin/artworks`)
      const data = await response.json()
      const artwork = data.artworks?.find((art: Artwork) => 
        art.product_ids && art.product_ids.includes(productId)
      )
      if (artwork) {
        setCurrentArtwork(artwork)
        setArtworkId(artwork.id)
      }
    } catch (error) {
      console.error("Error finding artwork for product:", error)
    }
  }

  const handleSave = async () => {
    try {
      // Update product
      await fetch(`/admin/products/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
        }),
      })

      // Update artwork-product relationship
      if (id && artworkId !== (currentArtwork?.id || "")) {
        await updateArtworkProductRelation()
      }
      
      alert("Product saved successfully!")
    } catch (error) {
      console.error("Error saving product:", error)
      alert("Failed to save product.")
    }
  }

  const updateArtworkProductRelation = async () => {
    try {
      // Remove product from old artwork if exists
      if (currentArtwork) {
        const updatedProductIds = currentArtwork.product_ids?.filter((pid: string) => pid !== id) || []
        await fetch(`/admin/artworks/${currentArtwork.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_ids: updatedProductIds,
          }),
        })
      }

      // Add product to new artwork if selected
      if (artworkId) {
        const artworkResponse = await fetch(`/admin/artworks/${artworkId}`)
        const artworkData = await artworkResponse.json()
        const artwork = artworkData.artwork
        
        const updatedProductIds = [...(artwork.product_ids || []), id]
        await fetch(`/admin/artworks/${artworkId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_ids: updatedProductIds,
          }),
        })
      }
    } catch (error) {
      console.error("Error updating artwork-product relationship:", error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!product) {
    return <div>Product not found</div>
  }

  return (
    <div className="flex flex-col gap-y-4 p-6">
      <div className="flex flex-col gap-y-2">
        <label htmlFor="title">Title</label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-y-2">
        <label htmlFor="description">Description</label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      
      {/* Product Variants and Pricing */}
      <div className="flex flex-col gap-y-4 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-medium">Product Variants & Pricing</h3>
        <p className="text-sm text-gray-600">
          Product variants allow you to offer different options (sizes, colors, etc.) with different prices.
        </p>
        
        {product?.variants && product.variants.length > 0 ? (
          <div className="space-y-4">
            {product.variants.map((variant: any, index: number) => (
              <div key={variant.id} className="p-3 bg-gray-50 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{variant.title || `Variant ${index + 1}`}</h4>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => window.location.href = `/app/products/${id}/variants/${variant.id}/prices`}
                    >
                      Edit Prices
                    </Button>
                    <span className="text-sm text-gray-500">ID: {variant.id}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (in cents)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 2000 for $20.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      defaultValue={variant.prices?.[0]?.amount || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter price in cents (2000 = $20.00)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="usd">USD</option>
                      <option value="eur">EUR</option>
                      <option value="gbp">GBP</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., POSTER-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    defaultValue={variant.sku || ''}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No variants found for this product</p>
            <p className="text-sm text-gray-400">
              Variants are automatically created when products are synced from external sources like Printful.
            </p>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 How to Set Product Prices:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Manual Products:</strong> Edit the price fields above and click Save</li>
            <li>• <strong>Printful Products:</strong> Prices are set in your Printful dashboard and synced automatically</li>
            <li>• <strong>Digital Products:</strong> Set prices when creating the digital product</li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-y-2">
        <label htmlFor="artwork">Linked Artwork</label>
        {currentArtwork && (
          <div className="mb-2 p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">Currently linked to: </span>
            <span className="font-medium">{currentArtwork.title}</span>
          </div>
        )}
        <ArtworkSelector
          artworkId={artworkId}
          onArtworkSelected={(id) => setArtworkId(id)}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Edit Product",
})

export default ProductEditPage
