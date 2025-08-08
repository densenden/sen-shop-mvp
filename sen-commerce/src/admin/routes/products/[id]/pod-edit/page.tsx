import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button, Input, Textarea, Badge, Label, Container, Heading, Tabs, IconButton, DropdownMenu, Text } from "@medusajs/ui"
import { 
  Package, 
  ArrowLeft, 
  Save, 
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Palette,
  Star,
  MoreVertical,
  Download,
  Eye
} from "lucide-react"

interface Product {
  id: string
  title: string
  subtitle?: string
  description?: string
  handle?: string
  status: string
  thumbnail?: string
  images?: { id?: string; url: string }[]
  metadata?: any
  variants?: any[]
  created_at: string
  updated_at: string
}

interface Artwork {
  id: string
  title: string
  image_url: string
  product_ids?: string[]
}

interface MockupTemplate {
  id: string
  name: string
  preview_url: string
  variant_ids: number[]
}

const PODEditPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [product, setProduct] = useState<Product | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [mockupTemplates, setMockupTemplates] = useState<MockupTemplate[]>([])
  const [generatingMockups, setGeneratingMockups] = useState(false)
  
  // Form state
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [description, setDescription] = useState("")
  const [handle, setHandle] = useState("")
  const [status, setStatus] = useState("draft")
  const [images, setImages] = useState<{ id?: string; url: string }[]>([])
  const [thumbnail, setThumbnail] = useState<string>("")
  const [selectedArtwork, setSelectedArtwork] = useState<string>("")
  
  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Tabs
  const [activeTab, setActiveTab] = useState<"general" | "media" | "mockups" | "variants">("general")

  useEffect(() => {
    fetchData()
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

      const prod = productData.product
      
      // Verify this is a POD product
      if (prod.metadata?.fulfillment_type !== 'printful_pod') {
        navigate(`/products/${id}`)
        return
      }

      setProduct(prod)
      setArtworks(artworkData.artworks || [])
      
      // Set form values
      setTitle(prod.title || "")
      setSubtitle(prod.subtitle || "")
      setDescription(prod.description || "")
      setHandle(prod.handle || "")
      setStatus(prod.status || "draft")
      setImages(prod.images || [])
      setThumbnail(prod.thumbnail || "")
      
      // Find connected artwork
      const connectedArtwork = artworkData.artworks?.find((artwork: Artwork) => 
        artwork.product_ids && artwork.product_ids.includes(id)
      )
      setSelectedArtwork(connectedArtwork?.id || "")
      
      // Fetch Printful mockup templates if we have a Printful product ID
      if (prod.metadata?.printful_product_id) {
        await fetchMockupTemplates(prod.metadata.printful_product_id)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchMockupTemplates = async (printfulProductId: string) => {
    try {
      const response = await fetch(`/admin/printful/products/${printfulProductId}/mockup-templates`, {
        credentials: "include"
      })
      
      if (response.ok) {
        const data = await response.json()
        setMockupTemplates(data.templates || [])
      }
    } catch (error) {
      console.error("Error fetching mockup templates:", error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setError("")

    try {
      const formData = new FormData()
      Array.from(files).forEach((file, index) => {
        formData.append('images', file)
      })

      const response = await fetch(`/admin/products/${id}/upload-images`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload images')
      }

      const result = await response.json()
      console.log('Upload result:', result)
      
      // Add new images to the list
      const newImages = result.images || []
      setImages(prev => [...prev, ...newImages])
      
      // Set first image as thumbnail if no thumbnail exists
      if (!thumbnail && newImages.length > 0) {
        const firstImage = newImages[0]
        const thumbnailUrl = typeof firstImage === 'string' ? firstImage : firstImage.url
        setThumbnail(thumbnailUrl)
      }
      
      console.log(`Successfully uploaded ${newImages.length} images`)
    } catch (error) {
      console.error("Error uploading images:", error)
      setError(`Failed to upload images: ${error.message}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Reset the file input
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const handleGenerateMockups = async () => {
    if (!product?.metadata?.printful_product_id || !selectedArtwork) {
      setError("Please select an artwork to generate mockups")
      return
    }

    setGeneratingMockups(true)
    setError("")

    try {
      const response = await fetch(`/admin/products/${id}/generate-mockups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          artwork_id: selectedArtwork,
          template_ids: mockupTemplates.map(t => t.id)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate mockups')
      }

      const result = await response.json()
      
      // Add generated mockups to images
      if (result.mockups && result.mockups.length > 0) {
        const mockupImages = result.mockups.map((url: string) => ({ url }))
        setImages(prev => [...prev, ...mockupImages])
        
        // Set first mockup as thumbnail if no thumbnail exists
        if (!thumbnail) {
          setThumbnail(result.mockups[0])
        }
      }
    } catch (error) {
      console.error("Error generating mockups:", error)
      setError("Failed to generate mockups. Please try again.")
    } finally {
      setGeneratingMockups(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSetAsThumbnail = (imageUrl: string) => {
    setThumbnail(imageUrl)
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
      
      const response = await fetch(`/admin/products/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          subtitle,
          description,
          handle,
          status,
          thumbnail,
          images: images.map(img => ({ url: img.url }))
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update product")
      }

      // Update artwork connection if changed
      if (selectedArtwork && product) {
        const currentArtwork = artworks.find(a => 
          a.product_ids && a.product_ids.includes(product.id)
        )
        
        if (currentArtwork?.id !== selectedArtwork) {
          // Remove from old artwork
          if (currentArtwork) {
            await fetch(`/admin/artworks/${currentArtwork.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                product_ids: currentArtwork.product_ids.filter(pid => pid !== product.id)
              })
            })
          }
          
          // Add to new artwork
          const newArtwork = artworks.find(a => a.id === selectedArtwork)
          if (newArtwork) {
            await fetch(`/admin/artworks/${selectedArtwork}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                product_ids: [...(newArtwork.product_ids || []), product.id]
              })
            })
          }
        }
      }

      navigate("/products")
    } catch (error) {
      console.error("Error updating product:", error)
      setError("Failed to update product. Please try again.")
    } finally {
      setSaving(false)
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
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Product not found</p>
        <Button onClick={() => navigate("/products")}>Back to Products</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate("/products")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit POD Product</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-green-100 text-green-800">
                <Package className="w-3 h-3 mr-1" />
                Print on Demand
              </Badge>
              {product.metadata?.printful_product_id && (
                <Badge variant="secondary">
                  Printful ID: {product.metadata.printful_product_id}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <Tabs.List className="grid w-full grid-cols-4">
          <Tabs.Trigger value="general" className="flex-1">General</Tabs.Trigger>
          <Tabs.Trigger value="media" className="flex-1">
            <span>Media</span>
            {images.length > 0 && (
              <Badge className="ml-2" size="small">{images.length}</Badge>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="mockups" className="flex-1">Mockups</Tabs.Trigger>
          <Tabs.Trigger value="variants" className="flex-1">Variants</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="general" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Container className="p-6">
                <h2 className="text-lg font-medium mb-4">Product Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Product title"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Product subtitle"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Product description"
                      rows={6}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="handle">Handle</Label>
                    <Input
                      id="handle"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="product-handle"
                    />
                  </div>
                </div>
              </Container>
            </div>

            <div className="space-y-6">
              <Container className="p-6">
                <h3 className="text-lg font-medium mb-4">Artwork</h3>
                <div className="space-y-3">
                  {selectedArtwork ? (
                    <>
                      {artworks.find(a => a.id === selectedArtwork)?.image_url && (
                        <img
                          src={artworks.find(a => a.id === selectedArtwork)?.image_url}
                          alt="Selected artwork"
                          className="w-full aspect-square object-cover rounded-lg border"
                        />
                      )}
                      <select
                        value={selectedArtwork}
                        onChange={(e) => setSelectedArtwork(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Select artwork</option>
                        {artworks.map(artwork => (
                          <option key={artwork.id} value={artwork.id}>
                            {artwork.title}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Palette className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No artwork selected</p>
                      <select
                        value={selectedArtwork}
                        onChange={(e) => setSelectedArtwork(e.target.value)}
                        className="mt-3 w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Select artwork</option>
                        {artworks.map(artwork => (
                          <option key={artwork.id} value={artwork.id}>
                            {artwork.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </Container>

              <Container className="p-6">
                <h3 className="text-lg font-medium mb-4">Status</h3>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Container>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="media" className="mt-6">
          <Container className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-medium">Product Images</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Upload multiple images for your product. The first image will be used as the thumbnail.
                </p>
              </div>
              <div className="relative">
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={uploading}
                />
                <Button
                  variant="secondary"
                  disabled={uploading}
                  className="relative flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Images
                    </>
                  )}
                </Button>
              </div>
            </div>

            {images.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No images uploaded yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Upload images or generate mockups from the Mockups tab
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Product image ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                    {thumbnail === image.url && (
                      <Badge 
                        className="absolute top-2 left-2 bg-green-100 text-green-800"
                        size="small"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Thumbnail
                      </Badge>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                          <IconButton size="small" variant="transparent">
                            <MoreVertical className="w-4 h-4" />
                          </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                          <DropdownMenu.Item onClick={() => handleSetAsThumbnail(image.url)}>
                            <Star className="w-4 h-4 mr-2" />
                            Set as Thumbnail
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onClick={() => window.open(image.url, '_blank')}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Size
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item 
                            onClick={() => handleRemoveImage(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Container>
        </Tabs.Content>

        <Tabs.Content value="mockups" className="mt-6">
          <Container className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-medium">Printful Mockups</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Generate product mockups using Printful's mockup generator
                </p>
              </div>
              <Button
                onClick={handleGenerateMockups}
                disabled={generatingMockups || !selectedArtwork}
                className="flex items-center gap-2"
              >
                {generatingMockups ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4" />
                    Generate Mockups
                  </>
                )}
              </Button>
            </div>

            {!selectedArtwork ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                Please select an artwork from the General tab to generate mockups
              </div>
            ) : mockupTemplates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No mockup templates available for this product</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mockupTemplates.map(template => (
                  <div key={template.id} className="border rounded-lg p-3">
                    <img
                      src={template.preview_url}
                      alt={template.name}
                      className="w-full aspect-square object-cover rounded mb-2"
                    />
                    <p className="text-sm font-medium truncate">{template.name}</p>
                  </div>
                ))}
              </div>
            )}
          </Container>
        </Tabs.Content>

        <Tabs.Content value="variants" className="mt-6">
          <Container className="p-6">
            <h2 className="text-lg font-medium mb-4">Product Variants</h2>
            <p className="text-sm text-gray-500 mb-6">
              Manage product variants and their pricing
            </p>
            
            {product?.variants && product.variants.length > 0 ? (
              <div className="space-y-4">
                {product.variants.map((variant: any) => (
                  <div key={variant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{variant.title}</h3>
                        <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
                      </div>
                      <Badge variant="secondary">
                        ${((variant.price || 0) / 100).toFixed(2)} {variant.currency_code?.toUpperCase() || 'USD'}
                      </Badge>
                    </div>
                    
                    {variant.prices && variant.prices.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Prices:</h4>
                        {variant.prices.map((price: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="font-mono">
                              ${(price.amount / 100).toFixed(2)} {price.currency_code?.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No variants found for this product</p>
              </div>
            )}
          </Container>
        </Tabs.Content>
      </Tabs>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "POD Edit",
  icon: Package,
})

export default PODEditPage