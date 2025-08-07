import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button, Input, Textarea, Select, Badge, Label, Container, Heading, Switch, IconButton, Text, Tabs } from "@medusajs/ui"
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
  Copy,
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

interface ProductVariant {
  id: string
  title: string
  sku?: string
  barcode?: string
  ean?: string
  upc?: string
  inventory_quantity: number
  allow_backorder: boolean
  manage_inventory: boolean
  weight?: number
  length?: number
  height?: number
  width?: number
  prices?: any[]
  options?: any[]
}

const ProductDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
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
  
  // Shipping state
  const [weight, setWeight] = useState("")
  const [length, setLength] = useState("")
  const [height, setHeight] = useState("")
  const [width, setWidth] = useState("")
  const [hsCode, setHsCode] = useState("")
  const [originCountry, setOriginCountry] = useState("")
  const [midCode, setMidCode] = useState("")
  const [material, setMaterial] = useState("")
  
  // Artwork state
  const [selectedArtwork, setSelectedArtwork] = useState<string>("")
  const [showArtworkSelector, setShowArtworkSelector] = useState(false)
  const [artworkSearchTerm, setArtworkSearchTerm] = useState("")

  // Variants state
  const [variants, setVariants] = useState<ProductVariant[]>([])

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch product and artworks in parallel
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
      
      // Set shipping info
      setWeight(prod.weight?.toString() || "")
      setLength(prod.length?.toString() || "")
      setHeight(prod.height?.toString() || "")
      setWidth(prod.width?.toString() || "")
      setHsCode(prod.hs_code || "")
      setOriginCountry(prod.origin_country || "")
      setMidCode(prod.mid_code || "")
      setMaterial(prod.material || "")
      
      // Set variants
      setVariants(prod.variants || [])
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

    if (!title) {
      setError("Please fill in the product title")
      return
    }

    try {
      setSaving(true)
      
      // Prepare metadata (artwork_id no longer stored here - only in artworks.product_ids)
      const updatedMetadata = {
        ...metadata
      }
      
      const requestBody = {
        title,
        subtitle,
        description,
        handle,
        status,
        discountable,
        metadata: updatedMetadata,
        weight: weight ? parseFloat(weight) : undefined,
        length: length ? parseFloat(length) : undefined,
        height: height ? parseFloat(height) : undefined,
        width: width ? parseFloat(width) : undefined,
        hs_code: hsCode || undefined,
        origin_country: originCountry || undefined,
        mid_code: midCode || undefined,
        material: material || undefined
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

      // Show success message briefly then navigate
      setError("")
      alert("Product updated successfully!")
      navigate("/products")
    } catch (error) {
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
      label: 'Standard Product',
      color: 'bg-gray-100 text-gray-800'
    }
  }

  const filteredArtworks = artworks.filter(artwork =>
    artwork.title.toLowerCase().includes(artworkSearchTerm.toLowerCase())
  )

  const selectedArtworkData = artworks.find(a => a.id === selectedArtwork)

  const getPrintfulDetails = () => {
    if (metadata?.fulfillment_type !== 'printful_pod') return null
    
    return {
      printful_product_id: metadata?.printful_product_id,
      mockup_urls: metadata?.mockup_urls || [],
      artwork_url: metadata?.artwork_url,
      original_thumbnail: metadata?.original_thumbnail
    }
  }

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

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-none">
      {/* Header */}
      <div className="flex items-center justify-between">
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <Tabs.List className="grid w-full grid-cols-5">
          <Tabs.Trigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General
          </Tabs.Trigger>
          <Tabs.Trigger value="media" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Media
          </Tabs.Trigger>
          <Tabs.Trigger value="variants" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Variants
          </Tabs.Trigger>
          <Tabs.Trigger value="metadata" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Metadata
          </Tabs.Trigger>
          <Tabs.Trigger value="shipping" className="flex items-center gap-2">
            <Box className="w-4 h-4" />
            Shipping
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
                      <Label htmlFor="subtitle" className="mb-1">
                        Subtitle
                      </Label>
                      <Input
                        id="subtitle"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Enter product subtitle"
                      />
                    </div>

                    <div>
                      <Label htmlFor="handle" className="mb-1">
                        Handle (URL slug)
                      </Label>
                      <Input
                        id="handle"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="product-handle"
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
                            <Select.Item value="proposed">Proposed</Select.Item>
                            <Select.Item value="rejected">Rejected</Select.Item>
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
                      {printfulDetails.mockup_urls.length > 0 && (
                        <div>
                          <Text className="font-medium text-green-700 mb-2">Mockups Generated:</Text>
                          <div className="grid grid-cols-4 gap-2">
                            {printfulDetails.mockup_urls.slice(0, 4).map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Mockup ${index + 1}`}
                                className="w-full aspect-square object-cover rounded border border-green-300"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Container>
                )}
              </div>

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
              <div>
                <Text className="text-sm font-medium text-gray-700 mb-2">Thumbnail</Text>
                {product.thumbnail ? (
                  <div className="relative inline-block">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <Badge className="absolute top-2 left-2 bg-blue-600 text-white">
                      Primary
                    </Badge>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              
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
                          className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
                        />
                        {index === 0 && (
                          <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
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
                </div>
              )}
              
              {/* Upload new images placeholder */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <Text className="text-lg font-medium text-gray-600 mb-2">
                  Advanced Image Management
                </Text>
                <Text className="text-sm text-gray-500 mb-4">
                  Upload, reorder, and manage product images
                </Text>
                <Button variant="secondary" disabled>
                  Coming Soon
                </Button>
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
              {variants.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Box className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p>No variants configured</p>
                  <p className="text-sm mt-1">Add variants to manage pricing and inventory</p>
                </div>
              ) : (
                variants.map((variant) => (
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

        {/* Metadata Tab */}
        <Tabs.Content value="metadata" className="space-y-6">
          <Container className="p-6">
            <h2 className="text-lg font-medium mb-4">Product Metadata</h2>
            
            <div className="space-y-4">
              {/* Add new metadata */}
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

              {/* Display existing metadata */}
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

        {/* Shipping Tab */}
        <Tabs.Content value="shipping" className="space-y-6">
          <Container className="p-6">
            <h2 className="text-lg font-medium mb-4">Shipping Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight" className="mb-1">
                  Weight (grams)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="length" className="mb-1">
                  Length (cm)
                </Label>
                <Input
                  id="length"
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="width" className="mb-1">
                  Width (cm)
                </Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="height" className="mb-1">
                  Height (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="hs-code" className="mb-1">
                  HS Code
                </Label>
                <Input
                  id="hs-code"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                  placeholder="Enter HS code"
                />
              </div>

              <div>
                <Label htmlFor="mid-code" className="mb-1">
                  MID Code
                </Label>
                <Input
                  id="mid-code"
                  value={midCode}
                  onChange={(e) => setMidCode(e.target.value)}
                  placeholder="Enter MID code"
                />
              </div>

              <div>
                <Label htmlFor="origin-country" className="mb-1">
                  Country of Origin
                </Label>
                <Input
                  id="origin-country"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  placeholder="e.g., US"
                />
              </div>

              <div>
                <Label htmlFor="material" className="mb-1">
                  Material
                </Label>
                <Input
                  id="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g., Cotton"
                />
              </div>
            </div>
          </Container>
        </Tabs.Content>
      </Tabs>
    </div>
  )
}

// Remove route config to prevent sidebar menu errors with parameterized routes

export default ProductDetailPage