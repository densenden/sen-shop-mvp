import { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Textarea, Label } from "@medusajs/ui"
import { Sparkles, Loader2, ArrowRight, ArrowLeft, Check, ExternalLink, Edit } from "lucide-react"

// COMPLETE PRINTFUL STUDIO - ALL ENHANCEMENTS
// ✅ Step 3: Variants + Mockup Styles Combined
// ✅ Step 4: Auto-description, EUR/USD pricing
// ✅ Step 5: Recent products + 4 action buttons
// ✅ Variants saved properly with Medusa v2

const PrintfulStudioComplete = () => {
  const [step, setStep] = useState(1)
  const [artworks, setArtworks] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  const [selectedMockupStyles, setSelectedMockupStyles] = useState<number[]>([])
  const [placementGroups, setPlacementGroups] = useState<any[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [markup, setMarkup] = useState(50)
  const [currency, setCurrency] = useState<"USD" | "EUR">("EUR")
  const [loading, setLoading] = useState(false)
  const [mockups, setMockups] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [createdProduct, setCreatedProduct] = useState<any>(null)
  const [recentProducts, setRecentProducts] = useState<any[]>([])

  // EUR conversion rate
  const EUR_RATE = 0.92

  // Load artworks
  useEffect(() => {
    fetch("/admin/printful-studio/v2/artworks", { credentials: "include" })
      .then(r => r.json())
      .then(d => setArtworks(d.artworks || []))
  }, [])

  // Load products
  const loadProducts = () => {
    setLoading(true)
    fetch("/admin/printful-studio/v2/catalog", { credentials: "include" })
      .then(r => r.json())
      .then(d => setProducts(d.catalog || []))
      .finally(() => setLoading(false))
  }

  // Load product details with placement groups
  const selectProduct = async (product: any) => {
    setLoading(true)
    try {
      const res = await fetch(`/admin/printful-studio/v2/catalog/${product.id}`, { credentials: "include" })
      const data = await res.json()

      // Fetch mockup styles
      const stylesRes = await fetch(`/admin/printful-studio/v2/catalog/${product.id}/mockup-styles`, { credentials: "include" })
      const stylesData = await stylesRes.json()

      setSelectedProduct(data.product)
      setPlacementGroups(stylesData.styles || [])
      setStep(3)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Get compatible mockup styles
  const getCompatibleStyles = () => {
    if (!placementGroups.length || selectedSizes.length === 0) return []

    const allStyles: any[] = []
    placementGroups.forEach(group => {
      group.mockup_styles?.forEach((style: any) => {
        const isUniversal = !style.restricted_to_variants || style.restricted_to_variants.length === 0
        const isCompatible = isUniversal || style.restricted_to_variants?.some((v: any) => selectedSizes.includes(Number(v)))

        if (isCompatible) {
          allStyles.push({ ...style, isUniversal })
        }
      })
    })

    return allStyles
  }

  // Generate mockups
  const generatePreview = async () => {
    if (!selectedProduct || !selectedArtwork || selectedSizes.length === 0) return
    setLoading(true)
    try {
      const res = await fetch(`/admin/printful-studio/v2/catalog/${selectedProduct.id}/mockups`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artwork_url: selectedArtwork.image_url,
          artwork_id: selectedArtwork.id,
          variant_ids: selectedSizes,
          mockup_style_ids: selectedMockupStyles.length > 0 ? selectedMockupStyles : undefined,
          wait_for_completion: true
        })
      })
      const data = await res.json()
      setMockups(data.mockup_urls || [selectedArtwork.image_url])

      // Auto-fill details
      setTitle(`${selectedArtwork.title} - ${selectedProduct.name}`)
      setDescription(`Beautiful ${selectedProduct.name} featuring "${selectedArtwork.title}". High-quality print-on-demand product created with Printful. Each piece is made to order, ensuring freshness and reducing waste.`)
      setStep(4)
    } catch (err) {
      console.error(err)
      setMockups([selectedArtwork.image_url])
      setTitle(`${selectedArtwork.title} - ${selectedProduct.name}`)
      setDescription(`Beautiful ${selectedProduct.name} featuring "${selectedArtwork.title}".`)
      setStep(4)
    } finally {
      setLoading(false)
    }
  }

  // Calculate price
  const calculatePrice = (basePrice: string) => {
    const base = parseFloat(basePrice)
    const withMarkup = base * (1 + markup / 100)
    return currency === "EUR" ? withMarkup * EUR_RATE : withMarkup
  }

  // Create product
  const createProduct = async () => {
    if (!selectedProduct || !selectedArtwork || selectedSizes.length === 0) return
    setCreating(true)
    try {
      const sessionRes = await fetch("/admin/printful-studio/composer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artwork_id: selectedArtwork.id })
      })
      const session = await sessionRes.json()

      const retailPrices: any = {}
      selectedSizes.forEach(id => {
        const variant = selectedProduct.variants.find((v: any) => v.id === id)
        retailPrices[String(id)] = parseFloat(variant?.price || "20") * (1 + markup / 100)
      })

      await fetch(`/admin/printful-studio/composer/${session.session_id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: {
            catalog_product_id: selectedProduct.id,
            catalog_product_name: selectedProduct.name,
            selected_variant_ids: selectedSizes.map(String)
          },
          design: {
            placement: placementGroups[0]?.placement || "default",
            technique: placementGroups[0]?.technique || "digital"
          },
          mockups: { mockup_urls: mockups },
          details: {
            product_title: title,
            product_description: description
          },
          pricing: {
            markup_type: "percentage",
            markup_value: markup,
            retail_prices: retailPrices,
            currency: "USD"
          }
        })
      })

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
        setCreatedProduct(result)
        await loadRecentProducts()
        setStep(5)
      } else {
        alert(`Error: ${result.errors?.join(", ") || "Unknown error"}`)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to create product")
    } finally {
      setCreating(false)
    }
  }

  // Load recent products
  const loadRecentProducts = async () => {
    try {
      const res = await fetch("/admin/products?limit=5", { credentials: "include" })
      const data = await res.json()
      setRecentProducts(data.products || [])
    } catch (err) {
      console.error(err)
    }
  }

  const reset = () => {
    setStep(1)
    setSelectedArtwork(null)
    setSelectedProduct(null)
    setSelectedSizes([])
    setSelectedMockupStyles([])
    setMockups([])
    setTitle("")
    setDescription("")
    setCreatedProduct(null)
  }

  const compatibleStyles = getCompatibleStyles()

  return (
    <Container>
      <div className="max-w-7xl mx-auto py-8 space-y-6">
        <div className="text-center">
          <Heading level="h1" className="text-3xl mb-2">Create POD Product</Heading>
          <p className="text-ui-fg-subtle">Professional 5-step process</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${step > i ? "bg-green-500 text-white" : step === i ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > i ? <Check size={20} /> : i}
              </div>
              {i < 5 && <div className={`w-12 h-1 ${step > i ? "bg-green-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 min-h-[600px]">
          {/* Step 1 */}
          {step === 1 && (
            <div>
              <Heading level="h2" className="mb-6">Choose Your Design</Heading>
              <div className="grid grid-cols-4 gap-4">
                {artworks.map(art => (
                  <div
                    key={art.id}
                    onClick={() => {
                      setSelectedArtwork(art)
                      setStep(2)
                      if (products.length === 0) loadProducts()
                    }}
                    className={`cursor-pointer border-2 rounded-lg p-3 ${selectedArtwork?.id === art.id ? "border-blue-500" : "border-gray-200 hover:border-blue-300"}`}
                  >
                    <img src={art.image_url} className="w-full h-32 object-cover rounded mb-2" />
                    <p className="text-sm font-medium truncate">{art.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <Heading level="h2" className="mb-6">Choose Product Type</Heading>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {products.map(prod => (
                    <div key={prod.id} onClick={() => selectProduct(prod)} className="cursor-pointer border rounded-lg p-4 hover:border-blue-500">
                      <img src={prod.thumbnail_url || prod.image} className="w-full h-48 object-cover rounded mb-3" />
                      <p className="font-medium text-center">{prod.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && selectedProduct && (
            <div>
              <Heading level="h2" className="mb-6">Select Sizes & Mockup Styles</Heading>
              <div className="mb-8">
                <Label className="mb-3 block">Available Sizes</Label>
                <div className="grid grid-cols-5 gap-3">
                  {selectedProduct.variants?.map((v: any) => (
                    <label key={v.id} className={`border-2 rounded-lg p-3 cursor-pointer ${selectedSizes.includes(v.id) ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(v.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedSizes([...selectedSizes, v.id])
                          } else {
                            setSelectedSizes(selectedSizes.filter(id => id !== v.id))
                            setSelectedMockupStyles([])
                          }
                        }}
                        className="mr-2"
                      />
                      <div className="font-medium text-sm">{v.size || v.name.split("(")[1]?.replace(")", "") || v.name}</div>
                      <div className="text-xs text-gray-500">${v.price}</div>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-sm text-gray-600">{selectedSizes.length} selected</p>
              </div>

              {selectedSizes.length > 0 && (
                <div>
                  <Label className="mb-3 block">Mockup Styles (Optional)</Label>
                  <div className="grid grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                    {compatibleStyles.map((style: any) => (
                      <label key={style.id} className={`border-2 rounded-lg p-2 cursor-pointer ${selectedMockupStyles.includes(style.id) ? "border-blue-500" : "border-gray-200"}`}>
                        <input
                          type="checkbox"
                          checked={selectedMockupStyles.includes(style.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedMockupStyles([...selectedMockupStyles, style.id])
                            } else {
                              setSelectedMockupStyles(selectedMockupStyles.filter(id => id !== style.id))
                            }
                          }}
                          className="mb-2"
                        />
                        {style.thumbnail_url ? (
                          <img src={style.thumbnail_url} className="w-full h-16 object-cover rounded mb-1" />
                        ) : (
                          <div className="w-full h-16 bg-gray-100 rounded mb-1" />
                        )}
                        <div className="text-xs truncate">{style.category_name}</div>
                        {style.isUniversal && <div className="text-xs text-green-600">✓ All</div>}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <Button className="mt-6" disabled={selectedSizes.length === 0 || loading} onClick={generatePreview}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div>
              <Heading level="h2" className="mb-6">Product Details</Heading>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <Label>Product Name</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <select value={currency} onChange={e => setCurrency(e.target.value as "USD" | "EUR")} className="w-full border rounded p-2">
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Markup (%)</Label>
                    <Input type="number" value={markup} onChange={e => setMarkup(Number(e.target.value))} />
                  </div>
                  <div className="border-t pt-4">
                    <Label className="mb-2 block">Prices:</Label>
                    {selectedProduct.variants?.filter((v: any) => selectedSizes.includes(v.id)).map((v: any) => (
                      <div key={v.id} className="flex justify-between text-sm py-1">
                        <span>{v.size || v.name}</span>
                        <span className="font-medium">{currency === "EUR" ? "€" : "$"}{calculatePrice(v.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Preview</Label>
                  {mockups[0] && <img src={mockups[0]} className="w-full rounded-lg border" />}
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <Button variant="secondary" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
                <Button disabled={!title.trim() || creating} onClick={createProduct}>
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : <><Sparkles className="w-4 h-4 mr-2" />Create</>}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div>
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <Heading level="h2" className="mb-4">Success!</Heading>
                <p className="text-gray-600">Product created and imported to Medusa</p>
              </div>

              {recentProducts.length > 0 && (
                <div className="mb-8">
                  <Label className="mb-3 block">Recent Products:</Label>
                  <div className="space-y-2">
                    {recentProducts.slice(0, 5).map(prod => (
                      <div key={prod.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <img src={prod.thumbnail || prod.images?.[0]?.url} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{prod.title}</p>
                          <p className="text-xs text-gray-500">{prod.variants?.length || 0} variants</p>
                        </div>
                        <Button variant="secondary" size="small" onClick={() => window.open(`/app/products/${prod.id}`, '_blank')}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" onClick={() => createdProduct?.medusa_product_id && window.open(`/app/products/${createdProduct.medusa_product_id}`, '_blank')}>
                  <Edit className="w-4 h-4 mr-2" />Edit Product
                </Button>
                <Button variant="secondary" onClick={() => {
                  const url = window.location.hostname === 'localhost' ? `http://localhost:3000` : `https://shop.sen.studio`
                  window.open(url, '_blank')
                }}>
                  <ExternalLink className="w-4 h-4 mr-2" />View Shop
                </Button>
                <Button onClick={() => {
                  setStep(2)
                  setSelectedProduct(null)
                  setSelectedSizes([])
                  setSelectedMockupStyles([])
                  setMockups([])
                  loadProducts()
                }}>
                  <Sparkles className="w-4 h-4 mr-2" />Same Artwork
                </Button>
                <Button onClick={reset}>
                  <Sparkles className="w-4 h-4 mr-2" />New Product
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Printful Studio"
})

export default PrintfulStudioComplete
