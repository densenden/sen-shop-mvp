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
