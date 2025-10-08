import { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Textarea } from "@medusajs/ui"
import { Sparkles, Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react"

// SUPER SIMPLE PRINTFUL STUDIO - NO CONFUSION!
// 5 Steps: Artwork → Product → Sizes → Preview → Done

const PrintfulStudioSimple = () => {
  const [step, setStep] = useState(1)
  const [artworks, setArtworks] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [markup, setMarkup] = useState(50)
  const [loading, setLoading] = useState(false)
  const [mockups, setMockups] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  // Load artworks
  useEffect(() => {
    fetch("/admin/printful-studio/v2/artworks", { credentials: "include" })
      .then(r => r.json())
      .then(d => setArtworks(d.artworks || []))
  }, [])

  // Load products when needed
  const loadProducts = () => {
    setLoading(true)
    fetch("/admin/printful-studio/v2/catalog", { credentials: "include" })
      .then(r => r.json())
      .then(d => setProducts(d.catalog || []))
      .finally(() => setLoading(false))
  }

  // Load product details
  const selectProduct = (product: any) => {
    setLoading(true)
    fetch(`/admin/printful-studio/v2/catalog/${product.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setSelectedProduct(d.product)
        setStep(3)
      })
      .finally(() => setLoading(false))
  }

  // Generate mockups
  const generatePreview = () => {
    setLoading(true)
    fetch(`/admin/printful-studio/v2/catalog/${selectedProduct.id}/mockups`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artwork_url: selectedArtwork.image_url,
        artwork_id: selectedArtwork.id,
        variant_ids: selectedSizes,
        wait_for_completion: true
      })
    })
      .then(r => r.json())
      .then(d => {
        setMockups(d.mockup_urls || [])
        setTitle(`${selectedArtwork.title} - ${selectedProduct.name}`)
        setStep(4)
      })
      .catch(() => {
        // Fallback to artwork image if mockup fails
        setMockups([selectedArtwork.image_url])
        setTitle(`${selectedArtwork.title} - ${selectedProduct.name}`)
        setStep(4)
      })
      .finally(() => setLoading(false))
  }

  // Create product
  const createProduct = async () => {
    setCreating(true)
    try {
      // Create session
      const sessionRes = await fetch("/admin/printful-studio/composer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artwork_id: selectedArtwork.id })
      })
      const session = await sessionRes.json()

      // Calculate prices
      const retailPrices: any = {}
      selectedSizes.forEach(id => {
        const variant = selectedProduct.variants.find((v: any) => v.id === id)
        const basePrice = parseFloat(variant?.price || "20")
        retailPrices[String(id)] = basePrice * (1 + markup / 100)
      })

      // Update session
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
            placement: "default",
            technique: "digital"
          },
          mockups: {
            mockup_urls: mockups
          },
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

  const reset = () => {
    setStep(1)
    setSelectedArtwork(null)
    setSelectedProduct(null)
    setSelectedSizes([])
    setMockups([])
    setTitle("")
    setDescription("")
  }

  return (
    <Container>
      <div className="max-w-6xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <Heading level="h1" className="text-3xl mb-2">Create POD Product</Heading>
          <p className="text-ui-fg-subtle">Simple 5-step process</p>
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

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 min-h-[500px]">
          {/* Step 1: Artwork */}
          {step === 1 && (
            <div>
              <Heading level="h2" className="mb-6">Step 1: Choose Your Design</Heading>
              <div className="grid grid-cols-4 gap-4">
                {artworks.map(art => (
                  <div
                    key={art.id}
                    onClick={() => {
                      setSelectedArtwork(art)
                      setStep(2)
                      if (products.length === 0) loadProducts()
                    }}
                    className={`cursor-pointer border-2 rounded-lg p-3 transition ${selectedArtwork?.id === art.id ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-blue-300"}`}
                  >
                    <img src={art.image_url} className="w-full h-32 object-cover rounded mb-2" />
                    <p className="text-sm font-medium truncate">{art.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Product */}
          {step === 2 && (
            <div>
              <Heading level="h2" className="mb-6">Step 2: Choose Product Type</Heading>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {products.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => selectProduct(prod)}
                      className="cursor-pointer border border-gray-200 hover:border-blue-500 rounded-lg p-4 transition"
                    >
                      <img src={prod.thumbnail_url || prod.image} className="w-full h-48 object-cover rounded mb-3" />
                      <p className="font-medium text-center">{prod.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Sizes */}
          {step === 3 && selectedProduct && (
            <div>
              <Heading level="h2" className="mb-6">Step 3: Select Sizes</Heading>
              <p className="text-sm text-gray-600 mb-6">Choose which sizes to offer for {selectedProduct.name}</p>
              <div className="grid grid-cols-5 gap-3">
                {selectedProduct.variants?.map((v: any) => (
                  <label
                    key={v.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${selectedSizes.includes(v.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSizes.includes(v.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedSizes([...selectedSizes, v.id])
                        } else {
                          setSelectedSizes(selectedSizes.filter(id => id !== v.id))
                        }
                      }}
                      className="mr-2"
                    />
                    <div className="font-medium text-sm">{v.size || v.name.split("(")[1]?.replace(")", "") || v.name}</div>
                    <div className="text-xs text-gray-500 mt-1">${v.price}</div>
                  </label>
                ))}
              </div>
              <p className="mt-6 text-sm text-gray-600">{selectedSizes.length} size(s) selected</p>
              <Button
                className="mt-6"
                disabled={selectedSizes.length === 0 || loading}
                onClick={generatePreview}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating Preview...</>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div>
              <Heading level="h2" className="mb-6">Step 4: Product Details</Heading>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Product Name</label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Markup (%)</label>
                    <Input type="number" value={markup} onChange={e => setMarkup(Number(e.target.value))} />
                    <p className="text-xs text-gray-500 mt-1">Adds {markup}% to base Printful cost</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Preview</p>
                  {mockups.length > 0 && (
                    <img src={mockups[0]} className="w-full rounded-lg border" />
                  )}
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <Button variant="secondary" onClick={() => setStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />Back
                </Button>
                <Button
                  disabled={!title.trim() || creating}
                  onClick={createProduct}
                >
                  {creating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Create Product</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-12 h-12 text-white" />
              </div>
              <Heading level="h2" className="mb-4">Product Created Successfully!</Heading>
              <p className="text-gray-600 mb-8">
                Your product has been created on Printful and imported to Medusa.
                <br />
                Check <a href="/app/products" className="text-blue-500 underline">your products page</a> to see it.
              </p>
              <Button onClick={reset}>Create Another Product</Button>
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

export default PrintfulStudioSimple
