import { useState, useEffect } from "react"
import { 
  Container, 
  Heading, 
  Text, 
  Button, 
  Badge,
  Table,
  Checkbox
} from "@medusajs/ui"
import { 
  CloudArrowDown, 
  Plus, 
  Trash,
  ExclamationCircle 
} from "@medusajs/icons"

interface DigitalProduct {
  id: string
  name: string
  file_size: number
  mime_type: string
  created_at: string
}

interface DigitalProductSectionProps {
  productId: string
}

export function DigitalProductSection({ productId }: DigitalProductSectionProps) {
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([])
  const [linkedProducts, setLinkedProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showSelector, setShowSelector] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  useEffect(() => {
    fetchLinkedProducts()
    fetchAllDigitalProducts()
  }, [productId])

  const fetchLinkedProducts = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/digital-products`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        const linkedIds = data.digital_products.map((dp: any) => dp.id)
        setLinkedProducts(linkedIds)
      }
    } catch (error) {
      console.error("Error fetching linked digital products:", error)
    }
  }

  const fetchAllDigitalProducts = async () => {
    try {
      const response = await fetch("/api/admin/digital-products", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setDigitalProducts(data.digital_products || [])
      }
    } catch (error) {
      console.error("Error fetching digital products:", error)
    } finally {
      setLoading(false)
    }
  }

  const linkDigitalProduct = async (digitalProductId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/digital-products`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          digital_product_id: digitalProductId,
        }),
      })

      if (response.ok) {
        setLinkedProducts([...linkedProducts, digitalProductId])
        // Don't close selector anymore - let user add multiple
      }
    } catch (error) {
      console.error("Error linking digital product:", error)
    }
  }

  const unlinkDigitalProduct = async (digitalProductId: string) => {
    try {
      const response = await fetch(
        `/api/admin/products/${productId}/digital-products/${digitalProductId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (response.ok) {
        setLinkedProducts(linkedProducts.filter(id => id !== digitalProductId))
      }
    } catch (error) {
      console.error("Error unlinking digital product:", error)
    }
  }

  const linkedDigitalProducts = digitalProducts.filter(dp => 
    linkedProducts.includes(dp.id)
  )

  const availableDigitalProducts = digitalProducts.filter(dp => 
    !linkedProducts.includes(dp.id)
  )

  if (loading) {
    return <Container>Loading digital products...</Container>
  }

  return (
    <Container className="p-0">
      <div className="mb-4">
        <Heading level="h2" className="mb-2">Digital Products</Heading>
        <Text className="text-ui-fg-subtle">
          Attach digital files that customers will receive after purchase
        </Text>
      </div>

      {linkedDigitalProducts.length > 0 && (
        <div className="mb-6">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>File Name</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Size</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {linkedDigitalProducts.map((dp) => (
                <Table.Row key={dp.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <CloudArrowDown className="text-ui-fg-subtle" />
                      {dp.name}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small">{dp.mime_type}</Badge>
                  </Table.Cell>
                  <Table.Cell>{formatFileSize(dp.file_size)}</Table.Cell>
                  <Table.Cell>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => unlinkDigitalProduct(dp.id)}
                    >
                      <Trash />
                      Remove
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}

      {linkedDigitalProducts.length === 0 && (
        <div className="mb-6 p-6 border-2 border-dashed border-ui-border-base rounded-lg text-center">
          <ExclamationCircle className="mx-auto mb-2 text-ui-fg-subtle" />
          <Text className="text-ui-fg-subtle">
            No digital products attached to this product
          </Text>
        </div>
      )}

      {!showSelector && (
        <Button
          variant="secondary"
          size="small"
          onClick={() => setShowSelector(true)}
        >
          <Plus />
          Add Digital Product
        </Button>
      )}

      {showSelector && (
        <div className="mt-4 p-4 border border-ui-border-base rounded-lg">
          <Heading level="h3" className="mb-3">Select Digital Products</Heading>
          
          {availableDigitalProducts.length === 0 ? (
            <Text className="text-ui-fg-subtle">
              No digital products available. Create some in the Digital Products section first.
            </Text>
          ) : (
            <>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableDigitalProducts.map((dp) => (
                  <div
                    key={dp.id}
                    className="flex items-center justify-between p-3 border border-ui-border-base rounded hover:bg-ui-bg-subtle"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedProducts.includes(dp.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProducts([...selectedProducts, dp.id])
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== dp.id))
                          }
                        }}
                      />
                      <CloudArrowDown className="text-ui-fg-subtle" />
                      <div>
                        <Text className="font-medium">{dp.name}</Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {dp.mime_type} • {formatFileSize(dp.file_size)}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedProducts.length > 0 && (
                <Text size="small" className="mt-2 text-ui-fg-subtle">
                  {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                </Text>
              )}
            </>
          )}
          
          <div className="mt-4 flex justify-between">
            <Button
              variant="primary"
              size="small"
              disabled={selectedProducts.length === 0}
              onClick={async () => {
                // Add all selected products
                for (const productId of selectedProducts) {
                  await linkDigitalProduct(productId)
                }
                setSelectedProducts([])
                setShowSelector(false)
              }}
            >
              Add Selected ({selectedProducts.length})
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                setSelectedProducts([])
                setShowSelector(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}

// Helper to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
} 