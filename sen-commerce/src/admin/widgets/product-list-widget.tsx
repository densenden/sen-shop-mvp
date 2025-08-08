import React from "react"
import { ProductDTO } from "@medusajs/types"
import { Container, Table, Button, Badge, Heading, Input, Select, Checkbox, IconButton, DropdownMenu, Text } from "@medusajs/ui"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Plus, 
  Package, 
  Download, 
  Trash2, 
  Edit, 
  ChevronUp, 
  ChevronDown, 
  Filter,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from "lucide-react"

interface Artwork {
  id: string
  title: string
  image_url: string
  product_ids?: string[]
}

const ProductListWidget = () => {
  console.log("🚀 SenCommerce Product List Widget Loading!")
  const navigate = useNavigate()
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("title")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(25)

  // Hide the default product list when our custom widget loads
  React.useEffect(() => {
    const hideDefaultList = () => {
      const selectors = [
        '[data-testid*="product"]',
        '.product-list',
        '[class*="ProductList"]',
        'main > div > div > div:not(:has(.sencommerce-products))',
        'table:not(.sencommerce-table)',
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
    
    const timer = setTimeout(hideDefaultList, 100)
    const observer = new MutationObserver(hideDefaultList)
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      if (!isMounted) return
      
      try {
        setIsLoading(true)
        
        // Fetch products and artworks in parallel
        const [productRes, artworkRes] = await Promise.all([
          fetch("/admin/products?limit=1000", { credentials: "include" }),
          fetch("/admin/artworks", { credentials: "include" })
        ])
        
        if (!isMounted) return
        
        const productData = await productRes.json()
        const artworkData = await artworkRes.json()
        
        console.log("📦 Products fetched:", productData.products?.length, "products")
        console.log("🎨 Artworks fetched:", artworkData.artworks?.length, "artworks")
        
        if (isMounted) {
          setProducts(productData.products || [])
          setArtworks(artworkData.artworks || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      isMounted = false
    }
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

  const getArtworkForProduct = (product: ProductDTO): Artwork | undefined => {
    // Single source of truth: find artwork that contains this product ID
    return artworks.find(artwork => 
      artwork.product_ids && artwork.product_ids.includes(product.id)
    )
  }

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(p => {
        const type = p.metadata?.fulfillment_type || 'standard'
        if (typeFilter === 'pod') return type === 'printful_pod'
        if (typeFilter === 'digital') return type === 'digital' || type === 'digital_download'
        if (typeFilter === 'standard') return !type || type === 'standard'
        return true
      })
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'title':
          aValue = a.title || ''
          bValue = b.title || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'type':
          aValue = a.metadata?.fulfillment_type || 'standard'
          bValue = b.metadata?.fulfillment_type || 'standard'
          break
        case 'created_at':
          aValue = a.created_at
          bValue = b.created_at
          break
        default:
          aValue = a.title || ''
          bValue = b.title || ''
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [products, searchTerm, typeFilter, statusFilter, sortField, sortDirection])

  // Pagination
  const paginatedProducts = useMemo(() => {
    if (itemsPerPage === -1) return filteredAndSortedProducts // Show all
    
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedProducts.slice(startIndex, endIndex)
  }, [filteredAndSortedProducts, currentPage, itemsPerPage])

  const totalPages = useMemo(() => {
    if (itemsPerPage === -1) return 1
    return Math.ceil(filteredAndSortedProducts.length / itemsPerPage)
  }, [filteredAndSortedProducts.length, itemsPerPage])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)))
    }
  }

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    
    try {
      const response = await fetch(`/admin/products/${productId}`, {
        method: "DELETE",
        credentials: "include"
      })
      
      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId))
        setSelectedProducts(new Set([...selectedProducts].filter(id => id !== productId)))
      }
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)?`)) return
    
    try {
      await Promise.all(
        Array.from(selectedProducts).map(id =>
          fetch(`/admin/products/${id}`, {
            method: "DELETE",
            credentials: "include"
          })
        )
      )
      
      setProducts(products.filter(p => !selectedProducts.has(p.id)))
      setSelectedProducts(new Set())
    } catch (error) {
      console.error("Error deleting products:", error)
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />
  }

  return (
    <Container className="sencommerce-products">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Heading level="h1">SenCommerce Products</Heading>
          <p className="text-ui-fg-subtle">Manage your product catalog with POD and digital products</p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.size > 0 && (
            <Button 
              onClick={handleBulkDelete}
              variant="danger"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedProducts.size})
            </Button>
          )}
          <Button 
            onClick={() => navigate("create")}
            variant="primary"
          >
            <Plus />
            Create Product
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <Select.Trigger className="w-[140px]">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Types</Select.Item>
            <Select.Item value="pod">POD</Select.Item>
            <Select.Item value="digital">Digital</Select.Item>
            <Select.Item value="standard">Standard</Select.Item>
          </Select.Content>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <Select.Trigger className="w-[140px]">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Status</Select.Item>
            <Select.Item value="published">Published</Select.Item>
            <Select.Item value="draft">Draft</Select.Item>
          </Select.Content>
        </Select>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Text className="text-sm text-gray-600">
            {filteredAndSortedProducts.length} products
          </Text>
        </div>
      </div>

      {/* Pagination Controls Top */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Text className="text-sm">Show:</Text>
          <Select value={String(itemsPerPage)} onValueChange={(v) => {
            setItemsPerPage(Number(v))
            setCurrentPage(1)
          }}>
            <Select.Trigger className="w-[100px]">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="25">25</Select.Item>
              <Select.Item value="50">50</Select.Item>
              <Select.Item value="100">100</Select.Item>
              <Select.Item value="-1">All</Select.Item>
            </Select.Content>
          </Select>
        </div>

        {itemsPerPage !== -1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Text className="text-sm">
              Page {currentPage} of {totalPages}
            </Text>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table className="sencommerce-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="w-12">
                <Checkbox
                  checked={selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </Table.HeaderCell>
              <Table.HeaderCell 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Title
                  <SortIcon field="title" />
                </div>
              </Table.HeaderCell>
              <Table.HeaderCell 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-1">
                  Type
                  <SortIcon field="type" />
                </div>
              </Table.HeaderCell>
              <Table.HeaderCell 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon field="status" />
                </div>
              </Table.HeaderCell>
              <Table.HeaderCell>Price</Table.HeaderCell>
              <Table.HeaderCell>Artwork</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {paginatedProducts?.map((product: ProductDTO) => {
              const typeInfo = getProductTypeInfo(product)
              const artwork = getArtworkForProduct(product)
              
              return (
                <Table.Row key={product.id} className="hover:bg-gray-50">
                  <Table.Cell>
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => handleSelectProduct(product.id)}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {product.thumbnail ? (
                        <img 
                          src={product.thumbnail} 
                          alt={product.title}
                          className="w-10 h-10 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
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
                    <div className="text-sm font-medium text-gray-900">
                      {product.variants && product.variants.length > 0 ? (
                        product.variants.length === 1 ? (
                          // Single variant - show its price
                          (() => {
                            const variant = product.variants[0]
                            const price = variant.calculated_price?.amount || 
                                         variant.prices?.[0]?.amount || 
                                         2000
                            const currency = variant.calculated_price?.currency_code || 
                                           variant.prices?.[0]?.currency_code || 
                                           'EUR'
                            return new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: currency.toUpperCase()
                            }).format(price / 100)
                          })()
                        ) : (
                          // Multiple variants - show price range
                          (() => {
                            const prices = product.variants.map(v => 
                              v.calculated_price?.amount || 
                              v.prices?.[0]?.amount || 
                              2000
                            )
                            const minPrice = Math.min(...prices)
                            const maxPrice = Math.max(...prices)
                            const currency = product.variants[0]?.calculated_price?.currency_code || 
                                           product.variants[0]?.prices?.[0]?.currency_code || 
                                           'EUR'
                            
                            if (minPrice === maxPrice) {
                              return new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: currency.toUpperCase()
                              }).format(minPrice / 100)
                            } else {
                              return `${new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: currency.toUpperCase()
                              }).format(minPrice / 100)} - ${new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: currency.toUpperCase()
                              }).format(maxPrice / 100)}`
                            }
                          })()
                        )
                      ) : (
                        <span className="text-gray-400">No variants</span>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {artwork ? (
                      <div className="flex items-center gap-2">
                        {artwork.image_url ? (
                          <img 
                            src={artwork.image_url}
                            alt={artwork.title}
                            className="w-8 h-8 object-cover rounded border border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm text-gray-600 max-w-[100px] truncate">
                          {artwork.title}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No artwork</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-2">
                      <IconButton
                        onClick={() => {
                          // Navigate to specialized edit page based on product type
                          const fulfillmentType = product.metadata?.fulfillment_type
                          if (fulfillmentType === 'printful_pod') {
                            navigate(`/products/${product.id}/pod-edit`)
                          } else if (fulfillmentType === 'digital') {
                            navigate(`/products/${product.id}`) // TODO: Use digital-edit when created
                          } else if (fulfillmentType === 'service') {
                            navigate(`/products/${product.id}`) // TODO: Use service-edit when created
                          } else {
                            navigate(`/products/${product.id}`)
                          }
                        }}
                        size="small"
                        variant="transparent"
                      >
                        <Edit className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteProduct(product.id)}
                        size="small"
                        variant="transparent"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                      <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                          <IconButton size="small" variant="transparent">
                            <MoreVertical className="w-4 h-4" />
                          </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                          <DropdownMenu.Item onClick={() => {
                            // Navigate to specialized edit page based on product type
                            const fulfillmentType = product.metadata?.fulfillment_type
                            if (fulfillmentType === 'printful_pod') {
                              navigate(`/products/${product.id}/pod-edit`)
                            } else if (fulfillmentType === 'digital') {
                              navigate(`/products/${product.id}`) // TODO: Use digital-edit when created
                            } else if (fulfillmentType === 'service') {
                              navigate(`/products/${product.id}`) // TODO: Use service-edit when created
                            } else {
                              navigate(`/products/${product.id}`)
                            }
                          }}>
                            Edit Product
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onClick={() => navigator.clipboard.writeText(product.id)}>
                            Copy ID
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600"
                          >
                            Delete Product
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </div>

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