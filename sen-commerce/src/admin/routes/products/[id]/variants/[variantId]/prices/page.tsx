import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button, Input, Label, Container, Badge, Text } from "@medusajs/ui"
import { 
  ArrowLeft, 
  Save, 
  DollarSign,
  Plus,
  Trash2
} from "lucide-react"

interface Price {
  id?: string
  amount: number
  currency_code: string
}

interface VariantPricesData {
  product: {
    id: string
    title: string
  }
  variant: {
    id: string
    title: string
    sku?: string
    price_set_id?: string
  }
  prices: Price[]
}

const VariantPricesPage = () => {
  const navigate = useNavigate()
  const { id: productId, variantId } = useParams<{ id: string; variantId: string }>()
  const [data, setData] = useState<VariantPricesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  // Form state
  const [prices, setPrices] = useState<Price[]>([])

  useEffect(() => {
    fetchData()
  }, [productId, variantId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/admin/products/${productId}/variants/${variantId}/prices`, {
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Failed to fetch variant prices")
      }

      const result = await response.json()
      setData(result)
      
      // Initialize prices or set default USD price
      if (result.prices && result.prices.length > 0) {
        setPrices(result.prices.map(p => ({
          id: p.id,
          amount: p.amount / 100, // Convert from cents
          currency_code: p.currency_code.toUpperCase()
        })))
      } else {
        // Default to EUR price
        setPrices([{ amount: 25.00, currency_code: 'EUR' }])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load variant prices. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPrice = () => {
    setPrices([...prices, { amount: 0, currency_code: 'EUR' }])
  }

  const handleRemovePrice = (index: number) => {
    setPrices(prices.filter((_, i) => i !== index))
  }

  const handlePriceChange = (index: number, field: keyof Price, value: string | number) => {
    setPrices(prices.map((price, i) => 
      i === index ? { ...price, [field]: value } : price
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate prices
    const validPrices = prices.filter(p => p.amount > 0 && p.currency_code)
    if (validPrices.length === 0) {
      setError("Please add at least one valid price")
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch(`/admin/products/${productId}/variants/${variantId}/prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          prices: validPrices.map(p => ({
            amount: Math.round(p.amount * 100), // Convert to cents
            currency_code: p.currency_code.toUpperCase()
          }))
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update prices")
      }

      setSuccess(`Updated ${validPrices.length} price(s) successfully!`)
      // Refresh data
      await fetchData()
    } catch (error) {
      console.error("Error updating prices:", error)
      setError(error.message || "Failed to update prices")
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

  if (!data) {
    return (
      <Container className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Variant not found</h2>
          <p className="text-gray-600 mb-4">The variant you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(`/products/${productId}`)}>
            Back to Product
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate(`/products/${productId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Product
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Variant Prices</h1>
            <div className="flex items-center gap-2 mt-1">
              <Text className="text-sm text-gray-600">
                {data.product.title} → {data.variant.title}
              </Text>
              {data.variant.sku && (
                <Badge variant="outline">SKU: {data.variant.sku}</Badge>
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Prices
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Pricing Form */}
      <Container className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium">Variant Pricing</h2>
            <Text className="text-sm text-gray-600">
              Set prices for different currencies and markets
            </Text>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddPrice}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Price
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {prices.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <Text className="text-gray-600 mb-4">No prices configured</Text>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddPrice}
              >
                Add Your First Price
              </Button>
            </div>
          ) : (
            prices.map((price, index) => (
              <div key={index} className="flex gap-4 items-end p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`amount-${index}`} className="mb-1">
                    Amount
                  </Label>
                  <Input
                    id={`amount-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={price.amount}
                    onChange={(e) => handlePriceChange(index, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor={`currency-${index}`} className="mb-1">
                    Currency
                  </Label>
                  <Input
                    id={`currency-${index}`}
                    value={price.currency_code}
                    onChange={(e) => handlePriceChange(index, 'currency_code', e.target.value.toUpperCase())}
                    placeholder="EUR"
                    maxLength={3}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleRemovePrice(index)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}

          {prices.length > 0 && (
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/products/${productId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || prices.filter(p => p.amount > 0).length === 0}
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
                    Save {prices.filter(p => p.amount > 0).length} Price(s)
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Container>

      {/* Tips */}
      <Container className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">💡 Pricing Tips</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Use standard currency codes like EUR, USD, GBP</p>
          <p>• Prices are stored in the smallest currency unit (cents)</p>
          <p>• You can set different prices for different markets</p>
          <p>• At least one price is required for the variant to be purchasable</p>
        </div>
      </Container>
    </div>
  )
}

// Remove route config to prevent sidebar menu errors with parameterized routes

export default VariantPricesPage