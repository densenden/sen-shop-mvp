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
  const [allArtworks, setAllArtworks] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>("all")
  const [products, setProducts] = useState<any[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  const [selectedMockupStyles, setSelectedMockupStyles] = useState<number[]>([])
  const [placementGroups, setPlacementGroups] = useState<any[]>([])
  const [productOptions, setProductOptions] = useState<Record<string, any>>({})
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [markup, setMarkup] = useState(50)
  const [currency, setCurrency] = useState<"USD" | "EUR">("EUR")
  const [loading, setLoading] = useState(false)
  const [mockups, setMockups] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [createdProduct, setCreatedProduct] = useState<any>(null)
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [generatingProgress, setGeneratingProgress] = useState("")
  const [rateLimitTimer, setRateLimitTimer] = useState(0)

  // EUR conversion rate
  const EUR_RATE = 0.92

  // Load artworks and collections
  useEffect(() => {
    Promise.all([
      fetch("/admin/printful-studio/v2/artworks", { credentials: "include" }).then(r => r.json()),
      fetch("/admin/artwork-collections", { credentials: "include" }).then(r => r.json())
    ]).then(([artworkData, collectionsData]) => {
      const artworksList = artworkData.artworks || []
      setAllArtworks(artworksList)
      setArtworks(artworksList)
      setCollections(collectionsData || [])
    })
  }, [])

  // Filter artworks by collection
  useEffect(() => {
    if (selectedCollection === "all") {
      setArtworks(allArtworks)
    } else if (selectedCollection === "uncategorized") {
      setArtworks(allArtworks.filter(a => !a.collection_id))
    } else {
      setArtworks(allArtworks.filter(a => a.collection_id === selectedCollection))
    }
  }, [selectedCollection, allArtworks])

  // Load recent products when reaching step 5
  useEffect(() => {
    if (step === 5) {
      loadRecentProducts()
    }
  }, [step])

  // Debug: Log when placementGroups changes
  useEffect(() => {
    console.log('[Studio] placementGroups changed:', {
      count: placementGroups.length,
      first: placementGroups[0]
    })
  }, [placementGroups])

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

      console.log('[Studio] Fetched mockup styles:', {
        product_id: product.id,
        styles_count: stylesData.styles?.length || 0,
        first_group: stylesData.styles?.[0]
      })

      console.log('[Studio] Product options:', data.product.product_options)

      setSelectedProduct(data.product)
      setPlacementGroups(stylesData.styles || [])

      // Initialize product options with defaults if they exist
      if (data.product.product_options && Array.isArray(data.product.product_options)) {
        const defaultOptions: Record<string, any> = {}
        data.product.product_options.forEach((option: any) => {
          if (option.values && option.values.length > 0) {
            // Set first value as default
            defaultOptions[option.key] = option.values[0].id || option.values[0]
          }
        })
        setProductOptions(defaultOptions)
        console.log('[Studio] Initialized product options:', defaultOptions)
      }

      console.log('[Studio] Set placement groups:', stylesData.styles?.length || 0)

      setStep(3)
    } catch (err) {
      console.error('[Studio] Error loading product:', err)
    } finally {
      setLoading(false)
    }
  }

  // Get mockup styles - show universal styles first, then variant-specific ones
  const getCompatibleStyles = () => {
    if (!placementGroups.length) {
      console.log('[Studio] No placement groups available')
      return []
    }

    const allStyles: any[] = []
    const universalStyles: any[] = []
    const variantSpecificStyles: any[] = []

    console.log('[Studio] Getting compatible styles:', {
      placement_groups: placementGroups.length,
      selected_sizes: selectedSizes.length,
      first_group_has_styles: placementGroups[0]?.mockup_styles?.length || 0
    })

    placementGroups.forEach(group => {
      group.mockup_styles?.forEach((style: any) => {
        const isUniversal = !style.restricted_to_variants || style.restricted_to_variants.length === 0

        if (isUniversal) {
          // Universal styles work with all variants
          universalStyles.push({ ...style, isUniversal: true, group: group.display_name })
        } else if (selectedSizes.length > 0) {
          // Only show variant-specific styles if variants are selected AND they match
          const isCompatible = style.restricted_to_variants?.some((v: any) => selectedSizes.includes(Number(v)))
          if (isCompatible) {
            variantSpecificStyles.push({ ...style, isUniversal: false, group: group.display_name })
          }
        }
      })
    })

    console.log('[Studio] Compatible styles found:', {
      universal: universalStyles.length,
      variant_specific: variantSpecificStyles.length,
      total: universalStyles.length + variantSpecificStyles.length
    })

    // Show universal styles first, then variant-specific
    return [...universalStyles, ...variantSpecificStyles]
  }

  // Generate mockups with progress tracking
  const generatePreview = async () => {
    if (!selectedProduct || !selectedArtwork || selectedSizes.length === 0) return
    setLoading(true)
    setGeneratingProgress("Initializing mockup generation...")

    try {
      // Estimate time: ~40 seconds per variant (includes Printful rate limiting)
      const estimatedSeconds = Math.max(40, selectedSizes.length * 40)
      setRateLimitTimer(estimatedSeconds)

      const startTime = Date.now()
      const timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = Math.max(0, estimatedSeconds - elapsed)
        setRateLimitTimer(remaining)

        if (remaining === 0) {
          clearInterval(timerInterval)
        }
      }, 1000)

      setGeneratingProgress(`Generating mockups for ${selectedSizes.length} variant${selectedSizes.length > 1 ? 's' : ''}...`)

      const res = await fetch(`/admin/printful-studio/v2/catalog/${selectedProduct.id}/mockups`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artwork_url: selectedArtwork.image_url,
          artwork_id: selectedArtwork.id,
          variant_ids: selectedSizes,
          mockup_style_ids: selectedMockupStyles.length > 0 ? selectedMockupStyles : undefined,
          product_options: Object.keys(productOptions).length > 0 ? productOptions : undefined,
          wait_for_completion: true
        })
      })

      setGeneratingProgress("Processing mockups...")
      const data = await res.json()

      clearInterval(timerInterval)
      setRateLimitTimer(0)

      const mockupUrls = data.mockup_urls || []
      setGeneratingProgress(`Generated ${mockupUrls.length} mockup${mockupUrls.length !== 1 ? 's' : ''}!`)
      setMockups(mockupUrls.length > 0 ? mockupUrls : [selectedArtwork.image_url])

      // Auto-fill details
      setTitle(`${selectedArtwork.title} - ${selectedProduct.name}`)
      setDescription(`Beautiful ${selectedProduct.name} featuring "${selectedArtwork.title}". High-quality print-on-demand product created with Printful. Each piece is made to order, ensuring freshness and reducing waste.`)

      setTimeout(() => {
        setGeneratingProgress("")
        setStep(4)
      }, 1500)
    } catch (err) {
      console.error(err)
      setGeneratingProgress("Error generating mockups")
      setMockups([selectedArtwork.image_url])
      setTitle(`${selectedArtwork.title} - ${selectedProduct.name}`)
      setDescription(`Beautiful ${selectedProduct.name} featuring "${selectedArtwork.title}".`)
      setTimeout(() => {
        setGeneratingProgress("")
        setStep(4)
      }, 2000)
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
        const basePrice = variant?.retail_price || variant?.price || "20.00"
        retailPrices[String(id)] = parseFloat(basePrice) * (1 + markup / 100)
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
      const res = await fetch(`/admin/products?limit=5&_=${Date.now()}`, {
        credentials: "include",
        cache: "no-cache"
      })
      const data = await res.json()
      console.log('[Studio] Loaded recent products:', data.products?.length || 0)
      setRecentProducts(data.products || [])
    } catch (err) {
      console.error('[Studio] Failed to load recent products:', err)
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
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <Heading level="h2">Choose Your Design</Heading>
                  <div className="text-sm text-gray-500">{artworks.length} artworks</div>
                </div>

                {/* Visual Collection Selector */}
                <div className="grid grid-cols-6 gap-3 mb-6">
                  <div
                    onClick={() => setSelectedCollection("all")}
                    className={`cursor-pointer border-2 rounded-lg p-2 text-center ${selectedCollection === "all" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                  >
                    <div className="w-full h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded mb-2 flex items-center justify-center text-white font-bold text-lg">ALL</div>
                    <div className="text-xs font-medium truncate">All Artworks</div>
                    <div className="text-xs text-gray-500">{allArtworks.length}</div>
                  </div>
                  <div
                    onClick={() => setSelectedCollection("uncategorized")}
                    className={`cursor-pointer border-2 rounded-lg p-2 text-center ${selectedCollection === "uncategorized" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                  >
                    <div className="w-full h-20 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-500 text-xl">?</div>
                    <div className="text-xs font-medium truncate">Uncategorized</div>
                    <div className="text-xs text-gray-500">{allArtworks.filter(a => !a.collection_id).length}</div>
                  </div>
                  {collections.map(col => (
                    <div
                      key={col.id}
                      onClick={() => setSelectedCollection(col.id)}
                      className={`cursor-pointer border-2 rounded-lg p-2 text-center ${selectedCollection === col.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                    >
                      {col.thumbnail_url ? (
                        <img src={col.thumbnail_url} className="w-full h-20 object-cover rounded mb-2" />
                      ) : (
                        <div className="w-full h-20 bg-gray-100 rounded mb-2" />
                      )}
                      <div className="text-xs font-medium truncate" title={col.name}>{col.name}</div>
                      <div className="text-xs text-gray-500">{allArtworks.filter(a => a.collection_id === col.id).length}</div>
                    </div>
                  ))}
                </div>
              </div>
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
              {artworks.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                  <p>No artworks in this collection</p>
                </div>
              )}
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
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-sm text-gray-600">{selectedSizes.length} selected</p>
              </div>

              <div>
                <Label className="mb-3 block">
                  Mockup Styles (Optional)
                  <span className="ml-2 text-xs text-gray-500">
                    {compatibleStyles.length} available
                  </span>
                </Label>
                {compatibleStyles.length > 0 ? (
                  <div className="grid grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                    {compatibleStyles.map((style: any, idx: number) => (
                      <label key={`${style.id}-${style.group || ''}-${idx}`} className={`border-2 rounded-lg p-2 cursor-pointer ${selectedMockupStyles.includes(style.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
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
                          <img src={style.thumbnail_url} className="w-full h-16 object-cover rounded mb-1" alt={style.view_name || style.category_name} />
                        ) : (
                          <div className="w-full h-16 bg-gray-100 rounded mb-1 flex items-center justify-center text-gray-400 text-xs">No preview</div>
                        )}
                        <div className="text-xs truncate font-medium" title={`${style.category_name || ''} - ${style.view_name || ''}`}>
                          {style.view_name || style.category_name || style.name || `Style ${style.id}`}
                        </div>
                        {style.isUniversal && <div className="text-xs text-green-600 font-medium">✓ All variants</div>}
                        {!style.isUniversal && selectedSizes.length > 0 && <div className="text-xs text-blue-600">Specific</div>}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    {selectedSizes.length === 0 ? (
                      <p>Select sizes above to see compatible mockup styles</p>
                    ) : (
                      <p>No mockup styles available for this product</p>
                    )}
                  </div>
                )}
                {selectedMockupStyles.length > 0 && (
                  <p className="mt-3 text-sm text-blue-600">{selectedMockupStyles.length} style{selectedMockupStyles.length > 1 ? 's' : ''} selected</p>
                )}
              </div>

              {loading && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-lg font-medium text-blue-900 mb-2">{generatingProgress}</p>
                  {rateLimitTimer > 0 && (
                    <div className="text-sm text-blue-600">
                      <p>Printful rate limit protection</p>
                      <p className="font-mono text-2xl mt-2">{rateLimitTimer}s</p>
                    </div>
                  )}
                </div>
              )}

              {!loading && (
                <Button className="mt-6" disabled={selectedSizes.length === 0} onClick={generatePreview}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
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
                    {selectedProduct.variants?.filter((v: any) => selectedSizes.includes(v.id)).map((v: any) => {
                      const basePrice = v.retail_price || v.price || "20.00"
                      return (
                        <div key={v.id} className="flex justify-between text-sm py-1">
                          <span>{v.size || v.name}</span>
                          <span className="font-medium">{currency === "EUR" ? "€" : "$"}{calculatePrice(basePrice).toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Mockups ({mockups.length})</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                    {mockups.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} className="w-full rounded-lg border" alt={`Mockup ${idx + 1}`} />
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {idx + 1}/{mockups.length}
                        </div>
                      </div>
                    ))}
                  </div>
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
  label: "03 POD Studio"
})

export default PrintfulStudioComplete
