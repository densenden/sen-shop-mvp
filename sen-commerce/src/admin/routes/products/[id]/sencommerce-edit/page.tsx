import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
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
  weight?: number
  length?: number
  height?: number
  width?: number
  hs_code?: string
  origin_country?: string
  mid_code?: string
  material?: string
  discountable?: boolean
}

const SenCommerceEditPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [generatingMockups, setGeneratingMockups] = useState(false)
  const [mockupSuccess, setMockupSuccess] = useState<string>("")

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
    } catch (error) {
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
    setMockupSuccess("")

    if (!title) {
      setError("Please fill in the product title")
      return
    }

    try {
      setSaving(true)
      
      const updatedMetadata = {
        ...metadata
        // artwork_id is no longer stored in product metadata - only in artworks.product_ids
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

      // Handle artwork connection changes - Single Source of Truth approach
      await handleArtworkConnection(selectedArtwork, id)
      
      async function handleArtworkConnection(newArtworkId: string, productId: string) {
        try {
          // Find the current artwork that contains this product
          const currentArtwork = artworks.find(artwork => 
            artwork.product_ids && artwork.product_ids.includes(productId)
          )
          const currentArtworkId = currentArtwork?.id
          
          console.log(`[Product Edit] Current artwork: ${currentArtworkId}, New artwork: ${newArtworkId}`)
          
          // If artwork is changing, remove from old and add to new
          if (currentArtworkId !== newArtworkId) {
            
            // Remove from previous artwork
            if (currentArtworkId) {
              const updatedProductIds = currentArtwork.product_ids.filter(pid => pid !== productId)
              await fetch(`/admin/artworks/${currentArtworkId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ product_ids: updatedProductIds })
              })
              console.log(`[Product Edit] Removed product ${productId} from artwork ${currentArtworkId}`)
            }
            
            // Add to new artwork
            if (newArtworkId) {
              const newArtwork = artworks.find(a => a.id === newArtworkId)
              const currentProductIds = newArtwork?.product_ids || []
              if (!currentProductIds.includes(productId)) {
                const updatedProductIds = [...currentProductIds, productId]
                await fetch(`/admin/artworks/${newArtworkId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ product_ids: updatedProductIds })
                })
                console.log(`[Product Edit] Added product ${productId} to artwork ${newArtworkId}`)
              }
            }
          }
        } catch (error) {
          console.error('Error updating artwork connection:', error)
        }
      }

      setError("")
      setMockupSuccess("Product updated successfully!")
      await fetchData()
    } catch (error) {
      console.error("Error updating product:", error)
      setError(error.message || "Failed to update product")
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateMockups = async () => {
    const selectedArtworkData = artworks.find(a => a.id === selectedArtwork)
    if (!selectedArtworkData) {
      setError("Please select an artwork first")
      return
    }

    setError("")
    setMockupSuccess("")
    setGeneratingMockups(true)

    try {
      const response = await fetch(`/admin/products/${id}/generate-mockups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          artworkUrl: selectedArtworkData.image_url
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate mockups")
      }

      setMockupSuccess(`Successfully generated ${result.mockups_generated} mockup images! ${result.thumbnail_set ? 'Thumbnail updated.' : ''}`)
      await fetchData()
    } catch (error) {
      console.error("Error generating mockups:", error)
      setError(error.message || "Failed to generate mockups")
    } finally {
      setGeneratingMockups(false)
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <Container className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/products")}>
            Back to Products
          </Button>
        </div>
      </Container>
    )
  }

  const typeInfo = getProductTypeInfo()
  const printfulDetails = getPrintfulDetails()
  const isServiceProduct = !metadata?.fulfillment_type || metadata?.fulfillment_type === 'service'
  const isPrintfulProduct = metadata?.fulfillment_type === 'printful_pod'

  return (
    <div className="w-full max-w-none p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate(`/products/${id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Product
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">SenCommerce Product Editor</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={typeInfo.color}>
                {typeInfo.icon}
                {typeInfo.label}
              </Badge>
              <span className="text-sm text-gray-500">{product.title}</span>
              {printfulDetails?.printful_product_id && (
                <Badge variant="outline" className="text-xs">
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

      {mockupSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {mockupSuccess}
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
            Media & Mockups
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                        <Badge variant="outline" className="font-mono">
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
                        
                        {/* Generate Mockups for Printful products */}
                        {isPrintfulProduct && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <Button
                              type="button"
                              onClick={handleGenerateMockups}
                              disabled={generatingMockups}
                              className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                              {generatingMockups ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Generating Mockups...
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="w-4 h-4" />
                                  Generate Printful Mockups
                                </>
                              )}
                            </Button>
                            <Text className="text-xs text-gray-500 mt-2 text-center">
                              This will create product mockups using the selected artwork
                            </Text>
                          </div>
                        )}
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
          <Container className="p-6">
            <h2 className="text-lg font-medium mb-4">Product Media</h2>
            <div className="space-y-6">
              {/* Thumbnail */}
              {product.thumbnail && (
                <div>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Thumbnail</Text>
                  <div className="relative inline-block">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-40 h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <Badge className="absolute top-2 left-2 bg-blue-600 text-white">
                      Primary
                    </Badge>
                  </div>
                </div>
              )}
              
              {/* All Images Grid */}
              {product.images && product.images.length > 0 && (
                <div>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    All Images ({product.images.length})
                  </Text>
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
                          <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                            Thumbnail
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Mockups */}
              {isPrintfulProduct && selectedArtworkData && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800">Generate Printful Mockups</h3>
                      <p className="text-sm text-green-600">
                        Create product mockups using: <strong>{selectedArtworkData.title}</strong>
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateMockups}
                    disabled={generatingMockups}
                    className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {generatingMockups ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating Mockups...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        Generate New Mockups
                      </>
                    )}
                  </Button>
                </div>
              )}
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
            <h2 className="text-lg font-medium mb-4">Product Variants</h2>
            <div className="text-center py-8">
              <Text className="text-gray-600 mb-4">
                Variant management is available in the standard Medusa product editor.
              </Text>
              <Button
                onClick={() => navigate(`/products/${id}`)}
                variant="secondary"
              >
                Go to Standard Editor
              </Button>
            </div>
          </Container>
        </Tabs.Content>
      </Tabs>
    </div>
  )
}

export default SenCommerceEditPage