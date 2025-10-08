import { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Textarea } from "@medusajs/ui"
import { Sparkles, Check, Loader2, ChevronRight } from "lucide-react"

// ===== NEW PRINTFUL STUDIO - COMPLETE REDESIGN =====
// Uses ALL available Printful API data for production-ready product creation

interface Artwork {
  id: string
  title: string
  image_url: string
}

interface PrintfulProduct {
  id: string
  name: string
  description: string
  image: string
  variants: PrintfulVariant[]
  placement_groups: PlacementGroup[]
}

interface PrintfulVariant {
  id: number
  name: string
  image: string
  price: string
  size?: string
  color?: string
  availability_status: string
}

interface PlacementGroup {
  placement: string
  technique: string
  display_name: string
  print_area_width?: number
  print_area_height?: number
  dpi?: number
  mockup_styles: MockupStyle[]
}

interface MockupStyle {
  id: number
  category_name: string
  view_name: string
  thumbnail_url?: string
  restricted_to_variants?: number[]
}

type Step = "artwork" | "product" | "variants" | "placement" | "mockups" | "details" | "create"

const PrintfulStudioNew = () => {
  // State
  const [currentStep, setCurrentStep] = useState<Step>("artwork")
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [products, setProducts] = useState<PrintfulProduct[]>([])
  const [loading, setLoading] = useState(false)

  // Selection state
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<PrintfulProduct | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<number[]>([])
  const [selectedPlacementGroup, setSelectedPlacementGroup] = useState<PlacementGroup | null>(null)
  const [selectedMockupStyles, setSelectedMockupStyles] = useState<number[]>([])
  const [productTitle, setProductTitle] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [markup, setMarkup] = useState(50)
  const [printfulFileId, setPrintfulFileId] = useState<string | null>(null)
  const [mockupUrls, setMockupUrls] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  // Fetch artworks
  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const res = await fetch("/admin/printful-studio/v2/artworks", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setArtworks(data.artworks || [])
        }
      } catch (err) {
        console.error("Failed to fetch artworks:", err)
      }
    }
    fetchArtworks()
  }, [])

  // Fetch products when needed
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/admin/printful-studio/v2/catalog", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setProducts(data.catalog || [])
      }
    } catch (err) {
      console.error("Failed to fetch products:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch full product details with placement groups
  const selectProduct = async (product: any) => {
    setLoading(true)
    try {
      const res = await fetch(`/admin/printful-studio/v2/catalog/${product.id}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        const fullProduct = data.product

        // Fetch mockup styles (placement groups)
        const stylesRes = await fetch(`/admin/printful-studio/v2/catalog/${product.id}/mockup-styles`, { credentials: "include" })
        const stylesData = await stylesRes.json()

        setSelectedProduct({
          ...fullProduct,
          placement_groups: stylesData.styles || []
        })
        setSelectedVariants([])
        setSelectedPlacementGroup(null)
        setSelectedMockupStyles([])
        setCurrentStep("variants")
      }
    } catch (err) {
      console.error("Failed to fetch product details:", err)
    } finally {
      setLoading(false)
    }
  }

  // Upload artwork to Printful
  const uploadArtwork = async () => {
    if (!selectedArtwork) return
    setLoading(true)
    try {
      const res = await fetch("/admin/printful-studio/v2/files", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: selectedArtwork.image_url,
          filename: selectedArtwork.title
        })
      })
      if (res.ok) {
        const data = await res.json()
        setPrintfulFileId(data.file_id)
      }
    } catch (err) {
      console.error("Failed to upload artwork:", err)
    } finally {
      setLoading(false)
    }
  }

  // Generate mockups
  const generateMockups = async () => {
    if (!selectedProduct || !selectedArtwork || selectedVariants.length === 0 || !selectedPlacementGroup) return
    setLoading(true)
    try {
      const res = await fetch(`/admin/printful-studio/v2/catalog/${selectedProduct.id}/mockups`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artwork_url: selectedArtwork.image_url,
          variant_ids: selectedVariants,
          mockup_style_ids: selectedMockupStyles.length > 0 ? selectedMockupStyles : undefined,
          wait_for_completion: true
        })
      })
      if (res.ok) {
        const data = await res.json()
        setMockupUrls(data.mockup_urls || [])
        setCurrentStep("details")
      }
    } catch (err) {
      console.error("Failed to generate mockups:", err)
    } finally {
      setLoading(false)
    }
  }

  // Create product
  const createProduct = async () => {
    if (!selectedProduct || !selectedArtwork || selectedVariants.length === 0) return
    setCreating(true)
    try {
      // Create via composer API
      const sessionRes = await fetch("/admin/printful-studio/composer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artwork_id: selectedArtwork.id })
      })
      const session = await sessionRes.json()

      // Update session with all data
      await fetch(`/admin/printful-studio/composer/${session.session_id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: {
            catalog_product_id: selectedProduct.id,
            catalog_product_name: selectedProduct.name,
            selected_variant_ids: selectedVariants.map(String)
          },
          design: {
            placement: selectedPlacementGroup?.placement || "default",
            technique: selectedPlacementGroup?.technique || "DTG"
          },
          mockups: {
            mockup_urls: mockupUrls
          },
          details: {
            product_title: productTitle,
            product_description: productDescription
          },
          pricing: {
            markup_type: "percentage",
            markup_value: markup,
            retail_prices: Object.fromEntries(
              selectedVariants.map(id => {
                const variant = selectedProduct.variants.find(v => v.id === id)
                const basePrice = parseFloat(variant?.price || "20")
                return [String(id), basePrice * (1 + markup / 100)]
              })
            ),
            currency: "USD"
          }
        })
      })

      // Create product
      const createRes = await fetch(`/admin/printful-studio/composer/${session.session_id}/create-product`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_import_to_medusa: true,
          medusa_status: "draft"
        })
      })

      const result = await createRes.json()
      if (result.success) {
        alert(`Product created!\nPrintful: ${result.printful_product_id}\nMedusa: ${result.medusa_product_id || "Import pending"}`)
        // Reset
        setCurrentStep("artwork")
        setSelectedArtwork(null)
        setSelectedProduct(null)
        setSelectedVariants([])
        setMockupUrls([])
      } else {
        alert(`Error: ${result.errors?.join(", ") || "Unknown error"}`)
      }
    } catch (err) {
      console.error("Failed to create product:", err)
      alert("Failed to create product")
    } finally {
      setCreating(false)
    }
  }

  const steps: { id: Step; label: string; description: string }[] = [
    { id: "artwork", label: "Artwork", description: "Select your design" },
    { id: "product", label: "Product", description: "Choose product type" },
    { id: "variants", label: "Variants", description: "Select sizes & colors" },
    { id: "placement", label: "Print Method", description: "Choose technique & placement" },
    { id: "mockups", label: "Mockups", description: "Preview & generate" },
    { id: "details", label: "Details", description: "Title & description" },
    { id: "create", label: "Create", description: "Finalize product" }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  const canProceed = () => {
    switch (currentStep) {
      case "artwork": return selectedArtwork !== null
      case "product": return selectedProduct !== null
      case "variants": return selectedVariants.length > 0
      case "placement": return selectedPlacementGroup !== null
      case "mockups": return mockupUrls.length > 0
      case "details": return productTitle.trim().length > 0
      default: return true
    }
  }

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      const nextStepId = steps[nextIndex].id
      if (nextStepId === "product" && products.length === 0) {
        fetchProducts()
      }
      if (nextStepId === "mockups" && mockupUrls.length === 0 && selectedPlacementGroup) {
        generateMockups()
        return
      }
      if (nextStepId === "details" && !productTitle) {
        setProductTitle(`${selectedArtwork?.title || "Design"} - ${selectedProduct?.name || "Product"}`)
      }
      setCurrentStep(nextStepId)
    }
  }

  return (
    <Container>
      <div className="space-y-6 py-6">
        <Heading level="h1">Printful Studio - Product Creator</Heading>

        {/* Progress Steps */}
        <div className="flex items-center justify-between bg-ui-bg-subtle rounded-lg p-4">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex flex-col items-center ${idx <= currentStepIndex ? "text-ui-fg-base" : "text-ui-fg-disabled"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${idx < currentStepIndex ? "bg-green-500" : idx === currentStepIndex ? "bg-blue-500" : "bg-ui-bg-base border-2 border-ui-border-base"}`}>
                  {idx < currentStepIndex ? <Check className="w-5 h-5 text-white" /> : <span className="text-sm font-medium">{idx + 1}</span>}
                </div>
                <span className="text-xs font-medium mt-1">{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight className={`w-5 h-5 mx-2 ${idx < currentStepIndex ? "text-ui-fg-base" : "text-ui-fg-disabled"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-ui-bg-base border border-ui-border-base rounded-lg p-6 min-h-[500px]">
          {currentStep === "artwork" && (
            <div>
              <Heading level="h2" className="mb-4">Select Artwork</Heading>
              <div className="grid grid-cols-4 gap-4">
                {artworks.map(artwork => (
                  <div
                    key={artwork.id}
                    onClick={() => setSelectedArtwork(artwork)}
                    className={`cursor-pointer border-2 rounded-lg p-4 ${selectedArtwork?.id === artwork.id ? "border-blue-500" : "border-ui-border-base hover:border-ui-border-strong"}`}
                  >
                    <img src={artwork.image_url} alt={artwork.title} className="w-full h-40 object-cover rounded mb-2" />
                    <p className="text-sm font-medium truncate">{artwork.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === "product" && (
            <div>
              <Heading level="h2" className="mb-4">Select Product</Heading>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {products.map(product => (
                    <div
                      key={product.id}
                      onClick={() => selectProduct(product)}
                      className="cursor-pointer border border-ui-border-base hover:border-blue-500 rounded-lg p-4"
                    >
                      <img src={product.thumbnail_url || product.image} alt={product.name} className="w-full h-48 object-cover rounded mb-2" />
                      <p className="font-medium">{product.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === "variants" && selectedProduct && (
            <div>
              <Heading level="h2" className="mb-4">Select Variants</Heading>
              <p className="text-sm text-ui-fg-subtle mb-4">Choose sizes and colors for {selectedProduct.name}</p>
              <div className="grid grid-cols-5 gap-3">
                {selectedProduct.variants.map(variant => (
                  <label
                    key={variant.id}
                    className={`border-2 rounded-lg p-3 cursor-pointer ${selectedVariants.includes(variant.id) ? "border-blue-500 bg-ui-bg-highlight" : "border-ui-border-base hover:border-ui-border-strong"}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVariants.includes(variant.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedVariants([...selectedVariants, variant.id])
                        } else {
                          setSelectedVariants(selectedVariants.filter(id => id !== variant.id))
                        }
                      }}
                      className="mr-2"
                    />
                    <div className="text-sm font-medium">{variant.size || variant.name}</div>
                    <div className="text-xs text-ui-fg-subtle">${variant.price}</div>
                  </label>
                ))}
              </div>
              <p className="mt-4 text-sm text-ui-fg-subtle">{selectedVariants.length} variant(s) selected</p>
            </div>
          )}

          {currentStep === "placement" && selectedProduct && (
            <div>
              <Heading level="h2" className="mb-4">Choose Print Method</Heading>
              <div className="space-y-3">
                {selectedProduct.placement_groups?.map((group, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer ${selectedPlacementGroup === group ? "border-blue-500 bg-ui-bg-highlight" : "border-ui-border-base hover:border-ui-border-strong"}`}
                  >
                    <input
                      type="radio"
                      checked={selectedPlacementGroup === group}
                      onChange={() => {
                        setSelectedPlacementGroup(group)
                        setSelectedMockupStyles([])
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{group.display_name || `${group.placement} - ${group.technique}`}</div>
                      <div className="text-sm text-ui-fg-subtle mt-1">
                        {group.mockup_styles.length} mockup style(s) available
                        {group.print_area_width && ` • Print area: ${group.print_area_width}" × ${group.print_area_height}"`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === "mockups" && selectedPlacementGroup && (
            <div>
              <Heading level="h2" className="mb-4">Mockup Styles</Heading>
              <p className="text-sm text-ui-fg-subtle mb-4">Select mockup perspectives (optional - leave empty for auto-select)</p>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {selectedPlacementGroup.mockup_styles.map(style => {
                  const isUniversal = !style.restricted_to_variants || style.restricted_to_variants.length === 0
                  const isCompatible = isUniversal || style.restricted_to_variants?.some(v => selectedVariants.includes(v))

                  return (
                    <label
                      key={style.id}
                      className={`border-2 rounded-lg p-3 cursor-pointer ${!isCompatible ? "opacity-50 cursor-not-allowed" : selectedMockupStyles.includes(style.id) ? "border-blue-500 bg-ui-bg-highlight" : "border-ui-border-base hover:border-ui-border-strong"}`}
                    >
                      <input
                        type="checkbox"
                        disabled={!isCompatible}
                        checked={selectedMockupStyles.includes(style.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedMockupStyles([...selectedMockupStyles, style.id])
                          } else {
                            setSelectedMockupStyles(selectedMockupStyles.filter(id => id !== style.id))
                          }
                        }}
                        className="mr-2"
                      />
                      {style.thumbnail_url && <img src={style.thumbnail_url} className="w-full h-20 object-cover rounded mb-2" />}
                      <div className="text-xs font-medium">{style.category_name}</div>
                      <div className="text-xs text-ui-fg-subtle">{style.view_name}</div>
                      {isUniversal && <Badge color="green" size="small" className="mt-1">Universal</Badge>}
                    </label>
                  )
                })}
              </div>
              <Button onClick={generateMockups} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Mockups
              </Button>
              {mockupUrls.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {mockupUrls.map((url, idx) => (
                    <img key={idx} src={url} className="w-full h-64 object-cover rounded border" />
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === "details" && (
            <div>
              <Heading level="h2" className="mb-4">Product Details</Heading>
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium mb-2">Product Title</label>
                  <Input value={productTitle} onChange={e => setProductTitle(e.target.value)} placeholder="Enter product title" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder="Enter description" rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Markup (%)</label>
                  <Input type="number" value={markup} onChange={e => setMarkup(Number(e.target.value))} />
                </div>
              </div>
            </div>
          )}

          {currentStep === "create" && (
            <div className="text-center py-12">
              <Heading level="h2" className="mb-4">Ready to Create</Heading>
              <p className="text-ui-fg-subtle mb-6">Review and create your product</p>
              <div className="max-w-md mx-auto space-y-2 text-left bg-ui-bg-subtle p-4 rounded mb-6">
                <div className="flex justify-between"><span>Artwork:</span><span className="font-medium">{selectedArtwork?.title}</span></div>
                <div className="flex justify-between"><span>Product:</span><span className="font-medium">{selectedProduct?.name}</span></div>
                <div className="flex justify-between"><span>Variants:</span><span className="font-medium">{selectedVariants.length}</span></div>
                <div className="flex justify-between"><span>Mockups:</span><span className="font-medium">{mockupUrls.length}</span></div>
                <div className="flex justify-between"><span>Markup:</span><span className="font-medium">{markup}%</span></div>
              </div>
              <Button onClick={createProduct} disabled={creating} size="large">
                {creating ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Creating...</> : "Create Product"}
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="secondary" disabled={currentStepIndex === 0} onClick={() => setCurrentStep(steps[currentStepIndex - 1].id)}>
            Previous
          </Button>
          <Button disabled={!canProceed() || loading} onClick={nextStep}>
            {currentStep === "create" ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Printful Studio (New)"
})

export default PrintfulStudioNew
