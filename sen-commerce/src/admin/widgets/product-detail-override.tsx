import React, { useState, useEffect } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Input, Textarea, Select, Badge, Label, Container, Switch, IconButton, Text, Tabs } from "@medusajs/ui"
import { 
  Package, 
  Download, 
  ArrowLeft, 
  Save, 
  Image as ImageIcon,
  X,
  Check,
  Plus,
  Trash2,
  Settings,
  DollarSign,
  Box,
  Tag,
  ExternalLink
} from "lucide-react"

interface Artwork {
  id: string
  title: string
  image_url: string
  artwork_collection_id?: string
  product_ids?: string[]
}

interface Product {
  id: string
  title: string
  subtitle?: string
  description?: string
  handle?: string
  status: string
  thumbnail?: string
  images?: { url: string }[]
  metadata?: any
  variants?: any[]
  options?: any[]
  created_at: string
  updated_at: string
  discountable?: boolean
}

const ProductDetailOverride = () => {
  console.log("🚀 SenCommerce Product Detail Override Loading!")
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")

  // Form state
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [description, setDescription] = useState("")
  const [handle, setHandle] = useState("")
  const [status, setStatus] = useState<string>("draft")
  const [discountable, setDiscountable] = useState(true)
  
  // Metadata state
  const [metadata, setMetadata] = useState<Record<string, any>>({})
  const [newMetaKey, setNewMetaKey] = useState("")
  const [newMetaValue, setNewMetaValue] = useState("")
  
  // Artwork state
  const [selectedArtwork, setSelectedArtwork] = useState<string>("")
  const [showArtworkSelector, setShowArtworkSelector] = useState(false)
  const [artworkSearchTerm, setArtworkSearchTerm] = useState("")

  // Hide default Medusa product detail interface
  React.useEffect(() => {
    if (!id) return
    
    const hideDefaultInterface = () => {
      // More aggressive hiding of default Medusa interface
      const selectors = [
        'main > div > div > div:not(.sencommerce-product-detail)',
        'form:not(.sencommerce-form)',
        '[data-testid*="product"]',
        '.product-detail',
        '[class*="Product"]:not([class*="sencommerce"])'
      ]
      
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => {
            const htmlEl = el as HTMLElement
            if (htmlEl && 
                !htmlEl.closest('.sencommerce-product-detail') && 
                !htmlEl.innerHTML.includes('SenCommerce') &&
                !htmlEl.querySelector('.sencommerce-product-detail')) {
              htmlEl.style.display = 'none'
            }
          })
        } catch (e) {
          // Ignore selector errors
        }
      })
    }
    
    // Run multiple times to ensure complete override
    const intervals = [50, 100, 200, 500, 1000, 2000]
    const timers = intervals.map(delay => setTimeout(hideDefaultInterface, delay))
    
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [productRes, artworkRes] = await Promise.all([
        fetch(`/admin/products/${id}`, { credentials: "include" }),
        fetch("/admin/artworks", { credentials: "include" })
      ])

      if (!productRes.ok) {
        throw new Error("Product not found")
      }

      const productData = await productRes.json()
      const artworkData = await artworkRes.json()

      setProduct(productData.product)
      setArtworks(artworkData.artworks || [])

      // Set form values
      const prod = productData.product
      setTitle(prod.title || "")
      setSubtitle(prod.subtitle || "")
      setDescription(prod.description || "")
      setHandle(prod.handle || "")
      setStatus(prod.status || "draft")
      setDiscountable(prod.discountable !== false)
      
      // Set metadata
      setMetadata(prod.metadata || {})
      
      // Find artwork that contains this product ID (single source of truth)
      const connectedArtwork = artworkData.artworks?.find((artwork: Artwork) => 
        artwork.product_ids && artwork.product_ids.includes(id)
      )
      setSelectedArtwork(connectedArtwork?.id || "")
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError("Failed to load product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMetadata = () => {
    if (newMetaKey && newMetaValue) {
      setMetadata({
        ...metadata,
        [newMetaKey]: newMetaValue
      })
      setNewMetaKey("")
      setNewMetaValue("")
    }
  }

  const handleRemoveMetadata = (key: string) => {
    const updated = { ...metadata }
    delete updated[key]
    setMetadata(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title) {
      setError("Please fill in the product title")
      return
    }

    try {
      setSaving(true)
      
      const updatedMetadata = {
        ...metadata
        // artwork_id no longer stored in product metadata - only in artworks.product_ids
      }
      
      const requestBody = {
        title,
        subtitle,
        description,
        handle,
        status,
        discountable,
        metadata: updatedMetadata
      }

      const response = await fetch(`/admin/products/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update product")
      }

      setError("")
      
      // Handle artwork assignment if artwork is selected
      if (selectedArtwork) {
        try {
          // First, check if relation already exists and delete old ones for this product
          const existingResponse = await fetch(`/admin/artwork-product-relations?product_id=${id}`, {
            credentials: "include"
          })
          
          if (existingResponse.ok) {
            const existingData = await existingResponse.json()
            // Delete existing relations
            for (const relation of existingData.relations || []) {
              await fetch(`/admin/artwork-product-relations?artwork_id=${relation.artwork_id}&product_id=${id}`, {
                method: "DELETE",
                credentials: "include"
              })
            }
          }
          
          // Create new artwork-product relation
          const artworkResponse = await fetch("/admin/artwork-product-relations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              artwork_id: selectedArtwork,
              product_id: id,
              product_type: metadata?.fulfillment_type || "digital",
              is_primary: true,
              position: 0
            })
          })
          
          if (!artworkResponse.ok) {
            const artworkError = await artworkResponse.json()
            console.warn("Failed to save artwork relation:", artworkError)
            // Don't fail the whole operation for artwork save issues
          }
        } catch (artworkError) {
          console.warn("Error saving artwork relation:", artworkError)
          // Don't fail the whole operation for artwork save issues
        }
      }
      
      alert("Product updated successfully!")
      await fetchData()
    } catch (error: any) {
      console.error("Error updating product:", error)
      setError(error.message || "Failed to update product")
    } finally {
      setSaving(false)
    }
  }

  const getProductTypeInfo = () => {
    const fulfillmentType = metadata?.fulfillment_type
    if (fulfillmentType === 'printful_pod') {
      return {
        icon: <Package className="w-4 h-4" />,
        label: 'POD Product',
        color: 'bg-green-100 text-green-800'
      }
    } else if (fulfillmentType === 'digital' || fulfillmentType === 'digital_download') {
      return {
        icon: <Download className="w-4 h-4" />,
        label: 'Digital Product',
        color: 'bg-blue-100 text-blue-800'
      }
    }
    return {
      icon: <Package className="w-4 h-4" />,
      label: 'Service Product',
      color: 'bg-purple-100 text-purple-800'
    }
  }

  const getPrintfulDetails = () => {
    if (metadata?.fulfillment_type !== 'printful_pod') return null
    
    return {
      printful_product_id: metadata?.printful_product_id,
      mockup_urls: metadata?.mockup_urls || [],
      artwork_url: metadata?.artwork_url,
      original_thumbnail: metadata?.original_thumbnail
    }
  }

  const filteredArtworks = artworks.filter(artwork =>
    artwork.title.toLowerCase().includes(artworkSearchTerm.toLowerCase())
  )

  const selectedArtworkData = artworks.find(a => a.id === selectedArtwork)

  if (loading) {
    return (
      <div className="sencommerce-product-detail p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="sencommerce-product-detail">
        <Container className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Product not found</h2>
            <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/products")}>
              Back to Products
            </Button>
          </div>
        </Container>
      </div>
    )
  }

  const typeInfo = getProductTypeInfo()
  const printfulDetails = getPrintfulDetails()
  const isServiceProduct = !metadata?.fulfillment_type || metadata?.fulfillment_type === 'service'
  const isPrintfulProduct = metadata?.fulfillment_type === 'printful_pod'

  return (
    <div className="sencommerce-product-detail w-full max-w-none p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
            <h1 className="text-2xl font-semibold">{product.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={typeInfo.color}>
                {typeInfo.icon}
                {typeInfo.label}
              </Badge>
              <span className="text-sm text-gray-500">ID: {product.id}</span>
              {printfulDetails?.printful_product_id && (
                <Badge className="text-xs">
                  Printful: {printfulDetails.printful_product_id}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={saving || !title}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}


      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <Tabs.List className="grid w-full grid-cols-4">
          <Tabs.Trigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General & Artwork
          </Tabs.Trigger>
          <Tabs.Trigger value="media" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Media & Images
          </Tabs.Trigger>
          <Tabs.Trigger value="metadata" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Metadata
          </Tabs.Trigger>
          <Tabs.Trigger value="variants" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Variants & Pricing
          </Tabs.Trigger>
        </Tabs.List>

        {/* General Tab */}
        <Tabs.Content value="general" className="space-y-6">
          <form onSubmit={handleSubmit} className="sencommerce-form space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3 space-y-6">
                <Container className="p-6">
                  <h2 className="text-lg font-medium mb-4">Product Information</h2>
                  
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

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="status" className="mb-1">
                          Status
                        </Label>
                        <Select value={status} onValueChange={setStatus}>
                          <Select.Trigger id="status" className="w-[200px]">
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            <Select.Item value="draft">Draft</Select.Item>
                            <Select.Item value="published">Published</Select.Item>
                          </Select.Content>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          id="discountable"
                          checked={discountable}
                          onCheckedChange={setDiscountable}
                        />
                        <Label htmlFor="discountable">Allow discounts</Label>
                      </div>
                    </div>
                  </div>
                </Container>

                {/* Printful Details */}
                {printfulDetails && (
                  <Container className="p-6 bg-green-50 border-green-200">
                    <h3 className="text-lg font-medium mb-4 text-green-800">
                      <Package className="w-5 h-5 inline mr-2" />
                      Printful Integration Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Text className="font-medium text-green-700">Product ID:</Text>
                        <Badge className="font-mono">
                          {printfulDetails.printful_product_id}
                        </Badge>
                      </div>
                      {printfulDetails.artwork_url && (
                        <div className="flex items-center gap-2">
                          <Text className="font-medium text-green-700">Artwork:</Text>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => window.open(printfulDetails.artwork_url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      )}
                    </div>
                  </Container>
                )}
              </div>

              <div className="space-y-6">
                {/* Artwork Selection */}
                {!isServiceProduct && (
                  <Container className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Artwork</h3>
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        onClick={() => setShowArtworkSelector(!showArtworkSelector)}
                      >
                        {showArtworkSelector ? "Hide" : "Select"}
                      </Button>
                    </div>

                    {selectedArtworkData && (
                      <div className="border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-4">
                          {selectedArtworkData.image_url ? (
                            <img
                              src={selectedArtworkData.image_url}
                              alt={selectedArtworkData.title}
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium">{selectedArtworkData.title}</h3>
                            <p className="text-sm text-gray-500">ID: {selectedArtworkData.id}</p>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="small"
                            onClick={() => setSelectedArtwork("")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                      </div>
                    )}

                    {showArtworkSelector && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-4">
                          <Input
                            type="text"
                            placeholder="Search artworks..."
                            value={artworkSearchTerm}
                            onChange={(e) => setArtworkSearchTerm(e.target.value)}
                          />
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {filteredArtworks.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No artworks found</p>
                          ) : (
                            filteredArtworks.map(artwork => (
                              <div
                                key={artwork.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
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
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="font-medium">{artwork.title}</div>
                                  <div className="text-sm text-gray-500">ID: {artwork.id}</div>
                                </div>
                                {selectedArtwork === artwork.id && (
                                  <Check className="w-5 h-5 text-blue-600" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </Container>
                )}
              </div>
            </div>
          </form>
        </Tabs.Content>

        {/* Media Tab */}
        <Tabs.Content value="media" className="space-y-6">
          {/* Thumbnail Section */}
          <Container className="p-6">
            <h2 className="text-lg font-medium mb-4">Thumbnail</h2>
            <div className="flex items-start gap-6">
              <div>
                {product.thumbnail ? (
                  <div className="relative">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <Badge className="absolute -top-2 -right-2 bg-blue-600 text-white">
                      Primary
                    </Badge>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="space-y-3">
                  <div>
                    <Text className="font-medium text-gray-800">Current Thumbnail</Text>
                    <Text className="text-sm text-gray-600">
                      {product.thumbnail ? "Thumbnail is set and displayed in product listings" : "No thumbnail set - first image will be used"}
                    </Text>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="small" disabled>
                      Upload New
                    </Button>
                    <Button variant="secondary" size="small" disabled>
                      Choose from Images
                    </Button>
                    {product.thumbnail && (
                      <Button variant="secondary" size="small" disabled className="text-red-600">
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Container>


          {/* All Images Section */}
          {product.images && product.images.length > 0 && (
            <Container className="p-6">
              <h2 className="text-lg font-medium mb-4">All Product Images ({product.images.length})</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {product.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Product image ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                        onClick={() => window.open(image.url, '_blank')}
                      />
                      {index === 0 && (
                        <Badge className="absolute top-1 left-1 bg-blue-600 text-white text-xs">
                          Thumbnail
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="small"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(image.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Text className="font-medium text-gray-800">Image Management</Text>
                    <Text className="text-sm text-gray-600">
                      Total: {product.images.length} images • Thumbnail: {product.thumbnail ? "Set" : "Not set"}
                      {printfulDetails?.mockup_urls && printfulDetails.mockup_urls.length > 0 && ` • Mockups: ${printfulDetails.mockup_urls.length}`}
                    </Text>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="small" disabled>
                      Reorder
                    </Button>
                    <Button variant="secondary" size="small" disabled>
                      Bulk Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Container>
          )}

          {/* Upload Images Section */}
          <Container className="p-6">
            <h2 className="text-lg font-medium mb-4">Upload Images</h2>
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <Label htmlFor="imageFiles" className="mb-2">Upload Files to Supabase</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-600 mb-2">Drop files here or click to browse</h3>
                  <Text className="text-sm text-gray-500 mb-4">
                    Files will be uploaded to product-images bucket
                  </Text>
                  <div className="flex justify-center gap-2">
                    <Button variant="secondary">
                      <Plus className="w-4 h-4 mr-2" />
                      Choose Files
                    </Button>
                    <Button variant="secondary" disabled>
                      Bulk Upload
                    </Button>
                  </div>
                  <Text className="text-xs text-gray-400 mt-2">
                    JPG, PNG, WebP • Max: 10MB per file
                  </Text>
                </div>
              </div>
              
              {/* URL Input */}
              <div>
                <Label htmlFor="imageUrl" className="mb-2">Or Add by URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <Button variant="secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add URL
                  </Button>
                </div>
                <Text className="text-xs text-gray-500 mt-1">
                  Add existing images from external URLs
                </Text>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" disabled>
                  <ImageIcon className="w-4 h-4" />
                  Import from Gallery
                </Button>
                <Button variant="secondary" disabled>
                  <Package className="w-4 h-4" />
                  Import from Stock
                </Button>
              </div>
            </div>
          </Container>
        </Tabs.Content>

        {/* Metadata Tab */}
        <Tabs.Content value="metadata" className="space-y-6">
          <Container className="p-6">
            <h2 className="text-lg font-medium mb-4">Product Metadata</h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Key"
                  value={newMetaKey}
                  onChange={(e) => setNewMetaKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Value"
                  value={newMetaValue}
                  onChange={(e) => setNewMetaValue(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddMetadata}
                  disabled={!newMetaKey || !newMetaValue}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {Object.entries(metadata).length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No metadata added yet
                  </div>
                ) : (
                  Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <Text className="text-sm text-gray-500">Key</Text>
                          <Text className="font-medium">{key}</Text>
                        </div>
                        <div>
                          <Text className="text-sm text-gray-500">Value</Text>
                          <Text className="font-medium">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </Text>
                        </div>
                      </div>
                      <IconButton
                        type="button"
                        variant="transparent"
                        onClick={() => handleRemoveMetadata(key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Container>
        </Tabs.Content>

        {/* Variants Tab */}
        <Tabs.Content value="variants" className="space-y-6">
          <Container className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Product Variants</h2>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/products/${id}/variants`)}
              >
                Manage Variants
              </Button>
            </div>
            
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {!product.variants || product.variants.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Box className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p>No variants configured</p>
                  <p className="text-sm mt-1">Add variants to manage pricing and inventory</p>
                </div>
              ) : (
                product.variants.map((variant: any) => (
                  <div key={variant.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{variant.title}</h4>
                        <div className="flex gap-4 mt-1">
                          {variant.sku && (
                            <span className="text-sm text-gray-500">SKU: {variant.sku}</span>
                          )}
                          <span className="text-sm text-gray-500">
                            Stock: {variant.inventory_quantity || 0}
                          </span>
                          {variant.prices && variant.prices.length > 0 && (
                            <span className="text-sm text-gray-500">
                              Price: ${(variant.prices[0].amount / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        onClick={() => navigate(`/products/${id}/variants/${variant.id}`)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Container>
        </Tabs.Content>
      </Tabs>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before"
})

export default ProductDetailOverride