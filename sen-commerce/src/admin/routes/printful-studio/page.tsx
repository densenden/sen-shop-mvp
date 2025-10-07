import { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Table, Tabs, Input, Textarea, Select } from "@medusajs/ui"
import {
  Activity,
  AlertCircle,
  BookOpen,
  GitBranch,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react"

// ===== Types =====

type StudioVersion = "v1" | "v2"
type StudioSection = "dashboard" | "artworks" | "catalog" | "composer" | "products" | "batch" | "settings"

interface StudioArtwork {
  id: string
  title: string
  description?: string | null
  image_url?: string | null
  collection_id?: string | null
  linked_products: any[]
}

interface StudioCatalogProduct {
  id: string
  version: StudioVersion
  name: string
  description?: string | null
  thumbnail_url?: string | null
  variant_count: number
  variants: any[]
}

interface StudioDashboard {
  version: StudioVersion
  metrics: {
    total_products: number
    linked_products: number
    total_variants: number
    artworks: number
    artworks_without_products: number
  }
  capabilities: string[]
  health: {
    status: "ok" | "warning" | "error"
    message?: string
  }
}

type ComposerState =
  | 'artwork_selection'
  | 'product_selection'
  | 'design_configuration'
  | 'mockup_generation'
  | 'details_entry'
  | 'pricing_setup'
  | 'ready_to_create'

interface ComposerSession {
  session_id: string
  state: ComposerState
  artwork: {
    artwork_id?: string | null
    artwork_url?: string | null
    artwork_title?: string | null
    printful_file_id?: string | null
  }
  product: {
    catalog_product_id: string
    catalog_product_name: string
    selected_variant_ids: string[]
  } | null
  design: {
    placement: string
    technique: string
    available_placements?: Array<{id: string, placement: string}>
    available_techniques?: Array<{id: string, technique: string}>
  } | null
  mockups: {
    mockup_urls: string[]
    mockup_status?: 'pending' | 'generating' | 'completed' | 'failed'
    mockup_progress?: string
    selected_variant_ids_for_mockups?: string[] // Which variants to generate mockups for
  } | null
  details: {
    product_title: string
    product_description?: string | null
  } | null
  pricing: {
    markup_type: 'fixed' | 'percentage'
    markup_value: number
    retail_prices: Record<string, number>
    currency: string
  } | null
}

// ===== Components =====

const PrintfulStudioPage = () => {
  const [activeVersion, setActiveVersion] = useState<StudioVersion>("v2")
  const [activeSection, setActiveSection] = useState<StudioSection>("dashboard")

  // Data states
  const [dashboard, setDashboard] = useState<StudioDashboard | null>(null)
  const [artworks, setArtworks] = useState<StudioArtwork[]>([])
  const [catalog, setCatalog] = useState<StudioCatalogProduct[]>([])
  const [composerSession, setComposerSession] = useState<ComposerSession | null>(null)

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedArtworks, setSelectedArtworks] = useState<Set<string>>(new Set())
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  // Fetch dashboard
  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/admin/printful-studio/${activeVersion}/dashboard`, {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setDashboard(data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch artworks
  const fetchArtworks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/admin/printful-studio/${activeVersion}/artworks`, {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setArtworks(data.artworks || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch catalog
  const fetchCatalog = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/admin/printful-studio/${activeVersion}/catalog`, {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setCatalog(data.catalog || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Create composer session
  const createComposerSession = async (artworkId?: string) => {
    try {
      const res = await fetch(`/admin/printful-studio/composer`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artwork_id: artworkId })
      })
      if (res.ok) {
        const session = await res.json()
        setComposerSession(session)
        setActiveSection("composer")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Update composer session
  const updateComposerSession = async (updates: Partial<ComposerSession>) => {
    if (!composerSession) return

    try {
      const res = await fetch(`/admin/printful-studio/composer/${composerSession.session_id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        const updated = await res.json()
        setComposerSession(updated)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Create product from composer
  const createProductFromComposer = async () => {
    if (!composerSession) return

    setLoading(true)
    try {
      const res = await fetch(`/admin/printful-studio/composer/${composerSession.session_id}/create-product`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_import_to_medusa: true,
          medusa_status: "draft"
        })
      })
      if (res.ok) {
        const result = await res.json()
        alert(`Product created! Printful ID: ${result.printful_product_id}${result.medusa_product_id ? `, Medusa ID: ${result.medusa_product_id}` : ''}`)
        setComposerSession(null)
        setActiveSection("dashboard")
        fetchDashboard()
      } else {
        const error = await res.json()
        alert(`Failed to create product: ${error.message || error.errors?.join(', ')}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Batch create products
  const batchCreateProducts = async () => {
    if (selectedArtworks.size === 0 || selectedProducts.size === 0) {
      alert("Please select at least one artwork and one product")
      return
    }

    if (!confirm(`Create ${selectedArtworks.size * selectedProducts.size} products?`)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/admin/printful-studio/batch/create-products`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artwork_ids: Array.from(selectedArtworks),
          catalog_product_ids: Array.from(selectedProducts),
          auto_import_to_medusa: true,
          pricing_config: {
            markup_type: "percentage",
            markup_value: 50
          }
        })
      })
      if (res.ok) {
        const result = await res.json()
        alert(`Batch complete! Created: ${result.created}, Failed: ${result.failed}`)
        setSelectedArtworks(new Set())
        setSelectedProducts(new Set())
        fetchDashboard()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeSection === "dashboard") fetchDashboard()
    if (activeSection === "artworks") fetchArtworks()
    if (activeSection === "catalog") fetchCatalog()
  }, [activeSection, activeVersion])

  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Heading level="h1">Printful Studio</Heading>
        <p className="text-sm text-ui-fg-subtle">
          Artwork-first POD product creation. Upload artwork → Select products → Generate mockups → Create & import.
        </p>
      </div>

      {/* Version Selector */}
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-base p-4">
        <Tabs value={activeVersion} onValueChange={(v) => setActiveVersion(v as StudioVersion)}>
          <Tabs.List className="grid w-full grid-cols-2">
            <Tabs.Trigger value="v2">Printful v2 (Catalog)</Tabs.Trigger>
            <Tabs.Trigger value="v1">Printful v1 (Store)</Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "dashboard", label: "Dashboard", icon: <Activity className="w-4 h-4" /> },
          { key: "artworks", label: "Artworks", icon: <GitBranch className="w-4 h-4" /> },
          { key: "catalog", label: "Catalog", icon: <Layers className="w-4 h-4" /> },
          { key: "composer", label: "Composer", icon: <Wand2 className="w-4 h-4" /> },
          { key: "batch", label: "Batch Create", icon: <Sparkles className="w-4 h-4" /> },
          { key: "settings", label: "Settings", icon: <SettingsIcon className="w-4 h-4" /> },
        ].map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key as StudioSection)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              activeSection === section.key
                ? "border-blue-600 bg-ui-bg-highlight text-blue-700"
                : "border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-base text-ui-fg-subtle hover:border-ui-border-interactive"
            }`}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">×</button>
        </div>
      )}

      {/* Content Sections */}
      {activeSection === "dashboard" && dashboard && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Artworks" value={dashboard.metrics.artworks} />
            <MetricCard label="Catalog Products" value={dashboard.metrics.total_products} />
            <MetricCard label="Linked Products" value={dashboard.metrics.linked_products} />
            <MetricCard label="Unlinked Artworks" value={dashboard.metrics.artworks_without_products} />
          </div>
          <div className="rounded-lg border border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-base p-6">
            <Heading level="h3">Quick Start</Heading>
            <div className="mt-4 space-y-2 text-sm">
              <p>1. Upload artwork in the <strong>Artworks</strong> section</p>
              <p>2. Browse products in the <strong>Catalog</strong> section</p>
              <p>3. Use <strong>Composer</strong> to create individual products</p>
              <p>4. Use <strong>Batch Create</strong> to create many products at once</p>
            </div>
          </div>
        </div>
      )}

      {activeSection === "artworks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Heading level="h2">Artworks</Heading>
            <div className="flex gap-2">
              {selectedArtworks.size > 0 && (
                <Badge>{selectedArtworks.size} selected</Badge>
              )}
              <Button size="small" variant="primary" onClick={fetchArtworks}>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {artworks.map((artwork) => (
              <div
                key={artwork.id}
                className={`rounded-lg border p-4 cursor-pointer transition ${
                  selectedArtworks.has(artwork.id)
                    ? "border-blue-500 bg-ui-bg-highlight"
                    : "border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-base hover:border-ui-border-interactive"
                }`}
                onClick={() => {
                  const newSelected = new Set(selectedArtworks)
                  if (newSelected.has(artwork.id)) {
                    newSelected.delete(artwork.id)
                  } else {
                    newSelected.add(artwork.id)
                  }
                  setSelectedArtworks(newSelected)
                }}
              >
                {artwork.image_url ? (
                  <img src={artwork.image_url} alt={artwork.title} className="w-full h-40 object-cover rounded" />
                ) : (
                  <div className="w-full h-40 bg-ui-bg-subtle flex items-center justify-center rounded">No Image</div>
                )}
                <div className="mt-3">
                  <p className="font-semibold text-sm">{artwork.title}</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        createComposerSession(artwork.id)
                      }}
                    >
                      Create Product
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "catalog" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Heading level="h2">Catalog Products</Heading>
            <div className="flex gap-2">
              {selectedProducts.size > 0 && (
                <Badge>{selectedProducts.size} selected</Badge>
              )}
              <Button size="small" variant="primary" onClick={fetchCatalog}>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {catalog.map((product) => (
              <div
                key={product.id}
                className={`rounded-lg border p-4 cursor-pointer transition ${
                  selectedProducts.has(product.id)
                    ? "border-blue-500 bg-ui-bg-highlight"
                    : "border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-base hover:border-ui-border-interactive"
                }`}
                onClick={() => {
                  const newSelected = new Set(selectedProducts)
                  if (newSelected.has(product.id)) {
                    newSelected.delete(product.id)
                  } else {
                    newSelected.add(product.id)
                  }
                  setSelectedProducts(newSelected)
                }}
              >
                {product.thumbnail_url ? (
                  <img src={product.thumbnail_url} alt={product.name} className="w-full h-40 object-cover rounded" />
                ) : (
                  <div className="w-full h-40 bg-ui-bg-subtle flex items-center justify-center rounded">No Image</div>
                )}
                <div className="mt-3">
                  <p className="font-semibold text-sm">{product.name}</p>
                  <p className="text-xs text-ui-fg-muted mt-1">{product.variant_count} variants</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "composer" && !composerSession && (
        <div className="rounded-lg border border-dashed border-ui-border-strong p-12 text-center">
          <Wand2 className="w-12 h-12 mx-auto text-ui-fg-disabled mb-4" />
          <Heading level="h3">No Active Composer Session</Heading>
          <p className="text-sm text-ui-fg-subtle mt-2 mb-4">
            Start by selecting an artwork or create a blank session
          </p>
          <Button onClick={() => createComposerSession()}>
            <Plus className="w-4 h-4" />
            New Composer Session
          </Button>
        </div>
      )}

      {activeSection === "composer" && composerSession && (
        <ComposerUI
          session={composerSession}
          onUpdate={updateComposerSession}
          onCreate={createProductFromComposer}
          loading={loading}
        />
      )}

      {activeSection === "batch" && (
        <div className="space-y-6">
          <Heading level="h2">Batch Product Creation</Heading>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-base p-6">
              <Heading level="h3">Selected Artworks: {selectedArtworks.size}</Heading>
              <p className="text-sm text-ui-fg-subtle mt-2">
                Go to Artworks tab and select artworks to include in batch
              </p>
            </div>
            <div className="rounded-lg border border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-base p-6">
              <Heading level="h3">Selected Products: {selectedProducts.size}</Heading>
              <p className="text-sm text-ui-fg-subtle mt-2">
                Go to Catalog tab and select products to include in batch
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-ui-border-interactive bg-ui-bg-highlight p-6">
            <Heading level="h3">Batch Summary</Heading>
            <p className="text-sm mt-2">
              This will create <strong>{selectedArtworks.size * selectedProducts.size}</strong> products
            </p>
            <p className="text-xs text-ui-fg-subtle mt-1">
              ({selectedArtworks.size} artworks × {selectedProducts.size} products)
            </p>
            <Button
              className="mt-4"
              variant="primary"
              disabled={selectedArtworks.size === 0 || selectedProducts.size === 0 || loading}
              onClick={batchCreateProducts}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Create All Products
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}

// Helper Components

const MetricCard = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-lg border border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-base p-4">
    <p className="text-xs uppercase tracking-wide text-ui-fg-muted">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-ui-fg-base">{value}</p>
  </div>
)

const ComposerUI = ({
  session,
  onUpdate,
  onCreate,
  loading
}: {
  session: ComposerSession
  onUpdate: (updates: Partial<ComposerSession>) => void
  onCreate: () => void
  loading: boolean
}) => {
  const [activeTab, setActiveTab] = useState(0)
  const [catalogProducts, setCatalogProducts] = useState<StudioCatalogProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<StudioCatalogProduct | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [generatingMockups, setGeneratingMockups] = useState(false)

  const tabs = [
    "Artwork",
    "Product",
    "Design",
    "Mockups",
    "Details",
    "Pricing"
  ]

  // Fetch catalog when Product tab is opened
  useEffect(() => {
    if (activeTab === 1 && catalogProducts.length === 0) {
      fetchCatalog()
    }
  }, [activeTab])

  const fetchCatalog = async () => {
    setLoadingCatalog(true)
    try {
      const res = await fetch(`/admin/printful-studio/v2/catalog`, {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setCatalogProducts(data.catalog || [])
      }
    } catch (err) {
      console.error('Failed to fetch catalog:', err)
    } finally {
      setLoadingCatalog(false)
    }
  }

  const selectProduct = async (product: StudioCatalogProduct) => {
    setLoadingCatalog(true)
    try {
      // Fetch full product details including variants, placements, and techniques
      const res = await fetch(`/admin/printful-studio/v2/catalog/${product.id}`, {
        credentials: "include"
      })

      if (!res.ok) {
        throw new Error('Failed to fetch product details')
      }

      const data = await res.json()
      const fullProduct = data.product

      // Update selected product with full details
      const productWithVariants = {
        ...product,
        variants: fullProduct.variants || [],
        placements: fullProduct.placements || [],
        techniques: fullProduct.techniques || []
      }
      setSelectedProduct(productWithVariants as any)

      // Auto-select all variants by default
      const variantIds = (fullProduct.variants || []).map((v: any) => v.id)

      // Calculate retail prices for each variant (base price + 50% markup)
      const retailPrices: Record<string, number> = {}
      ;(fullProduct.variants || []).forEach((variant: any) => {
        const basePrice = variant.price || 20 // Default $20 if no price
        retailPrices[variant.id] = basePrice * 1.5 // 50% markup
      })

      // Extract available placements and techniques
      const availablePlacements = fullProduct.placements || []
      const availableTechniques = fullProduct.techniques || []

      // Select first available placement and technique
      const defaultPlacement = availablePlacements.length > 0
        ? (availablePlacements[0].placement || availablePlacements[0].id || availablePlacements[0])
        : 'front'
      const defaultTechnique = availableTechniques.length > 0
        ? (availableTechniques[0].id || availableTechniques[0].technique || availableTechniques[0])
        : 'DTG'

      console.log('[Product Selection] Loaded product details:', {
        product_id: product.id,
        variant_count: variantIds.length,
        placements: availablePlacements,
        techniques: availableTechniques,
        selected_placement: defaultPlacement,
        selected_technique: defaultTechnique
      })

      onUpdate({
        product: {
          catalog_product_id: product.id,
          catalog_product_name: product.name,
          selected_variant_ids: variantIds
        },
        details: {
          product_title: session.details?.product_title || `${session.artwork.artwork_title || 'Design'} - ${product.name}`,
          product_description: session.details?.product_description || product.description
        },
        design: {
          placement: defaultPlacement,
          technique: defaultTechnique,
          available_placements: availablePlacements,
          available_techniques: availableTechniques
        },
        pricing: {
          markup_type: 'percentage',
          markup_value: 50,
          retail_prices: retailPrices,
          currency: 'USD'
        }
      })
    } catch (error) {
      console.error('Failed to load product details:', error)
      alert('Failed to load product details. Please try again.')
    } finally {
      setLoadingCatalog(false)
    }
  }

  const generateMockups = async () => {
    if (!session.product || !session.artwork.artwork_url) {
      alert('Need product and artwork to generate mockups')
      return
    }

    setGeneratingMockups(true)
    try {
      // For now, create preview mockups using the catalog product images with artwork overlay
      // Real Printful mockup generation requires proper variant IDs and can be slow

      const mockupUrls: string[] = []

      // Add artwork itself
      mockupUrls.push(session.artwork.artwork_url)

      // Add product thumbnail if available
      if (selectedProduct?.thumbnail_url) {
        mockupUrls.push(selectedProduct.thumbnail_url)
      }

      // Add variant images (up to 5 total mockups)
      if (selectedProduct?.variants) {
        selectedProduct.variants
          .filter(v => v.image)
          .slice(0, 5 - mockupUrls.length)
          .forEach(v => {
            if (v.image) mockupUrls.push(v.image)
          })
      }

      // If still not enough, duplicate artwork
      while (mockupUrls.length < 3) {
        mockupUrls.push(session.artwork.artwork_url)
      }

      // Show placeholder mockups first
      onUpdate({
        mockups: {
          mockup_urls: mockupUrls,
          mockup_status: 'generating',
          mockup_progress: `Generating mockups for ${session.product.selected_variant_ids.length} variants...`
        }
      })

      // Start real API call with incremental progress tracking
      const variantCount = session.product.selected_variant_ids.length
      const estimatedTime = Math.ceil(variantCount * 30 / 60) // ~30s per variant in minutes

      onUpdate({
        mockups: {
          mockup_urls: mockupUrls,
          mockup_status: 'generating',
          mockup_progress: `⏳ Generating ${variantCount} mockups (est. ${estimatedTime} min due to rate limits)...`
        }
      })

      // Use selected variants for mockup generation (not all product variants)
      const variantsForMockups = session.mockups?.selected_variant_ids_for_mockups || session.product.selected_variant_ids

      fetch(`/admin/printful-studio/v2/catalog/${session.product.catalog_product_id}/mockups`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artwork_url: session.artwork.artwork_url,
          artwork_id: session.artwork.artwork_id,
          variant_ids: variantsForMockups,
          wait_for_completion: true
        })
      }).then(res => {
        if (res.ok) {
          return res.json()
        }
        throw new Error(`Mockup generation failed: ${res.status}`)
      }).then(data => {
        if (data?.mockup_urls && data.mockup_urls.length > 0) {
          // Update with all completed mockups at once
          onUpdate({
            mockups: {
              mockup_urls: data.mockup_urls,
              mockup_status: 'completed',
              mockup_progress: `✅ Generated ${data.mockup_urls.length} mockups successfully!`
            }
          })
        } else {
          onUpdate({
            mockups: {
              mockup_urls: mockupUrls,
              mockup_status: 'completed',
              mockup_progress: 'Using placeholder mockups'
            }
          })
        }
      }).catch(err => {
        console.log('Mockup generation failed:', err)
        onUpdate({
          mockups: {
            mockup_urls: mockupUrls,
            mockup_status: 'failed',
            mockup_progress: `⚠️ Mockup generation failed: ${err.message}`
          }
        })
      })

    } catch (err) {
      console.error('Failed to generate mockups:', err)
      // Fallback to artwork image
      onUpdate({
        mockups: {
          mockup_urls: [session.artwork.artwork_url],
          selected_mockup_urls: [session.artwork.artwork_url],
          mockup_status: 'completed'
        }
      })
    } finally {
      setGeneratingMockups(false)
    }
  }

  const isStepComplete = (step: number): boolean => {
    if (step === 0) return Boolean(session.artwork.artwork_id || session.artwork.artwork_url)
    if (step === 1) return Boolean(session.product)
    if (step === 2) return Boolean(session.design)
    if (step === 3) return Boolean(session.mockups && session.mockups.mockup_urls.length > 0)
    if (step === 4) return Boolean(session.details && session.details.product_title)
    if (step === 5) return Boolean(session.pricing)
    return false
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading level="h2">Product Composer</Heading>
        <Badge>State: {session.state}</Badge>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition ${
              activeTab === idx
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"
            }`}
          >
            {isStepComplete(idx) && <span className="mr-2">✓</span>}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-base p-6 min-h-[400px]">
        {activeTab === 0 && (
          <div className="space-y-4">
            <Heading level="h3">Artwork</Heading>
            {session.artwork.artwork_url ? (
              <img
                src={session.artwork.artwork_url}
                alt={session.artwork.artwork_title || "Artwork"}
                className="w-64 h-64 object-cover rounded"
              />
            ) : (
              <p className="text-ui-fg-muted">No artwork selected</p>
            )}
            <p className="text-sm font-medium">{session.artwork.artwork_title}</p>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4">
            <Heading level="h3">Product Selection</Heading>

            {session.product ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-ui-tag-green-border bg-ui-tag-green-bg p-4">
                  <div className="flex items-start gap-4">
                    {selectedProduct?.thumbnail_url && (
                      <img
                        src={selectedProduct.thumbnail_url}
                        alt={session.product.catalog_product_name}
                        className="w-32 h-32 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{session.product.catalog_product_name}</p>
                      <p className="text-sm text-ui-fg-subtle mt-1">
                        {session.product.selected_variant_ids.length} of {selectedProduct?.variants?.length || 0} variants selected
                      </p>
                      <Button
                        size="small"
                        variant="secondary"
                        className="mt-3"
                        onClick={() => {
                          setSelectedProduct(null)
                          onUpdate({ product: null })
                        }}
                      >
                        Change Product
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Variant Selection */}
                {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="rounded-lg border border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-base p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Heading level="h4">Select Variants</Heading>
                      <div className="flex gap-2">
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => {
                            const allIds = selectedProduct.variants.map(v => v.id)
                            const retailPrices: Record<string, number> = {}
                            selectedProduct.variants.forEach(variant => {
                              const basePrice = variant.price || 20
                              retailPrices[variant.id] = basePrice * 1.5
                            })
                            onUpdate({
                              product: {
                                ...session.product!,
                                selected_variant_ids: allIds
                              },
                              pricing: {
                                ...session.pricing!,
                                retail_prices: retailPrices
                              }
                            })
                          }}
                        >
                          Select All
                        </Button>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => {
                            onUpdate({
                              product: {
                                ...session.product!,
                                selected_variant_ids: []
                              }
                            })
                          }}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {selectedProduct.variants.map((variant) => {
                        const isSelected = session.product!.selected_variant_ids.includes(variant.id)
                        const basePrice = variant.price || 20
                        const retailPrice = session.pricing?.retail_prices?.[variant.id] || (basePrice * 1.5)

                        return (
                          <label
                            key={variant.id}
                            className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition ${
                              isSelected
                                ? 'border-blue-500 bg-ui-bg-highlight'
                                : 'border-ui-border-base hover:border-ui-border-strong'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                let newVariantIds: string[]
                                let newRetailPrices = { ...session.pricing?.retail_prices || {} }

                                if (e.target.checked) {
                                  newVariantIds = [...session.product!.selected_variant_ids, variant.id]
                                  newRetailPrices[variant.id] = basePrice * 1.5
                                } else {
                                  newVariantIds = session.product!.selected_variant_ids.filter(id => id !== variant.id)
                                  delete newRetailPrices[variant.id]
                                }

                                onUpdate({
                                  product: {
                                    ...session.product!,
                                    selected_variant_ids: newVariantIds
                                  },
                                  pricing: {
                                    ...session.pricing!,
                                    retail_prices: newRetailPrices
                                  }
                                })
                              }}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{variant.name}</div>
                              <div className="text-xs text-ui-fg-subtle">
                                Cost: ${basePrice.toFixed(2)} → Retail: ${retailPrice.toFixed(2)}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {loadingCatalog ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-ui-fg-disabled" />
                    <span className="ml-3 text-ui-fg-subtle">Loading catalog...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-ui-fg-subtle mb-4">
                      Select a product from the Printful catalog to continue
                    </p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto">
                      {catalogProducts.map((product) => (
                        <div
                          key={product.id}
                          className="rounded-lg border border-ui-border-base p-4 cursor-pointer hover:border-blue-500 hover:bg-ui-bg-highlight transition"
                          onClick={() => selectProduct(product)}
                        >
                          {product.thumbnail_url ? (
                            <img
                              src={product.thumbnail_url}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded mb-3"
                            />
                          ) : (
                            <div className="w-full h-32 bg-ui-bg-subtle flex items-center justify-center rounded mb-3">
                              No Image
                            </div>
                          )}
                          <p className="font-semibold text-sm">{product.name}</p>
                          <p className="text-xs text-ui-fg-muted mt-1">
                            {product.variant_count} variants
                          </p>
                        </div>
                      ))}
                    </div>
                    {catalogProducts.length === 0 && (
                      <p className="text-center text-ui-fg-muted py-8">
                        No products available. Check your Printful API connection.
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 4 && (
          <div className="space-y-4">
            <Heading level="h3">Product Details</Heading>
            <Input
              placeholder="Product Title"
              value={session.details?.product_title || ""}
              onChange={(e) =>
                onUpdate({
                  details: {
                    ...session.details,
                    product_title: e.target.value
                  }
                })
              }
            />
            <Textarea
              placeholder="Product Description"
              value={session.details?.product_description || ""}
              onChange={(e) =>
                onUpdate({
                  details: {
                    ...session.details,
                    product_title: session.details?.product_title || "",
                    product_description: e.target.value
                  }
                })
              }
            />
          </div>
        )}

        {activeTab === 5 && (
          <div className="space-y-4">
            <Heading level="h3">Pricing</Heading>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium block mb-2">Markup Type</label>
                <Select
                  value={session.pricing?.markup_type || "percentage"}
                  onValueChange={(value) => {
                    const markupType = value as 'fixed' | 'percentage'
                    const markupValue = session.pricing?.markup_value || 50

                    // Recalculate retail prices
                    const retailPrices: Record<string, number> = {}
                    if (selectedProduct) {
                      selectedProduct.variants.forEach(variant => {
                        const basePrice = variant.price || 20
                        retailPrices[variant.id] = markupType === 'percentage'
                          ? basePrice * (1 + markupValue / 100)
                          : basePrice + markupValue
                      })
                    }

                    onUpdate({
                      pricing: {
                        ...session.pricing!,
                        markup_type: markupType,
                        retail_prices: retailPrices
                      }
                    })
                  }}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select markup type" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="percentage">Percentage (%)</Select.Item>
                    <Select.Item value="fixed">Fixed Amount ($)</Select.Item>
                  </Select.Content>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Markup Value</label>
                <Input
                  type="number"
                  value={session.pricing?.markup_value || 50}
                  onChange={(e) => {
                    const markupValue = parseFloat(e.target.value) || 0
                    const markupType = session.pricing?.markup_type || 'percentage'

                    // Recalculate retail prices
                    const retailPrices: Record<string, number> = {}
                    if (selectedProduct) {
                      selectedProduct.variants.forEach(variant => {
                        const basePrice = variant.price || 20
                        retailPrices[variant.id] = markupType === 'percentage'
                          ? basePrice * (1 + markupValue / 100)
                          : basePrice + markupValue
                      })
                    }

                    onUpdate({
                      pricing: {
                        ...session.pricing!,
                        markup_value: markupValue,
                        retail_prices: retailPrices
                      }
                    })
                  }}
                />
              </div>
            </div>

            {/* Show calculated prices */}
            {session.pricing && selectedProduct && (
              <div className="mt-6">
                <p className="text-sm font-medium mb-3">Calculated Retail Prices:</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedProduct.variants.slice(0, 10).map(variant => {
                    const basePrice = variant.price || 20
                    const retailPrice = session.pricing!.retail_prices[variant.id] || basePrice
                    const profit = retailPrice - basePrice

                    return (
                      <div key={variant.id} className="flex items-center justify-between text-sm bg-ui-bg-subtle p-2 rounded">
                        <span className="text-ui-fg-base">{variant.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-ui-fg-muted">Base: ${basePrice.toFixed(2)}</span>
                          <span className="font-semibold text-green-700">Retail: ${retailPrice.toFixed(2)}</span>
                          <span className="text-xs text-ui-fg-muted">(+${profit.toFixed(2)})</span>
                        </div>
                      </div>
                    )
                  })}
                  {selectedProduct.variants.length > 10 && (
                    <p className="text-xs text-ui-fg-muted text-center">
                      ...and {selectedProduct.variants.length - 10} more variants
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4">
            <Heading level="h3">Design Configuration</Heading>

            {/* Placement Selection */}
            {session.design?.available_placements && session.design.available_placements.length > 0 && (
              <div>
                <label className="text-sm font-medium block mb-2">Placement</label>
                <Select
                  value={session.design?.placement || session.design.available_placements[0]?.placement}
                  onValueChange={(value) =>
                    onUpdate({
                      design: {
                        ...session.design!,
                        placement: value
                      }
                    })
                  }
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select placement" />
                  </Select.Trigger>
                  <Select.Content>
                    {session.design.available_placements.map((p: any) => {
                      const placementId = p.placement || p.id || p
                      const placementName = p.name || placementId
                      return (
                        <Select.Item key={placementId} value={placementId}>
                          {placementName}
                        </Select.Item>
                      )
                    })}
                  </Select.Content>
                </Select>
                <p className="text-xs text-ui-fg-muted mt-1">
                  Select where the design will be placed on the product
                </p>
              </div>
            )}

            {/* Technique Selection */}
            <div>
              <label className="text-sm font-medium block mb-2">Printing Technique</label>
              {session.design?.available_techniques && session.design.available_techniques.length > 0 ? (
                <>
                  <Select
                    value={session.design?.technique || session.design.available_techniques[0]?.id}
                    onValueChange={(value) =>
                      onUpdate({
                        design: {
                          ...session.design!,
                          technique: value
                        }
                      })
                    }
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Select technique" />
                    </Select.Trigger>
                    <Select.Content>
                      {session.design.available_techniques.map((t: any) => {
                        const techniqueId = t.id || t.technique || t
                        const techniqueName = t.name || techniqueId
                        return (
                          <Select.Item key={techniqueId} value={techniqueId}>
                            {techniqueName}
                          </Select.Item>
                        )
                      })}
                    </Select.Content>
                  </Select>
                  <p className="text-xs text-ui-fg-muted mt-1">
                    Available techniques for this product
                  </p>
                </>
              ) : (
                <>
                  <Select
                    value={session.design?.technique || "DTG"}
                    onValueChange={(value) =>
                      onUpdate({
                        design: {
                          ...session.design!,
                          technique: value as any
                        }
                      })
                    }
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Select technique" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="DTG">DTG (Direct to Garment)</Select.Item>
                      <Select.Item value="embroidery">Embroidery</Select.Item>
                      <Select.Item value="sublimation">Sublimation</Select.Item>
                      <Select.Item value="screen_print">Screen Print</Select.Item>
                    </Select.Content>
                  </Select>
                  <p className="text-xs text-ui-fg-muted mt-2">
                    {session.design?.technique === 'DTG' && 'Best for detailed, colorful designs on fabric'}
                    {session.design?.technique === 'embroidery' && 'Premium textured look, great for logos'}
                    {session.design?.technique === 'sublimation' && 'Full-color, all-over prints'}
                    {session.design?.technique === 'screen_print' && 'Durable, vibrant colors'}
                  </p>
                </>
              )}
            </div>
            {session.artwork.artwork_url && (
              <div>
                <p className="text-sm font-medium mb-2">Design Preview</p>
                <div className="bg-ui-bg-subtle rounded-lg p-8 flex items-center justify-center">
                  <img
                    src={session.artwork.artwork_url}
                    alt="Design preview"
                    className="max-w-xs max-h-64 object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-4">
            <Heading level="h3">Mockup Generation</Heading>

            {/* Variant selector for mockup generation */}
            {!session.mockups && session.product && selectedProduct && (
              <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-4 mb-4">
                <p className="text-sm font-medium mb-3">Select variants for mockup generation</p>
                <p className="text-xs text-ui-fg-subtle mb-4">
                  Choose which variants to generate mockups for. Fewer variants = faster generation.
                  <br />
                  <strong>Estimated time:</strong> ~30 seconds per variant due to rate limits.
                </p>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {selectedProduct.variants?.map((variant: any) => {
                    const variantId = String(variant.id)
                    const isSelectedForProduct = session.product?.selected_variant_ids?.includes(variantId)
                    const isSelectedForMockup = session.mockups?.selected_variant_ids_for_mockups?.includes(variantId) ?? false

                    if (!isSelectedForProduct) return null

                    return (
                      <label
                        key={variantId}
                        className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition ${
                          isSelectedForMockup
                            ? 'border-blue-500 bg-ui-bg-highlight'
                            : 'border-ui-border-base hover:border-ui-border-strong'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelectedForMockup}
                          onChange={(e) => {
                            const currentSelected = session.mockups?.selected_variant_ids_for_mockups || []
                            const newSelected = e.target.checked
                              ? [...currentSelected, variantId]
                              : currentSelected.filter(id => id !== variantId)

                            onUpdate({
                              mockups: {
                                ...(session.mockups || { mockup_urls: [] }),
                                selected_variant_ids_for_mockups: newSelected
                              }
                            })
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{variant.name}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-ui-fg-subtle">
                    {session.mockups?.selected_variant_ids_for_mockups?.length || 0} variant(s) selected
                    {session.mockups?.selected_variant_ids_for_mockups?.length && (
                      <span className="ml-2">
                        (est. {Math.ceil((session.mockups.selected_variant_ids_for_mockups.length * 30) / 60)} min)
                      </span>
                    )}
                  </p>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => {
                      onUpdate({
                        mockups: {
                          ...(session.mockups || { mockup_urls: [] }),
                          selected_variant_ids_for_mockups: session.product?.selected_variant_ids || []
                        }
                      })
                    }}
                  >
                    Select All ({session.product?.selected_variant_ids?.length || 0})
                  </Button>
                </div>
              </div>
            )}

            {session.mockups && session.mockups.mockup_urls.length > 0 ? (
              <div>
                {/* Progress indicator */}
                {session.mockups.mockup_status === 'generating' && (
                  <div className="rounded-lg border border-ui-border-loud bg-ui-bg-highlight p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-ui-fg-base">
                          {session.mockups.mockup_progress || 'Generating mockups...'}
                        </p>
                        <p className="text-xs text-ui-fg-subtle mt-1">
                          This may take several minutes due to API rate limits. Please keep this tab open.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {session.mockups.mockup_status === 'completed' && (
                  <div className="rounded-lg border border-ui-tag-green-border bg-ui-tag-green-bg p-4 mb-4">
                    <p className="font-medium text-ui-fg-base">
                      {session.mockups.mockup_progress || `✓ Mockups ready (${session.mockups.mockup_urls.length})`}
                    </p>
                  </div>
                )}

                {session.mockups.mockup_status === 'failed' && (
                  <div className="rounded-lg border border-ui-tag-red-border bg-ui-tag-red-bg p-4 mb-4">
                    <p className="font-medium text-ui-fg-base">
                      {session.mockups.mockup_progress || '⚠️ Mockup generation failed'}
                    </p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  {session.mockups.mockup_urls.map((url, idx) => (
                    <div key={idx} className="rounded-lg border border-ui-border-base overflow-hidden relative">
                      <img src={url} alt={`Mockup ${idx + 1}`} className="w-full h-48 object-cover" />
                      {session.mockups?.mockup_status === 'generating' && (
                        <div className="absolute inset-0 bg-ui-bg-overlay flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 mx-auto text-ui-fg-disabled mb-4" />
                <p className="text-ui-fg-subtle mb-4">
                  Generate product mockups with your artwork
                </p>
                <Button
                  variant="primary"
                  disabled={!session.product || generatingMockups || !(session.mockups?.selected_variant_ids_for_mockups?.length)}
                  onClick={generateMockups}
                >
                  {generatingMockups ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Mockups ({session.mockups?.selected_variant_ids_for_mockups?.length || 0})
                    </>
                  )}
                </Button>
                {!session.product && (
                  <p className="text-xs text-ui-fg-muted mt-2">
                    Select a product first to generate mockups
                  </p>
                )}
                {session.product && !(session.mockups?.selected_variant_ids_for_mockups?.length) && (
                  <p className="text-xs text-ui-fg-muted mt-2">
                    Select at least one variant above to generate mockups
                  </p>
                )}
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-between">
        <Button
          variant="secondary"
          disabled={activeTab === 0}
          onClick={() => setActiveTab(activeTab - 1)}
        >
          Previous
        </Button>
        <div className="flex gap-2">
          {activeTab < tabs.length - 1 ? (
            <Button
              variant="primary"
              disabled={!isStepComplete(activeTab)}
              onClick={() => setActiveTab(activeTab + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={loading || !isStepComplete(5)}
              onClick={onCreate}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Product"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Printful Studio",
  icon: BookOpen,
})

export default PrintfulStudioPage
