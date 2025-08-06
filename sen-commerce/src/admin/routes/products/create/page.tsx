import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Input, Textarea, Select, Badge } from "@medusajs/ui"
import { Package, Download, Image, ArrowLeft, Plus } from "lucide-react"

interface Artwork {
  id: string
  title: string
  image_url: string
  artwork_collection_id?: string
  product_ids?: string[]
}

interface DigitalProduct {
  id: string
  name: string
  description?: string
  file_size: number
  mime_type: string
}

interface PrintfulProduct {
  id: string
  name: string
  description?: string
  thumbnail_url: string
  already_imported: boolean
}

const CreateProductPage = () => {
  const navigate = useNavigate()
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([])
  const [printfulProducts, setPrintfulProducts] = useState<PrintfulProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>("")

  // Form state
  const [selectedArtwork, setSelectedArtwork] = useState<string>("")
  const [productType, setProductType] = useState<'printful_pod' | 'digital'>('printful_pod')
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [selectedPrintfulProduct, setSelectedPrintfulProduct] = useState("")
  const [selectedDigitalProduct, setSelectedDigitalProduct] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [artworkRes, digitalRes, printfulRes] = await Promise.all([
        fetch("/admin/artworks", { credentials: "include" }),
        fetch("/admin/digital-products", { credentials: "include" }),
        fetch("/admin/product-sync", { credentials: "include" })
      ])

      const artworkData = await artworkRes.json()
      const digitalData = await digitalRes.json()
      const printfulData = await printfulRes.json()

      setArtworks(artworkData.artworks || [])
      setDigitalProducts(digitalData.digital_products || [])
      setPrintfulProducts(printfulData.available_products?.printful || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load data. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title || !price) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setCreating(true)
      
      const requestBody = {
        artwork_id: selectedArtwork,
        product_type: productType,
        title,
        description,
        price: Math.round(parseFloat(price) * 100),
        ...(productType === 'printful_pod' ? {
          printful_product_id: selectedPrintfulProduct
        } : {}),
        ...(productType === 'digital' ? {
          digital_product_id: selectedDigitalProduct
        } : {})
      }

      const response = await fetch("/admin/products/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create product")
      }

      // Navigate to the created product or products list
      navigate("/app/products")
    } catch (error) {
      console.error("Error creating product:", error)
      setError(error.message || "Failed to create product")
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          onClick={() => navigate("/app/products")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create New Product</h1>
          <p className="text-gray-600">Create a new product linked to artwork</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Product Details</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Product Title *
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter product title"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                Price (USD) *
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/app/products")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={creating || !title || !price}
            className="flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Create Product",
  icon: Plus,
})

export default CreateProductPage