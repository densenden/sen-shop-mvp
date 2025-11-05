import { useEffect, useState, useMemo } from "react"
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
  const [provider, setProvider] = useState<'printful-v1' | 'printful-v2' | 'printify'>('printful-v2')
  const [artworks, setArtworks] = useState<any[]>([])
  const [allArtworks, setAllArtworks] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>("all")
  const [products, setProducts] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([]) // Store all products for client-side filtering
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  const [selectedMockupStyles, setSelectedMockupStyles] = useState<number[]>([])
  const [selectedCombinations, setSelectedCombinations] = useState<Set<string>>(new Set()) // "variantId-styleId"
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

  // AI Content Generation state
  const [generatingAI, setGeneratingAI] = useState(false)
  const [aiVariations, setAiVariations] = useState<Array<{title: string, description: string}>>([])
  const [showAIModal, setShowAIModal] = useState(false)

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBrand, setSelectedBrand] = useState<string>("all")
  const [mockupGenerationStatus, setMockupGenerationStatus] = useState<{
    total: number
    completed: number
    completedUrls: string[]
    currentIndex: number
    failed: number
    mockupNames: string[]
    startTime: number | null
    elapsedSeconds: number
    waitCountdown: number
    mockupsByStyleVariant: Record<string, string> // key: "variantId-styleId", value: mockup URL
    currentComboKey: string | null // Track which exact variant+style combo is currently being generated
    timelineEvents: Array<{ type: 'request_start' | 'request_end' | 'wait_start' | 'wait_end', timestamp: number, index: number }>
  }>({ total: 0, completed: 0, completedUrls: [], currentIndex: 0, failed: 0, mockupNames: [], startTime: null, elapsedSeconds: 0, waitCountdown: 0, mockupsByStyleVariant: {}, currentComboKey: null, timelineEvents: [] })

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

  // Mockup style loader - filter by selected variants to show only compatible styles
  // Use useMemo to recalculate when dependencies change
  const compatibleStyles = useMemo(() => {
    if (!placementGroups.length) {
      console.log('[Studio] No placement groups available')
      return []
    }

    const allStyles: any[] = []
    const seenStyleIds = new Set<number>() // Track to avoid duplicates

    console.log('[Studio] Loading mockup styles:', {
      placement_groups: placementGroups.length,
      selected_variants: selectedSizes.length
    })

    placementGroups.forEach((group) => {
      group.mockup_styles?.forEach((style: any) => {
        // Skip if already processed (avoid duplicates)
        if (seenStyleIds.has(style.id)) {
          return
        }
        seenStyleIds.add(style.id)

        // Mark universal vs restricted styles for UI display
        const isUniversal = !style.restricted_to_variants || style.restricted_to_variants.length === 0

        // Check compatibility with selected variants
        const compatibleVariantIds = new Set<number>()
        if (isUniversal) {
          // Universal styles work with all variants
          selectedProduct?.variants?.forEach((v: any) => compatibleVariantIds.add(v.id))
        } else if (style.restricted_to_variants) {
          // Only include variants that are in the restriction list AND exist in the current product
          const productVariantIds = new Set(selectedProduct?.variants?.map((v: any) => v.id) || [])
          style.restricted_to_variants.forEach((vId: number) => {
            if (productVariantIds.has(vId)) {
              compatibleVariantIds.add(vId)
            }
          })

          // Log warning if style is restricted but has no compatible variants in this product
          if (compatibleVariantIds.size === 0) {
            console.log(`[Studio] Style ${style.id} (${style.view_name}) is restricted to variants that don't exist in this product`, {
              style_id: style.id,
              restricted_to: style.restricted_to_variants,
              product_variants: Array.from(productVariantIds)
            })
          }
        }

        // Only show styles that are compatible with at least one selected variant (or if no variants selected yet)
        if (selectedSizes.length === 0 || compatibleVariantIds.size > 0) {
          allStyles.push({
            ...style,
            isUniversal,
            group: group.display_name,
            compatibleVariantIds: Array.from(compatibleVariantIds)
          })
        }
      })
    })

    // Prioritize universal styles, then limit to 12 total styles to keep UI manageable
    const universalStyles = allStyles.filter(s => s.isUniversal)
    const restrictedStyles = allStyles.filter(s => !s.isUniversal)

    const limitedStyles = [
      ...universalStyles,
      ...restrictedStyles.slice(0, Math.max(0, 12 - universalStyles.length))
    ]

    console.log('[Studio] Compatible mockup styles loaded:', {
      total_available: allStyles.length,
      universal_count: universalStyles.length,
      restricted_count: restrictedStyles.length,
      showing: limitedStyles.length,
      filtered_by_variants: selectedSizes.length > 0
    })

    return limitedStyles
  }, [placementGroups, selectedProduct, selectedSizes])

  // Auto-select universal mockup styles when variants change
  useEffect(() => {
    if (selectedSizes.length > 0 && placementGroups.length > 0) {
      // Build compatible styles based on selected variants
      const allStyles: any[] = []
      placementGroups.forEach((group) => {
        group.mockup_styles?.forEach((style: any) => {
          const isUniversal = !style.restricted_to_variants || style.restricted_to_variants.length === 0
          if (isUniversal || style.restricted_to_variants?.some((vId: number) => selectedSizes.includes(vId))) {
            allStyles.push(style)
          }
        })
      })

      // Find universal styles (work with all variants)
      const universalStyles = allStyles.filter(s => !s.restricted_to_variants || s.restricted_to_variants.length === 0)

      if (universalStyles.length > 0) {
        // Auto-select up to 3 universal styles
        const autoSelectedIds = universalStyles.slice(0, 3).map(s => s.id)

        // Only auto-select if user hasn't manually selected anything yet
        if (selectedMockupStyles.length === 0) {
          setSelectedMockupStyles(autoSelectedIds)
          console.log('[Studio] Auto-selected universal mockup styles:', autoSelectedIds)
        }
      }
    }
  }, [selectedSizes, placementGroups]) // Depend on selectedSizes and placementGroups

  // Load products based on provider
  const loadProducts = () => {
    setLoading(true)
    setCurrentPage(1) // Reset to first page
    setSearchTerm("") // Reset search
    setSelectedBrand("all") // Reset brand filter

    let endpoint = '/admin/printful-studio/v2/catalog'
    if (provider === 'printful-v1') {
      endpoint = '/admin/printful-studio/v1/catalog'
    } else if (provider === 'printify') {
      endpoint = '/admin/printful-studio/printify/catalog'
    }

    console.log('[Studio] Loading products from:', endpoint, 'provider:', provider)

    fetch(endpoint, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        console.log('[Studio] Received data:', d)
        // Different providers return different formats
        let productsList = []
        if (provider === 'printful-v1') {
          productsList = d.products || []
        } else if (provider === 'printful-v2') {
          productsList = d.catalog || []
        } else if (provider === 'printify') {
          productsList = d.products || []
        }
        console.log('[Studio] Parsed products list:', productsList.length, 'products')
        setAllProducts(productsList)
        setProducts(productsList) // Initially show all
      })
      .finally(() => setLoading(false))
  }

  // Reload products when provider changes
  useEffect(() => {
    if (step === 2) {
      loadProducts()
    }
  }, [provider])

  // Get unique brands for filter dropdown
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>()
    allProducts.forEach(p => {
      if (p.brand) brands.add(p.brand)
    })
    return Array.from(brands).sort()
  }, [allProducts])

  // Filter and paginate products
  const { filteredProducts, paginatedProducts, totalPages } = useMemo(() => {
    // Apply filters
    let filtered = allProducts

    // Search filter (name, title, brand, model)
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        (p.name?.toLowerCase().includes(search)) ||
        (p.title?.toLowerCase().includes(search)) ||
        (p.brand?.toLowerCase().includes(search)) ||
        (p.model?.toLowerCase().includes(search))
      )
    }

    // Brand filter
    if (selectedBrand !== "all") {
      filtered = filtered.filter(p => p.brand === selectedBrand)
    }

    // Calculate pagination
    const total = Math.ceil(filtered.length / itemsPerPage)
    const startIdx = (currentPage - 1) * itemsPerPage
    const endIdx = startIdx + itemsPerPage
    const paginated = filtered.slice(startIdx, endIdx)

    return {
      filteredProducts: filtered,
      paginatedProducts: paginated,
      totalPages: total
    }
  }, [allProducts, searchTerm, selectedBrand, currentPage, itemsPerPage])

  // Update products state when filters change
  useEffect(() => {
    setProducts(paginatedProducts)
  }, [paginatedProducts])

  // Load product details with placement groups
  const selectProduct = async (product: any) => {
    setLoading(true)
    try {
      let fullProduct: any
      let mockupStyles: any[] = []

      // Fetch product details based on provider
      let res, data
      if (provider === 'printify') {
        res = await fetch(`/admin/printful-studio/printify/blueprints/${product.id}`, { credentials: "include" })
        data = await res.json()
        // Printify blueprints don't have mockup styles in the same way
        mockupStyles = []
      } else {
        const catalogPath = provider === 'printful-v1' ? 'v1' : 'v2'
        res = await fetch(`/admin/printful-studio/${catalogPath}/catalog/${product.id}`, { credentials: "include" })
        data = await res.json()

        // Fetch mockup styles (Printful V2 only)
        if (provider === 'printful-v2') {
          const stylesRes = await fetch(`/admin/printful-studio/v2/catalog/${product.id}/mockup-styles`, { credentials: "include" })
          const stylesData = await stylesRes.json()
          mockupStyles = stylesData.styles || []
        }
      }

      fullProduct = data.product

      console.log('[Studio] Fetched mockup styles:', {
        product_id: product.id,
        styles_count: mockupStyles.length,
        first_group: mockupStyles[0]
      })

      console.log('[Studio] Product options:', fullProduct.product_options)

      setSelectedProduct(fullProduct)
      setPlacementGroups(mockupStyles)

      // Initialize product options with defaults if they exist
      if (fullProduct.product_options && Array.isArray(fullProduct.product_options)) {
        const defaultOptions: Record<string, any> = {}
        fullProduct.product_options.forEach((option: any) => {
          if (option.values && option.values.length > 0) {
            // Set first value as default
            defaultOptions[option.key] = option.values[0].id || option.values[0]
          }
        })
        setProductOptions(defaultOptions)
        console.log('[Studio] Initialized product options:', defaultOptions)
      }

      console.log('[Studio] Set placement groups:', mockupStyles.length)

      setStep(3)
    } catch (err) {
      console.error('[Studio] Error loading product:', err)
    } finally {
      setLoading(false)
    }
  }

  // Generate mockups using BATCH endpoint - backend handles rate limiting
  const generatePreview = async (predefinedCombinations?: Array<{ variantId: number, styleId: number | null }>) => {
    if (!selectedProduct || !selectedArtwork) return

    // Use predefined combinations if provided (from new unified grid), otherwise build from selectedSizes/selectedMockupStyles (legacy)
    let combinations: Array<{ variantId: number, styleId: number | null }> = []

    if (predefinedCombinations && predefinedCombinations.length > 0) {
      // New approach: use combinations from selectedCombinations Set
      combinations = predefinedCombinations
      console.log('[Studio] Using predefined combinations:', combinations)
    } else if (selectedSizes.length > 0) {
      // Legacy approach: build combinations from selectedSizes and selectedMockupStyles
      if (selectedMockupStyles.length > 0) {
        // User selected specific styles - generate for each variant+style combo
        selectedSizes.forEach(variantId => {
          selectedMockupStyles.forEach(styleId => {
            combinations.push({ variantId, styleId })
          })
        })
      } else {
        // No specific styles - generate default mockups (one per variant)
        selectedSizes.forEach(variantId => {
          combinations.push({ variantId, styleId: null })
        })
      }
      console.log('[Studio] Using legacy combinations from state:', combinations)
    } else {
      console.log('[Studio] No combinations to generate!')
      return
    }

    setLoading(true)

    const totalExpected = combinations.length

    console.log('[Studio] Starting batch mockup generation:', {
      product_id: selectedProduct.id,
      total_combinations: totalExpected,
      variant_count: selectedSizes.length,
      style_count: selectedMockupStyles.length || 'auto'
    })

    // Initialize status with start time
    const startTime = Date.now()
    setMockupGenerationStatus({
      total: totalExpected,
      completed: 0,
      completedUrls: [],
      currentIndex: 0,
      failed: 0,
      mockupNames: [],
      startTime,
      elapsedSeconds: 0,
      waitCountdown: 0,
      mockupsByStyleVariant: {},
      currentComboKey: null,
      timelineEvents: []
    })

    // Timer to update elapsed time every second
    const elapsedTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setMockupGenerationStatus(prev => ({
        ...prev,
        elapsedSeconds: elapsed
      }))
    }, 1000)

    const generatedMockups: string[] = []
    const generatedNames: string[] = []
    const mockupsByStyleVariant: Record<string, string> = {}
    let failedCount = 0

    // Generate mockups one by one with real-time UI updates
    for (let i = 0; i < combinations.length; i++) {
      const combo = combinations[i]
      const comboKey = `${combo.variantId}-${combo.styleId || 'default'}`

      console.log(`[Studio] Loop iteration ${i + 1}/${combinations.length} starting`)

      // Track which combo is currently being generated
      setMockupGenerationStatus(prev => ({
        ...prev,
        currentIndex: i,
        currentComboKey: comboKey,
        timelineEvents: [...(prev.timelineEvents || []), { type: 'request_start', timestamp: Date.now(), index: i }]
      }))

      setGeneratingProgress(`Generating mockup ${i + 1}/${totalExpected}...`)

      const requestStartTime = Date.now()

      try {
        console.log(`[Studio] About to fetch mockup ${i + 1}`, {
          variant_id: combo.variantId,
          style_id: combo.styleId,
          combo_key: comboKey
        })

        // Retry logic for rate limits (429)
        let response
        let retryCount = 0
        const MAX_RETRIES = 3

        while (retryCount <= MAX_RETRIES) {
          response = await fetch(`/admin/printful-studio/v2/catalog/${selectedProduct.id}/mockups`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              variant_ids: [String(combo.variantId)],
              mockup_style_ids: combo.styleId ? [combo.styleId] : undefined,
              artwork_url: selectedArtwork.image_url,
              artwork_id: selectedArtwork.id,
              product_options: Object.keys(productOptions).length > 0 ? productOptions : undefined,
              max_mockups: 1,
              wait_for_completion: true
            })
          })

          // Check for rate limit (429 or 400 with rate limit message)
          let isRateLimit = response.status === 429
          if ((response.status === 400 || response.status === 429) && retryCount < MAX_RETRIES) {
            try {
              const errorText = await response.clone().text()
              if (errorText.includes('rate limit') || errorText.includes('too many requests') || errorText.includes('TooManyRequests')) {
                isRateLimit = true
              }
            } catch {}
          }

          if (isRateLimit && retryCount < MAX_RETRIES) {
            const retryWait = Math.min(60000, 10000 * Math.pow(2, retryCount)) // Exponential: 10s, 20s, 40s (max 60s)
            console.log(`[Studio] ⏸️  Rate limit hit (${response.status}), waiting ${retryWait/1000}s before retry ${retryCount + 1}/${MAX_RETRIES}`)
            setGeneratingProgress(`Rate limit: retrying in ${retryWait/1000}s (${retryCount + 1}/${MAX_RETRIES})...`)

            await new Promise(resolve => setTimeout(resolve, retryWait))
            retryCount++
            continue
          }

          break // Success or non-rate-limit error
        }

        const requestEndTime = Date.now()
        const requestDuration = requestEndTime - requestStartTime

        // Update timeline with request end
        setMockupGenerationStatus(prev => ({
          ...prev,
          timelineEvents: [...(prev.timelineEvents || []), { type: 'request_end', timestamp: requestEndTime, index: i }],
          currentComboKey: null
        }))

        console.log(`[Studio] Fetch completed for mockup ${i + 1}, took ${Math.round(requestDuration / 1000)}s${retryCount > 0 ? ` (${retryCount} retries)` : ''}`)

        if (response!.ok) {
          const data = await response.json()

          if (data.mockup_urls && data.mockup_urls.length > 0) {
            generatedMockups.push(data.mockup_urls[0])
            mockupsByStyleVariant[comboKey] = data.mockup_urls[0]

            const variant = selectedProduct.variants.find((v: any) => v.id === combo.variantId)
            const variantName = variant?.size || variant?.name || `Variant ${combo.variantId}`
            const style = combo.styleId ? compatibleStyles.find(s => s.id === combo.styleId) : null
            const styleName = style?.view_name || style?.category_name || 'Default'
            generatedNames.push(`${variantName} - ${styleName}`)

            console.log(`[Studio] ✅ Mockup ${i + 1}/${totalExpected} generated: ${comboKey}`)

            setMockupGenerationStatus(prev => ({
              ...prev,
              completed: prev.completed + 1,
              completedUrls: [...prev.completedUrls, data.mockup_urls[0]],
              mockupNames: [...prev.mockupNames, `${variantName} - ${styleName}`],
              mockupsByStyleVariant: { ...prev.mockupsByStyleVariant, [comboKey]: data.mockup_urls[0] }
            }))
          } else {
            failedCount++
            generatedNames.push('Failed')
            console.log(`[Studio] ❌ Mockup ${i + 1}/${totalExpected} failed: No URL returned`)
            setMockupGenerationStatus(prev => ({ ...prev, failed: prev.failed + 1, mockupNames: [...prev.mockupNames, 'Failed'] }))
          }
        } else {
          failedCount++
          generatedNames.push('Failed')
          console.log(`[Studio] ❌ Mockup ${i + 1}/${totalExpected} failed: HTTP ${response.status}`)
          setMockupGenerationStatus(prev => ({ ...prev, failed: prev.failed + 1, mockupNames: [...prev.mockupNames, 'Failed'] }))
        }

      } catch (err: any) {
        console.error(`[Studio] Error generating mockup ${i + 1}:`, err)
        failedCount++
        generatedNames.push('Failed')
        setMockupGenerationStatus(prev => ({ ...prev, failed: prev.failed + 1, mockupNames: [...prev.mockupNames, 'Failed'] }))
      }

      // Rate limit protection: Wait 45s between requests (unless this is the last one)
      if (i < combinations.length - 1) {
        const WAIT_TIME_MS = 45000
        const waitStartTime = Date.now()

        setMockupGenerationStatus(prev => ({
          ...prev,
          timelineEvents: [...(prev.timelineEvents || []), { type: 'wait_start', timestamp: waitStartTime, index: i }]
        }))

        setGeneratingProgress(`Rate limit pause: waiting 45s before next mockup...`)

        // Countdown timer for wait
        const countdownInterval = setInterval(() => {
          const elapsed = Date.now() - waitStartTime
          const remaining = Math.max(0, Math.ceil((WAIT_TIME_MS - elapsed) / 1000))
          setMockupGenerationStatus(prev => ({ ...prev, waitCountdown: remaining }))
        }, 1000)

        await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS))

        clearInterval(countdownInterval)

        const waitEndTime = Date.now()
        setMockupGenerationStatus(prev => ({
          ...prev,
          waitCountdown: 0,
          timelineEvents: [...(prev.timelineEvents || []), { type: 'wait_end', timestamp: waitEndTime, index: i }]
        }))

        console.log(`[Studio] Wait complete, continuing to mockup ${i + 2}`)
      }
    }

    // Update final status
    setMockupGenerationStatus(prev => ({
      ...prev,
      completed: generatedMockups.length,
      failed: failedCount,
      completedUrls: generatedMockups,
      mockupNames: generatedNames,
      mockupsByStyleVariant
    }))

    // Clear timer
    clearInterval(elapsedTimer)

    const totalTime = Math.floor((Date.now() - startTime) / 1000)
    const minutes = Math.floor(totalTime / 60)
    const seconds = totalTime % 60

    console.log('[Studio] Mockup generation complete:', {
      total_expected: totalExpected,
      generated: generatedMockups.length,
      failed: failedCount,
      total_time: `${minutes}m ${seconds}s`
    })

    setMockups(generatedMockups.length > 0 ? generatedMockups : [selectedArtwork.image_url])

    if (generatedMockups.length < totalExpected) {
      setGeneratingProgress(`✅ Generated ${generatedMockups.length}/${totalExpected} mockups (${failedCount} failed) in ${minutes}m ${seconds}s`)
    } else {
      setGeneratingProgress(`✅ All ${generatedMockups.length} mockups generated in ${minutes}m ${seconds}s!`)
    }

    // Auto-fill details
    setTitle(`${selectedArtwork.title} - ${selectedProduct.name}`)
    setDescription(`Beautiful ${selectedProduct.name} featuring "${selectedArtwork.title}". High-quality print-on-demand product created with Printful. Each piece is made to order, ensuring freshness and reducing waste.`)

    setTimeout(() => {
      setGeneratingProgress("")
      setStep(4)
      setLoading(false)
    }, 2000)
  }

  // Calculate price
  const calculatePrice = (basePrice: string) => {
    const base = parseFloat(basePrice)
    const withMarkup = base * (1 + markup / 100)
    return currency === "EUR" ? withMarkup * EUR_RATE : withMarkup
  }

  // AI Content Generation
  const generateAIContent = async () => {
    if (!selectedArtwork || !selectedProduct) return

    // Get collection info if artwork belongs to a collection
    const artworkCollection = selectedArtwork.collection_id
      ? collections.find(c => c.id === selectedArtwork.collection_id)
      : null

    // Extract product type (e.g., "T-Shirt" instead of full technical name)
    const productType = selectedProduct.name?.split('|')[0]?.trim() || selectedProduct.name

    setGeneratingAI(true)
    try {
      const response = await fetch("/admin/ai/generate-content", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_context: {
            name: selectedArtwork.title, // Use artwork title as main focus
            artwork_title: selectedArtwork.title,
            artwork_description: selectedArtwork.description || '',
            artwork_tags: selectedArtwork.tags || [],
            collection_name: artworkCollection?.title || artworkCollection?.name || '',
            collection_description: artworkCollection?.description || '',
            collection_topic: artworkCollection?.topic || '',
            collection_purpose: artworkCollection?.purpose || '',
            brand_story: artworkCollection?.brand_story || '',
            genesis_story: artworkCollection?.genesis_story || '',
            design_philosophy: artworkCollection?.design_philosophy || '',
            core_values: artworkCollection?.core_values || [],
            visual_themes: artworkCollection?.visual_themes || [],
            lifestyle_concepts: artworkCollection?.lifestyle_concepts || [],
            target_audience_messaging: artworkCollection?.target_audience_messaging || '',
            brand_tagline: artworkCollection?.brand_tagline || '',
            product_type: productType,
            provider: provider,
            keywords: [
              selectedArtwork.title,
              artworkCollection?.title || artworkCollection?.name,
              productType,
              ...(selectedArtwork.tags || []),
              ...(artworkCollection?.core_values || []),
              ...(artworkCollection?.visual_themes || [])
            ].filter(Boolean)
          },
          generation_options: {
            variation_count: 3,
            tone: 'creative', // More engaging than 'professional'
            length: 'medium',
            include_seo: true,
            focus_keywords: [selectedArtwork.title, artworkCollection?.title].filter(Boolean)
          },
          output_format: 'json'
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please refresh the page and log in again.')
        }
        throw new Error(`Failed to generate AI content (${response.status})`)
      }

      const data = await response.json()
      console.log('AI Response:', data)
      setAiVariations(data.variations || [])
      setShowAIModal(true)
    } catch (error) {
      console.error('AI generation error:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate AI content. Please try again.')
    } finally {
      setGeneratingAI(false)
    }
  }

  const selectAIVariation = (variation: {title: string, description: string}) => {
    setTitle(variation.title)
    setDescription(variation.description)
    setShowAIModal(false)
    setAiVariations([])
  }

  // Create product
  const createProduct = async () => {
    // Validation with helpful error messages
    if (!selectedArtwork) {
      alert("Please select an artwork first (Step 1)")
      return
    }
    if (!selectedProduct) {
      alert("Please select a product first (Step 2)")
      return
    }
    if (!title.trim()) {
      alert("Please enter a product title")
      return
    }

    // Auto-select all variants if none are manually selected
    const variantsToUse = selectedSizes.length > 0
      ? selectedSizes
      : (selectedProduct.variants?.map((v: any) => v.id) || [])

    if (variantsToUse.length === 0) {
      alert("No variants available for this product")
      return
    }

    console.log('[CreateProduct] Starting product creation...', {
      artwork: selectedArtwork.title,
      product: selectedProduct.name,
      variants: variantsToUse.length,
      auto_selected: selectedSizes.length === 0,
      title,
      mockups: mockups.length
    })

    setCreating(true)
    try {
      console.log('[CreateProduct] Step 1: Creating composer session...')
      const sessionRes = await fetch("/admin/printful-studio/composer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artwork_id: selectedArtwork.id })
      })

      if (!sessionRes.ok) {
        throw new Error(`Failed to create session: ${sessionRes.status} ${sessionRes.statusText}`)
      }

      const session = await sessionRes.json()
      console.log('[CreateProduct] Session created:', session.session_id)

      const retailPrices: any = {}
      variantsToUse.forEach(id => {
        const variant = selectedProduct.variants.find((v: any) => v.id === id)
        const basePrice = variant?.retail_price || variant?.price || "20.00"
        retailPrices[String(id)] = parseFloat(basePrice) * (1 + markup / 100)
      })

      console.log('[CreateProduct] Step 2: Updating session with product details...', {
        product_id: selectedProduct.id,
        variants: variantsToUse.length,
        mockups: mockups.length,
        retail_prices: Object.keys(retailPrices).length
      })

      const updateRes = await fetch(`/admin/printful-studio/composer/${session.session_id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: {
            catalog_product_id: selectedProduct.id,
            catalog_product_name: selectedProduct.name,
            selected_variant_ids: variantsToUse.map(String)
          },
          design: {
            placement: placementGroups[0]?.placement || "default",
            technique: placementGroups[0]?.technique || "digital",
            mockup_style_ids: selectedMockupStyles.length > 0 ? selectedMockupStyles : undefined
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
            currency: "EUR"  // Changed from USD to match store frontend
          }
        })
      })

      if (!updateRes.ok) {
        const errorText = await updateRes.text()
        throw new Error(`Failed to update session: ${updateRes.status} - ${errorText}`)
      }

      console.log('[CreateProduct] Session updated successfully')
      console.log('[CreateProduct] Step 3: Creating final product in Medusa...')

      const createRes = await fetch(`/admin/printful-studio/composer/${session.session_id}/create-product`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_import_to_medusa: true,
          medusa_status: "draft"
        })
      })

      if (!createRes.ok) {
        const errorText = await createRes.text()
        throw new Error(`Failed to create product: ${createRes.status} - ${errorText}`)
      }

      const result = await createRes.json()
      console.log('[CreateProduct] API Response:', result)

      if (result.success) {
        console.log('[CreateProduct] ✅ Product created successfully!', result.product_id || result.medusa_product_id)
        setCreatedProduct(result)
        await loadRecentProducts()
        setStep(5)
      } else {
        console.error('[CreateProduct] ❌ Product creation failed:', result.errors)
        alert(`Error: ${result.errors?.join(", ") || "Unknown error"}`)
      }
    } catch (err) {
      console.error('[CreateProduct] ❌ Error:', err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      alert(`Failed to create product: ${errorMessage}`)
    } finally {
      setCreating(false)
      console.log('[CreateProduct] Finished (creating state reset)')
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

  return (
    <Container>
      <div className="max-w-7xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <Heading level="h1" className="text-3xl mb-2 text-white">Create POD Product</Heading>
            <p className="text-ui-fg-subtle">SenCommerce Product Studio • 5 Steps</p>
          </div>
          {step > 1 && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                if (confirm('Start over? This will clear all your current selections.')) {
                  setStep(1)
                  setSelectedArtwork(null)
                  setSelectedProduct(null)
                  setSelectedSizes([])
                  setSelectedMockupStyles([])
                  setSelectedCombinations(new Set())
                  setPlacementGroups([])
                  setMockups([])
                  setTitle("")
                  setDescription("")
                  setCreatedProduct(null)
                  setMockupGenerationStatus({
                    total: 0,
                    completed: 0,
                    completedUrls: [],
                    currentIndex: 0,
                    failed: 0,
                    mockupNames: [],
                    startTime: null,
                    elapsedSeconds: 0,
                    waitCountdown: 0,
                    mockupsByStyleVariant: {},
                    currentComboKey: null,
                    timelineEvents: []
                  })
                }
              }}
            >
              Start Over
            </Button>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${step > i ? "bg-black text-white" : step === i ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > i ? <Check size={20} /> : i}
              </div>
              {i < 5 && <div className={`w-12 h-1 ${step > i ? "bg-white" : "bg-gray-700"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8 min-h-[600px]">
          {/* Step 1 */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <Heading level="h2" className="text-gray-900 dark:text-white">Choose Your Design</Heading>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{artworks.length} artworks</div>
                </div>

                {/* Visual Collection Selector */}
                <div className="grid grid-cols-6 gap-3 mb-6">
                  <div
                    onClick={() => setSelectedCollection("all")}
                    className={`cursor-pointer border-2 rounded-lg p-2 text-center ${selectedCollection === "all" ? "border-black dark:border-white bg-gray-100 dark:bg-gray-800" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"}`}
                  >
                    <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 flex items-center justify-center text-gray-900 dark:text-white font-bold text-lg">ALL</div>
                    <div className="text-xs font-medium truncate text-gray-900 dark:text-white">All Artworks</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{allArtworks.length}</div>
                  </div>
                  <div
                    onClick={() => setSelectedCollection("uncategorized")}
                    className={`cursor-pointer border-2 rounded-lg p-2 text-center ${selectedCollection === "uncategorized" ? "border-black dark:border-white bg-gray-100 dark:bg-gray-800" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"}`}
                  >
                    <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 flex items-center justify-center text-gray-400 dark:text-gray-400 text-xl">?</div>
                    <div className="text-xs font-medium truncate text-gray-900 dark:text-white">Uncategorized</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{allArtworks.filter(a => !a.collection_id).length}</div>
                  </div>
                  {collections.map(col => {
                    const firstArtwork = allArtworks.find(a => a.collection_id === col.id)
                    const thumbnailUrl = col.thumbnail_url || (firstArtwork ? `/admin/artworks/${firstArtwork.id}/preview` : null)
                    return (
                      <div
                        key={col.id}
                        onClick={() => setSelectedCollection(col.id)}
                        className={`cursor-pointer border-2 rounded-lg p-2 text-center ${selectedCollection === col.id ? "border-black dark:border-white bg-gray-100 dark:bg-gray-800" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"}`}
                      >
                        {thumbnailUrl ? (
                          <img src={thumbnailUrl} className="w-full h-20 object-cover rounded mb-2" loading="lazy" />
                        ) : (
                          <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                        )}
                        <div className="text-xs font-medium truncate text-gray-900 dark:text-white" title={col.name}>{col.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{allArtworks.filter(a => a.collection_id === col.id).length}</div>
                      </div>
                    )
                  })}
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
                    className={`cursor-pointer border-2 rounded-lg p-3 ${selectedArtwork?.id === art.id ? "border-black dark:border-white bg-gray-50 dark:bg-gray-800" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"}`}
                  >
                    <img
                      src={`/admin/artworks/${art.id}/preview`}
                      className="w-full h-32 object-cover rounded mb-2"
                      loading="lazy"
                    />
                    <p className="text-sm font-medium truncate">{art.title}</p>
                  </div>
                ))}
              </div>
              {artworks.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <p>No artworks in this collection</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <Heading level="h2" className="text-white">Choose Provider & Product</Heading>
                <div className="flex gap-2">
                  <Button
                    variant={provider === 'printful-v2' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => setProvider('printful-v2')}
                  >
                    Printful V2 (37)
                  </Button>
                  <Button
                    variant={provider === 'printful-v1' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => setProvider('printful-v1')}
                  >
                    Printful V1 (200+)
                  </Button>
                  <Button
                    variant={provider === 'printify' ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => setProvider('printify')}
                  >
                    Printify
                  </Button>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="mb-6 flex gap-4 items-end">
                <div className="flex-1">
                  <Label className="text-white mb-2">Search</Label>
                  <Input
                    type="text"
                    placeholder="Search by name, brand, or model..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1) // Reset to first page when searching
                    }}
                    className="w-full"
                  />
                </div>
                {uniqueBrands.length > 0 && (
                  <div className="w-64">
                    <Label className="text-white mb-2">Brand</Label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => {
                        setSelectedBrand(e.target.value)
                        setCurrentPage(1) // Reset to first page when filtering
                      }}
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white"
                    >
                      <option value="all">All Brands ({allProducts.length})</option>
                      {uniqueBrands.map(brand => (
                        <option key={brand} value={brand}>
                          {brand} ({allProducts.filter(p => p.brand === brand).length})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="text-sm text-gray-400">
                  Showing {paginatedProducts.length} of {filteredProducts.length} products
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {products.map(prod => (
                      <div key={prod.id} onClick={() => selectProduct(prod)} className="cursor-pointer border rounded-lg p-4 hover:border-black dark:hover:border-white">
                        <img src={prod.thumbnail_url || prod.image} className="w-full h-48 object-cover rounded mb-3" loading="lazy" />
                        <p className="font-medium text-center">{prod.title || prod.name}</p>
                        {prod.brand && <p className="text-xs text-gray-500 text-center mt-1">{prod.brand}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between py-4 border-t border-gray-700">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <div className="text-sm text-gray-400">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3 - Unified Variant × Style Grid with Smart Selection */}
          {step === 3 && selectedProduct && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Heading level="h2" className="text-white">Select Mockups</Heading>
                <div className="text-xs text-gray-600">
                  {selectedCombinations.size} selected • ~{Math.ceil(selectedCombinations.size * 35 / 60)} min
                </div>
              </div>

              {/* Info panel */}
              <div className="mb-4 bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-300">
                <span className="font-medium text-white">Variant-specific mockups</span> - Select individual variant×style combinations • Each variant gets unique image
              </div>

              {/* Printful: Quick selection buttons */}
              <div className="mb-4 flex gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    // Select all variants with first style (first column - usually "Front")
                    if (compatibleStyles.length === 0) return
                    const firstStyle = compatibleStyles[0]
                    const newCombinations = new Set<string>()
                    selectedProduct.variants?.forEach((variant: any) => {
                      if (firstStyle.isUniversal || firstStyle.compatibleVariantIds?.includes(variant.id)) {
                        newCombinations.add(`${variant.id}-${firstStyle.id}`)
                      }
                    })
                    setSelectedCombinations(newCombinations)
                  }}
                >
                  All Variants × First Style
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    // Select first variant with all compatible styles (first row)
                    if (!selectedProduct.variants || selectedProduct.variants.length === 0) return
                    const firstVariant = selectedProduct.variants[0]
                    const newCombinations = new Set<string>()
                    compatibleStyles.forEach((style: any) => {
                      if (style.isUniversal || style.compatibleVariantIds?.includes(firstVariant.id)) {
                        newCombinations.add(`${firstVariant.id}-${style.id}`)
                      }
                    })
                    setSelectedCombinations(newCombinations)
                  }}
                >
                  First Variant × All Styles
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    // Select top 3 universal styles for all variants
                    const universalStyles = compatibleStyles.filter(s => s.isUniversal).slice(0, 3)
                    const newCombinations = new Set<string>()
                    selectedProduct.variants?.forEach((v: any) => {
                      universalStyles.forEach(style => {
                        newCombinations.add(`${v.id}-${style.id}`)
                      })
                    })
                    setSelectedCombinations(newCombinations)
                  }}
                >
                  All × Top 3
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setSelectedCombinations(new Set())}
                >
                  Clear
                </Button>
              </div>

              {/* Printful: Unified variant×style combination grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">
                    {selectedProduct.variants?.length || 0} Variants × {compatibleStyles.length} Styles
                    <span className="ml-2 text-[10px] text-gray-400">
                      (showing {compatibleStyles.reduce((sum, style) =>
                        sum + selectedProduct.variants.filter((v: any) =>
                          style.isUniversal || style.compatibleVariantIds?.includes(v.id)
                        ).length, 0
                      )} tiles)
                    </span>
                  </Label>
                </div>

                {/* Build all variant×style combination tiles */}
                <div className="grid grid-cols-8 gap-1 max-h-[70vh] overflow-y-auto pr-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {selectedProduct.variants?.flatMap((variant: any) =>
                    compatibleStyles
                      .filter((style: any) => {
                        // Only show tiles for compatible variant×style combinations
                        if (style.isUniversal) return true
                        return style.compatibleVariantIds?.includes(variant.id)
                      })
                      .map((style: any) => {
                        const comboKey = `${variant.id}-${style.id}`
                        const isSelected = selectedCombinations.has(comboKey)
                        const mockupUrl = mockupGenerationStatus.mockupsByStyleVariant[comboKey]

                        // Track currently generating combination
                        const isCurrentlyGenerating = loading && mockupGenerationStatus.currentComboKey === comboKey && !mockupUrl
                        const isDimmed = loading && !isSelected

                        // Build tile name
                        const variantName = variant.size || variant.name || `V${variant.id}`
                        const styleName = style.view_name || style.category_name || `S${style.id}`

                        // Calculate queue position
                        const allCombinations = Array.from(selectedCombinations).sort()
                        const queuePosition = allCombinations.indexOf(comboKey) + 1

                        return (
                          <div
                            key={comboKey}
                            onClick={() => {
                              if (loading) return
                              const newSet = new Set(selectedCombinations)
                              if (isSelected) {
                                newSet.delete(comboKey)
                              } else {
                                newSet.add(comboKey)
                              }
                              setSelectedCombinations(newSet)
                            }}
                            className={`relative border rounded p-1 transition-all cursor-pointer ${
                              isDimmed ? 'opacity-20 blur-[1px]' :
                              mockupUrl ? 'border-white bg-gray-900' :
                              isCurrentlyGenerating ? 'border-white bg-gray-900 animate-pulse' :
                              isSelected ? 'border-gray-500 bg-gray-900 hover:border-white' :
                              'border-gray-700 bg-gray-950 hover:border-gray-500'
                            }`}
                            title={`${variantName} - ${styleName}${style.isUniversal ? ' ★' : ''}`}
                          >
                            {/* Mockup image or state */}
                            {mockupUrl ? (
                              <div className="relative">
                                <img src={mockupUrl} className="w-full h-24 object-cover rounded" alt={`${variantName} - ${styleName}`} />
                                <div className="absolute top-0 right-0 bg-black rounded-bl p-0.5">
                                  <Check size={10} className="text-white" />
                                </div>
                              </div>
                            ) : isCurrentlyGenerating ? (
                              <div className="w-full h-24 bg-gray-800 rounded flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white" />
                              </div>
                            ) : isSelected && loading ? (
                              <div className="w-full h-24 bg-gray-800 rounded flex items-center justify-center">
                                <div className="text-[10px] font-mono text-gray-400">#{queuePosition}</div>
                              </div>
                            ) : style.thumbnail_url ? (
                              <img src={style.thumbnail_url} className="w-full h-24 object-cover rounded opacity-80" alt={styleName} />
                            ) : (
                              <div className="w-full h-24 bg-gray-800 rounded" />
                            )}

                            {/* Label with variant info */}
                            <div className="text-[9px] mt-0.5 truncate font-medium text-center text-gray-300">
                              {variantName} - {styleName.substring(0, 8)}{style.isUniversal ? '★' : ''}
                            </div>
                            {variant.color && (
                              <div className="text-[7px] text-center text-gray-500 truncate">{variant.color}</div>
                            )}
                          </div>
                        )
                      })
                  )}
                </div>

                {/* Progress bar */}
                {loading && (
                  <div className="mt-3 bg-gray-800 border border-gray-600 rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span className="text-xs font-bold text-white">{generatingProgress}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white">
                          {Math.floor(mockupGenerationStatus.elapsedSeconds / 60)}:{String(mockupGenerationStatus.elapsedSeconds % 60).padStart(2, '0')}
                        </span>
                        {mockupGenerationStatus.waitCountdown > 0 && (
                          <span className="ml-2 text-[10px] text-gray-400">Next: {mockupGenerationStatus.waitCountdown}s</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-black h-1 rounded-full transition-all"
                        style={{ width: `${(mockupGenerationStatus.completed / mockupGenerationStatus.total) * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-300 mt-1">
                      {mockupGenerationStatus.completed} / {mockupGenerationStatus.total} completed • {mockupGenerationStatus.failed} skipped
                    </div>

                    {/* Timeline Infographic - Thin bars showing progress */}
                    {mockupGenerationStatus.timelineEvents.length > 0 && (
                      <div className="mt-2">
                        {(() => {
                          const startTime = mockupGenerationStatus.startTime || Date.now()
                          const currentTime = Date.now()
                          const totalDuration = Math.max(currentTime - startTime, 1000) // Avoid division by zero
                          const events = mockupGenerationStatus.timelineEvents

                          // Build segments from events
                          const requestSegments: Array<{ startMs: number, durationMs: number, index: number }> = []
                          const waitSegments: Array<{ startMs: number, durationMs: number, index: number }> = []

                          for (let i = 0; i < events.length; i++) {
                            const event = events[i]
                            if (event.type === 'request_start') {
                              const endEvent = events.find((e, idx) => idx > i && e.type === 'request_end' && e.index === event.index)
                              if (endEvent) {
                                requestSegments.push({
                                  startMs: event.timestamp - startTime,
                                  durationMs: endEvent.timestamp - event.timestamp,
                                  index: event.index
                                })
                              }
                            } else if (event.type === 'wait_start') {
                              const endEvent = events.find((e, idx) => idx > i && e.type === 'wait_end' && e.index === event.index)
                              if (endEvent) {
                                waitSegments.push({
                                  startMs: event.timestamp - startTime,
                                  durationMs: endEvent.timestamp - event.timestamp,
                                  index: event.index
                                })
                              }
                            }
                          }

                          return (
                            <>
                              {/* Request bar - thin rounded bar showing generation progress */}
                              <div className="relative w-full bg-gray-200 rounded-full h-1.5 mb-1">
                                {requestSegments.map((seg, idx) => {
                                  const leftPercent = (seg.startMs / totalDuration) * 100
                                  const widthPercent = (seg.durationMs / totalDuration) * 100
                                  const durationSec = Math.round(seg.durationMs / 1000)

                                  return (
                                    <div
                                      key={`req-${idx}`}
                                      className="absolute top-0 h-full bg-black rounded-full"
                                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                                      title={`Request ${seg.index + 1}: ${durationSec}s`}
                                    />
                                  )
                                })}
                              </div>

                              {/* Wait bar - thin rounded bar showing pause progress */}
                              <div className="relative w-full bg-gray-100 rounded-full h-1.5">
                                {waitSegments.map((seg, idx) => {
                                  const leftPercent = (seg.startMs / totalDuration) * 100
                                  const widthPercent = (seg.durationMs / totalDuration) * 100
                                  const durationSec = Math.round(seg.durationMs / 1000)

                                  return (
                                    <div
                                      key={`wait-${idx}`}
                                      className="absolute top-0 h-full bg-orange-400 rounded-full"
                                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                                      title={`Wait: ${durationSec}s`}
                                    />
                                  )
                                })}
                              </div>

                              {/* Legend */}
                              <div className="flex items-center gap-3 mt-1.5 text-[9px] text-gray-600">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                  <span className="text-white">Generation</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <span className="text-white">Rate limit pause</span>
                                </div>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Generate mockups button and Skip option */}
                {!loading && (
                  <div className="flex gap-3 mt-4">
                    <Button
                      className="flex-1"
                      disabled={selectedCombinations.size === 0}
                      onClick={async () => {
                        // Build combinations array directly from selectedCombinations Set
                        const combinations: Array<{ variantId: number, styleId: number | null }> = []

                        selectedCombinations.forEach(comboKey => {
                          const [variantId, styleId] = comboKey.split('-').map(Number)
                          combinations.push({ variantId, styleId })
                        })

                        if (combinations.length === 0) {
                          console.log('[Studio] No combinations selected')
                          return
                        }

                        console.log('[Studio] Generating variant-specific mockups:', combinations.length, 'combinations')

                        // Call generatePreview with the combinations
                        await generatePreview(combinations)
                      }}
                    >
                      Generate {selectedCombinations.size} Mockup{selectedCombinations.size !== 1 ? 's' : ''} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={selectedCombinations.size === 0}
                      onClick={() => {
                        // Skip mockup generation - use artwork image as fallback
                        if (selectedArtwork?.image_url) {
                          setMockups([selectedArtwork.image_url])
                        }
                        // Auto-fill product name and description
                        if (!title) {
                          setTitle(`${selectedArtwork?.title || 'Artwork'} - ${selectedProduct?.name?.split('|')[0]?.trim() || 'Product'}`)
                        }
                        if (!description) {
                          setDescription(`Custom ${selectedProduct?.name?.split('|')[0]?.trim() || 'product'} featuring ${selectedArtwork?.title || 'unique artwork'}. High-quality print-on-demand item with selected variants.`)
                        }
                        setStep(4)
                      }}
                    >
                      Skip <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div>
              <Heading level="h2" className="mb-6 text-white">Product Details</Heading>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <Label>Product Name</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center justify-between">
                      <span>Description</span>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={generateAIContent}
                        disabled={generatingAI}
                      >
                        {generatingAI ? (
                          <><Loader2 className="w-3 h-3 animate-spin mr-1" />Generating...</>
                        ) : (
                          <><Sparkles className="w-3 h-3 mr-1" />AI Generate</>
                        )}
                      </Button>
                    </Label>
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
                    {(() => {
                      // Calculate example based on first selected variant's actual price
                      const firstVariant = selectedProduct.variants?.find((v: any) => selectedSizes.includes(v.id))
                      const exampleCost = firstVariant ? parseFloat(firstVariant.retail_price || firstVariant.price || "20.00") : 20
                      const exampleProfit = exampleCost * (markup / 100)
                      const exampleRetail = exampleCost * (1 + markup / 100)
                      const finalExampleCost = currency === "EUR" ? exampleCost * EUR_RATE : exampleCost
                      const finalExampleProfit = currency === "EUR" ? exampleProfit * EUR_RATE : exampleProfit
                      const finalExampleRetail = currency === "EUR" ? exampleRetail * EUR_RATE : exampleRetail
                      const currencySymbol = currency === "EUR" ? "€" : "$"

                      return (
                        <>
                          <Label>
                            Markup ({markup}%) - Your Profit: +{currencySymbol}{finalExampleProfit.toFixed(2)} per item
                          </Label>
                          <Input type="number" value={markup} onChange={e => setMarkup(Number(e.target.value))} />
                          <p className="text-xs text-gray-400 mt-1">
                            {currencySymbol}{finalExampleCost.toFixed(2)} Printful cost + {markup}% = {currencySymbol}{finalExampleRetail.toFixed(2)} retail price (you earn {currencySymbol}{finalExampleProfit.toFixed(2)} profit per sale)
                          </p>
                        </>
                      )
                    })()}
                  </div>
                  <div className="border-t pt-4">
                    <Label className="mb-3 block text-base font-semibold">Pricing Breakdown:</Label>
                    <div className="space-y-3">
                      {selectedProduct.variants?.filter((v: any) => selectedSizes.includes(v.id)).map((v: any) => {
                        const basePriceNum = parseFloat(v.retail_price || v.price || "20.00")
                        const markupAmount = basePriceNum * (markup / 100)
                        const retailPrice = basePriceNum * (1 + markup / 100)
                        const finalRetailPrice = currency === "EUR" ? retailPrice * EUR_RATE : retailPrice
                        const finalBaseCost = currency === "EUR" ? basePriceNum * EUR_RATE : basePriceNum
                        const finalProfit = currency === "EUR" ? markupAmount * EUR_RATE : markupAmount
                        const currencySymbol = currency === "EUR" ? "€" : "$"

                        return (
                          <div key={v.id} className="bg-gray-800/50 rounded-lg p-3 space-y-1">
                            <div className="font-medium text-white mb-2">{v.size || v.name}</div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Printful Cost:</span>
                              <span className="text-gray-300">{currencySymbol}{finalBaseCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">+ Your Markup ({markup}%):</span>
                              <span className="text-green-400">+{currencySymbol}{finalProfit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-700">
                              <span className="text-white">Retail Price:</span>
                              <span className="text-white">{currencySymbol}{finalRetailPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs pt-1">
                              <span className="text-gray-400">Your Profit per Item:</span>
                              <span className="text-green-400 font-medium">{currencySymbol}{finalProfit.toFixed(2)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
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
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-12 h-12 text-black" />
                </div>
                <Heading level="h2" className="mb-4 text-white">Success!</Heading>
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
                          <p className="font-medium text-sm text-white">{prod.title}</p>
                          <p className="text-xs text-gray-400">{prod.variants?.length || 0} variants</p>
                        </div>
                        <Button variant="secondary" size="small" onClick={() => window.open(`/app/products/${prod.id}`, '_blank')}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Actions */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <Button onClick={() => {
                  setStep(2)
                  setSelectedProduct(null)
                  setSelectedSizes([])
                  setSelectedMockupStyles([])
                  setSelectedCombinations(new Set())
                  setMockups([])
                  setTitle("")
                  setDescription("")
                  loadProducts()
                }}>
                  <Sparkles className="w-4 h-4 mr-2" />Create Another with Same Art
                </Button>
                <Button onClick={reset}>
                  <Sparkles className="w-4 h-4 mr-2" />Start New Design
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" onClick={() => createdProduct?.medusa_product_id && window.open(`/app/products/${createdProduct.medusa_product_id}`, '_blank')}>
                  <Edit className="w-4 h-4 mr-2" />Edit in Medusa
                </Button>
                <Button variant="secondary" onClick={() => {
                  const url = window.location.hostname === 'localhost' ? `http://localhost:3000` : `https://shop.sen.studio`
                  window.open(url, '_blank')
                }}>
                  <ExternalLink className="w-4 h-4 mr-2" />Preview in Shop
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Content Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAIModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <Heading level="h3">AI Generated Content</Heading>
              <Button variant="secondary" size="small" onClick={() => setShowAIModal(false)}>Close</Button>
            </div>
            <p className="text-sm text-gray-600 mb-6">Select a variation to use for your product</p>
            <div className="space-y-4">
              {aiVariations.map((variation, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:border-black transition-colors" onClick={() => selectAIVariation(variation)}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-lg">{variation.title}</h4>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Option {idx + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{variation.description}</p>

                  {/* SEO Details */}
                  {(variation.keywords || variation.meta_description || variation.url_slug) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">SEO Details</p>
                      {variation.meta_description && (
                        <div>
                          <span className="text-xs font-medium text-gray-600">Meta Description: </span>
                          <span className="text-xs text-gray-500">{variation.meta_description}</span>
                        </div>
                      )}
                      {variation.keywords && variation.keywords.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-600">Keywords: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {variation.keywords.map((keyword: string, kidx: number) => (
                              <span key={kidx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {variation.url_slug && (
                        <div>
                          <span className="text-xs font-medium text-gray-600">URL Slug: </span>
                          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{variation.url_slug}</code>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Button size="small" onClick={(e) => { e.stopPropagation(); selectAIVariation(variation); }}>
                      Use This
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={generateAIContent} disabled={generatingAI}>
                {generatingAI ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate More</>}
              </Button>
              <Button variant="secondary" onClick={() => setShowAIModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "03 POD Studio"
})

export default PrintfulStudioComplete
