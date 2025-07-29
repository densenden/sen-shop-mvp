import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Input, Select } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

interface Price {
  id: string
  amount: number
  currency_code: string
}

interface Variant {
  id: string
  title: string
  sku?: string
  prices?: Price[]
}

interface Product {
  id: string
  title: string
  variants?: Variant[]
}

const VariantPriceEditPage = () => {
  const { id: productId, variantId } = useParams<{ id: string; variantId: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [variant, setVariant] = useState<Variant | null>(null)
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch product data
        const response = await fetch(`/admin/products/${productId}`)
        const data = await response.json()
        
        setProduct(data.product)
        
        // Find the specific variant
        const foundVariant = data.product?.variants?.find((v: Variant) => v.id === variantId)
        if (foundVariant) {
          setVariant(foundVariant)
          setPrices(foundVariant.prices || [{ id: 'new', amount: 2000, currency_code: 'usd' }])
        }
      } catch (error) {
        console.error("Error fetching product/variant:", error)
      } finally {
        setLoading(false)
      }
    }

    if (productId && variantId) {
      fetchData()
    }
  }, [productId, variantId])

  const updatePrice = (index: number, field: keyof Price, value: string | number) => {
    const updatedPrices = [...prices]
    updatedPrices[index] = {
      ...updatedPrices[index],
      [field]: field === 'amount' ? Number(value) : value
    }
    setPrices(updatedPrices)
  }

  const addPrice = () => {
    setPrices([...prices, { id: `new-${Date.now()}`, amount: 2000, currency_code: 'usd' }])
  }

  const removePrice = (index: number) => {
    if (prices.length > 1) {
      setPrices(prices.filter((_, i) => i !== index))
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Update variant prices via API
      const response = await fetch(`/admin/products/${productId}/variants/${variantId}/prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prices: prices.map(price => ({
            amount: price.amount,
            currency_code: price.currency_code
          }))
        }),
      })

      if (response.ok) {
        alert("Prices updated successfully!")
        navigate(`/app/products/${productId}`)
      } else {
        throw new Error('Failed to update prices')
      }
    } catch (error) {
      console.error("Error saving prices:", error)
      alert("Failed to save prices. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!product || !variant) {
    return <div className="p-6">Product or variant not found</div>
  }

  return (
    <div className="flex flex-col gap-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Variant Prices</h1>
          <p className="text-gray-600 mt-1">
            Product: {product.title} → Variant: {variant.title}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(`/app/products/${productId}`)}
        >
          Back to Product
        </Button>
      </div>

      {/* Prices */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Pricing</h2>
          <Button variant="secondary" onClick={addPrice}>
            Add Price
          </Button>
        </div>

        <div className="space-y-4">
          {prices.map((price, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 p-4 border border-gray-100 rounded">
              <div className="col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (in cents)
                </label>
                <Input
                  type="number"
                  value={price.amount}
                  onChange={(e) => updatePrice(index, 'amount', e.target.value)}
                  placeholder="2000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Preview: {formatCurrency(price.amount, price.currency_code)}
                </p>
              </div>

              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <Select
                  value={price.currency_code}
                  onValueChange={(value) => updatePrice(index, 'currency_code', value)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select currency" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="usd">USD</Select.Item>
                    <Select.Item value="eur">EUR</Select.Item>
                    <Select.Item value="gbp">GBP</Select.Item>
                    <Select.Item value="cad">CAD</Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div className="col-span-4 flex items-end">
                {prices.length > 1 && (
                  <Button
                    variant="secondary"
                    onClick={() => removePrice(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Pricing Guidelines:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Enter amounts in cents (e.g., 2000 for $20.00)</li>
            <li>• You can set different prices for different currencies</li>
            <li>• Prices are used for checkout and product display</li>
            <li>• For Printful products, manual price changes may be overridden during sync</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate(`/app/products/${productId}`)}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Prices"}
        </Button>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Edit Variant Prices",
})

export default VariantPriceEditPage