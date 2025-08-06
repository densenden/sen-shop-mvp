import React from "react"
import { ProductDTO } from "@medusajs/types"
import { Container, Table, Button, Badge, Heading } from "@medusajs/ui"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Package, Download } from "lucide-react"

const ProductListWidget = () => {
  console.log("🚀 SenCommerce Product List Widget Loading!")
  const navigate = useNavigate()
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Hide the default product list when our custom widget loads
  React.useEffect(() => {
    const hideDefaultList = () => {
      // Hide default Medusa product list elements
      const selectors = [
        '[data-testid*="product"]',
        '.product-list',
        '[class*="ProductList"]',
        'main > div > div > div:not(:has(.sencommerce-products))', // Hide main content that doesn't contain our widget
        'table:not(.sencommerce-table)', // Hide default tables
      ]
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          const htmlEl = el as HTMLElement
          if (htmlEl && !htmlEl.innerHTML.includes('SenCommerce') && !htmlEl.closest('.sencommerce-products')) {
            htmlEl.style.display = 'none'
          }
        })
      })
    }
    
    const timer = setTimeout(hideDefaultList, 100) // Small delay to let DOM load
    const observer = new MutationObserver(hideDefaultList)
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/admin/products")
        const data = await response.json()
        console.log("📦 Products fetched:", data.products?.length, "products")
        console.log("📋 Product types:", data.products?.map(p => ({
          title: p.title,
          fulfillment_type: p.metadata?.fulfillment_type
        })))
        setProducts(data.products)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const getProductTypeInfo = (product: ProductDTO) => {
    const fulfillmentType = product.metadata?.fulfillment_type
    if (fulfillmentType === 'printful_pod') {
      return {
        icon: <Package className="w-4 h-4" />,
        label: 'POD',
        color: 'bg-green-100 text-green-800'
      }
    } else if (fulfillmentType === 'digital' || fulfillmentType === 'digital_download') {
      return {
        icon: <Download className="w-4 h-4" />,
        label: 'Digital',
        color: 'bg-blue-100 text-blue-800'
      }
    }
    return {
      icon: <Package className="w-4 h-4" />,
      label: 'Standard',
      color: 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <Container className="sencommerce-products">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Heading level="h1">SenCommerce Products</Heading>
          <p className="text-ui-fg-subtle">Manage your product catalog with POD and digital products</p>
        </div>
        <Button 
          onClick={() => navigate("create")}
          variant="primary"
        >
          <Plus />
          Create Product
        </Button>
      </div>

      <Table className="sencommerce-table">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Title</Table.HeaderCell>
            <Table.HeaderCell>Type</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Artwork</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {products?.map((product: ProductDTO) => {
            const typeInfo = getProductTypeInfo(product)
            return (
              <Table.Row key={product.id}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {product.thumbnail && (
                      <img 
                        src={product.thumbnail} 
                        alt={product.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium">{product.title}</div>
                      <div className="text-sm text-gray-500">
                        {product.variants?.length || 0} variant{product.variants?.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="small" className={`inline-flex items-center gap-1 ${typeInfo.color}`}>
                    {typeInfo.icon}
                    {typeInfo.label}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Badge 
                    size="small" 
                    className={product.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {product.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {product.metadata?.artwork_id ? (
                    <span className="text-sm text-gray-600">Linked</span>
                  ) : (
                    <span className="text-sm text-red-600">No artwork</span>
                  )}
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Link 
                    to={`${product.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </Link>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>

      {products?.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first product to get started
          </p>
          <Button 
            onClick={() => navigate("create")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Product
          </Button>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before"
})

export default ProductListWidget
