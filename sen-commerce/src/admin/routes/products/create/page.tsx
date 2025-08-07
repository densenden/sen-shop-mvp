import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Input, Textarea, Select, Badge, Container, Heading, Label } from "@medusajs/ui"
import { 
  Package, 
  Download, 
  ArrowLeft, 
  Plus, 
  Image as ImageIcon,
  ChevronRight,
  Briefcase,
  Check
} from "lucide-react"

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

  // Step management
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  
  // Form state
  const [productType, setProductType] = useState<'printful_pod' | 'digital' | 'service' | ''>('')
  const [selectedArtwork, setSelectedArtwork] = useState<string>("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [selectedPrintfulProduct, setSelectedPrintfulProduct] = useState("")
  const [selectedDigitalProduct, setSelectedDigitalProduct] = useState("")
  const [showArtworkSelector, setShowArtworkSelector] = useState(false)
  const [artworkSearchTerm, setArtworkSearchTerm] = useState("")

  useEffect(() => {
    if (currentStep === 2) {
      fetchData()
    }
  }, [currentStep])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const endpoints = [fetch("/admin/artworks", { credentials: "include" })]
      
      if (productType === 'digital') {
        endpoints.push(fetch("/admin/digital-products", { credentials: "include" }))
      } else if (productType === 'printful_pod') {
        endpoints.push(fetch("/admin/product-sync", { credentials: "include" }))
      }

      const responses = await Promise.all(endpoints)
      const [artworkData, ...otherData] = await Promise.all(responses.map(r => r.json()))

      setArtworks(artworkData.artworks || [])
      
      if (productType === 'digital' && otherData[0]) {
        setDigitalProducts(otherData[0].digital_products || [])
      } else if (productType === 'printful_pod' && otherData[0]) {
        setPrintfulProducts(otherData[0].available_products?.printful || [])
      }
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

      // If artwork is selected, connect it to the newly created product
      if (selectedArtwork && result.product?.id) {
        try {
          const artworkResponse = await fetch(`/admin/artworks/${selectedArtwork}`, {
            credentials: 'include'
          })
          
          if (artworkResponse.ok) {
            const artworkData = await artworkResponse.json()
            const currentProductIds = artworkData.artwork?.product_ids || []
            
            if (!currentProductIds.includes(result.product.id)) {
              await fetch(`/admin/artworks/${selectedArtwork}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  product_ids: [...currentProductIds, result.product.id]
                })
              })
              console.log(`Connected new product ${result.product.id} to artwork ${selectedArtwork}`)
            }
          }
        } catch (artworkError) {
          console.error('Failed to connect artwork:', artworkError)
          // Don't fail the product creation if artwork connection fails
        }
      }

      navigate("/products")
    } catch (error) {
      console.error("Error creating product:", error)
      setError(error.message || "Failed to create product")
    } finally {
      setCreating(false)
    }
  }

  const handleProductTypeSelect = (type: 'printful_pod' | 'digital' | 'service') => {
    setProductType(type)
    setCurrentStep(2)
  }

  const filteredArtworks = artworks.filter(artwork =>
    artwork.title.toLowerCase().includes(artworkSearchTerm.toLowerCase())
  )

  const selectedArtworkData = artworks.find(a => a.id === selectedArtwork)

  if (currentStep === 1) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate("/products")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Create New Product</h1>
            <p className="text-gray-600">Step 1: Choose product type</p>
          </div>
        </div>

        {/* Product Type Selection */}
        <Container className="p-8">
          <Heading level="h2" className="mb-6">What type of product would you like to create?</Heading>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* POD Product */}
            <button
              onClick={() => handleProductTypeSelect('printful_pod')}
              className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Print on Demand</h3>
              <p className="text-sm text-gray-600 text-center">
                Physical products fulfilled by Printful with custom artwork
              </p>
              <Badge className="mt-3 bg-green-100 text-green-800">
                POD
              </Badge>
            </button>

            {/* Digital Product */}
            <button
              onClick={() => handleProductTypeSelect('digital')}
              className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Download className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Digital Product</h3>
              <p className="text-sm text-gray-600 text-center">
                Downloadable files like art prints, templates, or digital goods
              </p>
              <Badge className="mt-3 bg-blue-100 text-blue-800">
                Digital
              </Badge>
            </button>

            {/* Service */}
            <button
              onClick={() => handleProductTypeSelect('service')}
              className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <Briefcase className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Service</h3>
              <p className="text-sm text-gray-600 text-center">
                Custom services, consultations, or commissioned work
              </p>
              <Badge className="mt-3 bg-purple-100 text-purple-800">
                Service
              </Badge>
            </button>
          </div>
        </Container>
      </div>
    )
  }

  // Step 2: Product Details
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          onClick={() => setCurrentStep(1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create New Product</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-600">Step 2: Product details</p>
            <Badge className={
              productType === 'printful_pod' ? 'bg-green-100 text-green-800' :
              productType === 'digital' ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }>
              {productType === 'printful_pod' ? 'POD' :
               productType === 'digital' ? 'Digital' : 'Service'}
            </Badge>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Details */}
            <Container className="p-6">
              <h2 className="text-lg font-medium mb-4">Product Details</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="mb-1">
                    Product Title *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter product title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="mb-1">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="mb-1">
                    Price (USD) *
                  </Label>
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
            </Container>

            {/* Product Type Specific Options */}
            {productType === 'printful_pod' && (
              <Container className="p-6">
                <h2 className="text-lg font-medium mb-4">Printful Product Selection</h2>
                {printfulProducts.length === 0 ? (
                  <p className="text-gray-500">No Printful products available. Please sync your Printful catalog.</p>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="printful-product">Select Printful Product</Label>
                    <Select value={selectedPrintfulProduct} onValueChange={setSelectedPrintfulProduct}>
                      <Select.Trigger id="printful-product">
                        <Select.Value placeholder="Choose a Printful product" />
                      </Select.Trigger>
                      <Select.Content>
                        {printfulProducts.map(product => (
                          <Select.Item 
                            key={product.id} 
                            value={product.id}
                            disabled={product.already_imported}
                          >
                            <div className="flex items-center gap-2">
                              {product.thumbnail_url && (
                                <img 
                                  src={product.thumbnail_url} 
                                  alt={product.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              )}
                              <span>{product.name}</span>
                              {product.already_imported && (
                                <Badge size="small" className="ml-2 bg-gray-100">Imported</Badge>
                              )}
                            </div>
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                )}
              </Container>
            )}

            {productType === 'digital' && (
              <Container className="p-6">
                <h2 className="text-lg font-medium mb-4">Digital Product Selection</h2>
                {digitalProducts.length === 0 ? (
                  <p className="text-gray-500">No digital products available. Please create digital products first.</p>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="digital-product">Select Digital Product</Label>
                    <Select value={selectedDigitalProduct} onValueChange={setSelectedDigitalProduct}>
                      <Select.Trigger id="digital-product">
                        <Select.Value placeholder="Choose a digital product" />
                      </Select.Trigger>
                      <Select.Content>
                        {digitalProducts.map(product => (
                          <Select.Item key={product.id} value={product.id}>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                {(product.file_size / 1024 / 1024).toFixed(2)} MB • {product.mime_type}
                              </div>
                            </div>
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                )}
              </Container>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Artwork Selection */}
            <Container className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Artwork</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => setShowArtworkSelector(!showArtworkSelector)}
                >
                  {selectedArtworkData ? "Change" : "Select"}
                </Button>
              </div>

              {selectedArtworkData ? (
                <div className="space-y-3">
                  {selectedArtworkData.image_url ? (
                    <img
                      src={selectedArtworkData.image_url}
                      alt={selectedArtworkData.title}
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedArtworkData.title}</p>
                    <p className="text-sm text-gray-500">ID: {selectedArtworkData.id}</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => setSelectedArtwork("")}
                    className="w-full"
                  >
                    Remove Artwork
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No artwork selected</p>
              )}

              {showArtworkSelector && (
                <div className="mt-4 border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <Input
                      type="text"
                      placeholder="Search artworks..."
                      value={artworkSearchTerm}
                      onChange={(e) => setArtworkSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredArtworks.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No artworks found</p>
                    ) : (
                      filteredArtworks.map(artwork => (
                        <div
                          key={artwork.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                            selectedArtwork === artwork.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            setSelectedArtwork(artwork.id)
                            setShowArtworkSelector(false)
                          }}
                        >
                          {artwork.image_url ? (
                            <img
                              src={artwork.image_url}
                              alt={artwork.title}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{artwork.title}</div>
                          </div>
                          {selectedArtwork === artwork.id && (
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </Container>

            {/* Product Type Info */}
            <Container className="p-6 bg-gray-50">
              <h3 className="text-lg font-medium mb-2">Product Type</h3>
              <div className="space-y-2">
                {productType === 'printful_pod' && (
                  <>
                    <Badge className="bg-green-100 text-green-800">
                      <Package className="w-4 h-4 mr-1" />
                      Print on Demand
                    </Badge>
                    <p className="text-sm text-gray-600">
                      This product will be fulfilled by Printful when ordered.
                    </p>
                  </>
                )}
                {productType === 'digital' && (
                  <>
                    <Badge className="bg-blue-100 text-blue-800">
                      <Download className="w-4 h-4 mr-1" />
                      Digital Download
                    </Badge>
                    <p className="text-sm text-gray-600">
                      Customers will receive download links after purchase.
                    </p>
                  </>
                )}
                {productType === 'service' && (
                  <>
                    <Badge className="bg-purple-100 text-purple-800">
                      <Briefcase className="w-4 h-4 mr-1" />
                      Service
                    </Badge>
                    <p className="text-sm text-gray-600">
                      A service or custom work that you will provide.
                    </p>
                  </>
                )}
              </div>
            </Container>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/products")}
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