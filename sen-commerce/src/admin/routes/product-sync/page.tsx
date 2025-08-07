import { defineRouteConfig } from "@medusajs/admin-sdk"
import { RefreshCw, CheckCircle, AlertCircle, Clock, Play, Database, Download, Package, Plus, Search, Filter, ChevronUp, ChevronDown, Edit, ExternalLink } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Container, Table, Button, Badge, Heading, Input, Select, Checkbox, IconButton, Text } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"

interface SyncLog {
  id: string
  product_id?: string
  product_name?: string
  sync_type: string
  status: string
  provider_type: string
  error_message?: string
  sync_data?: any
  created_at: string
  completed_at?: string
}

interface SyncStats {
  total: number
  pending: number
  success: number
  failed: number
  in_progress: number
}

interface AvailableProduct {
  id: string
  name: string
  description?: string
  thumbnail_url?: string
  file_size?: number
  mime_type?: string
  status: string
  provider: string
  already_imported: boolean
  medusa_product_id?: string | null
  product_type?: string
}

const ProductSyncPage = () => {
  const navigate = useNavigate()
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [stats, setStats] = useState<SyncStats>({
    total: 0,
    pending: 0,
    success: 0,
    failed: 0,
    in_progress: 0
  })
  const [availableProducts, setAvailableProducts] = useState<{
    printful: AvailableProduct[]
    digital: AvailableProduct[]
  }>({ printful: [], digital: [] })
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [activeTab, setActiveTab] = useState<"products" | "logs">("products")
  
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState("")
  const [providerFilter, setProviderFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    fetchSyncLogs()
  }, [])

  const fetchSyncLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/admin/product-sync", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      setSyncLogs(data.logs || [])
      setStats(data.stats || { total: 0, pending: 0, success: 0, failed: 0, in_progress: 0 })
      setAvailableProducts(data.available_products || { printful: [], digital: [] })
    } catch (error) {
      console.error("Error fetching sync data:", error)
    } finally {
      setLoading(false)
    }
  }

  const importSingleProduct = async (provider: string, productId: string) => {
    setImporting(true)
    try {
      const response = await fetch("/admin/product-sync", {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "import_products",
          provider,
          product_ids: [productId]
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.failed > 0) {
        const errorDetails = result.errors.map((e: { productId: string; error: string }) => `Product ID: ${e.productId}, Error: ${e.error}`).join("\n")
        alert(`Failed to import product.\n\nErrors:\n${errorDetails}`)
      } else {
        alert(`Successfully imported product!`)
      }
      
      // Refresh data
      await fetchSyncLogs()
      
    } catch (error) {
      console.error("Error importing product:", error)
      alert("Failed to import product")
    } finally {
      setImporting(false)
    }
  }

  const importSelectedProducts = async (provider: string) => {
    const productIds = Array.from(selectedProducts).filter(id => {
      const product = [...availableProducts.printful, ...availableProducts.digital].find(p => `${p.provider}-${p.id}` === id)
      return product?.provider === provider
    }).map(id => id.split('-')[1])

    if (productIds.length === 0) {
      alert(`No ${provider} products selected`)
      return
    }

    setImporting(true)
    try {
      const response = await fetch("/admin/product-sync", {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "import_products",
          provider,
          product_ids: productIds
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.failed > 0) {
        const errorDetails = result.errors.map((e: { productId: string; error: string }) => `Product ID: ${e.productId}, Error: ${e.error}`).join("\n")
        alert(`Successfully imported ${result.imported} products. ${result.failed} failed.\n\nErrors:\n${errorDetails}`)
      } else {
        alert(`Successfully imported ${result.imported} products.`)
      }
      
      // Clear selection and refresh data
      setSelectedProducts(new Set())
      await fetchSyncLogs()
      
    } catch (error) {
      console.error("Error importing products:", error)
      alert("Failed to import products")
    } finally {
      setImporting(false)
    }
  }

  // Combine all products for filtering and sorting
  const allProducts = useMemo(() => {
    return [...availableProducts.printful, ...availableProducts.digital].map(product => ({
      ...product,
      key: `${product.provider}-${product.id}`
    }))
  }, [availableProducts])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...allProducts]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Provider filter
    if (providerFilter !== "all") {
      filtered = filtered.filter(p => p.provider === providerFilter)
    }

    // Status filter
    if (statusFilter === "imported") {
      filtered = filtered.filter(p => p.already_imported)
    } else if (statusFilter === "available") {
      filtered = filtered.filter(p => !p.already_imported)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'provider':
          aValue = a.provider || ''
          bValue = b.provider || ''
          break
        case 'status':
          aValue = a.already_imported ? 'imported' : 'available'
          bValue = b.already_imported ? 'imported' : 'available'
          break
        default:
          aValue = a.name || ''
          bValue = b.name || ''
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [allProducts, searchTerm, providerFilter, statusFilter, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleProductSelection = (productKey: string, product: AvailableProduct) => {
    if (product.already_imported) return
    
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(productKey)) {
      newSelection.delete(productKey)
    } else {
      newSelection.add(productKey)
    }
    setSelectedProducts(newSelection)
  }

  const handleSelectAll = () => {
    const availableProductKeys = filteredAndSortedProducts
      .filter(p => !p.already_imported)
      .map(p => p.key)
    
    if (selectedProducts.size === availableProductKeys.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(availableProductKeys))
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'printful':
        return <Package className="w-4 h-4" />
      case 'digital':
        return <Download className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'printful':
        return 'bg-green-100 text-green-800'
      case 'digital':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Container className="sencommerce-sync">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Heading level="h1">Product Sync</Heading>
          <p className="text-ui-fg-subtle">Manage product synchronization with POD providers and digital products</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchSyncLogs}
            variant="secondary"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {selectedProducts.size > 0 && (
            <>
              <Button 
                onClick={() => importSelectedProducts("printful")}
                disabled={importing || Array.from(selectedProducts).filter(id => id.startsWith("printful-")).length === 0}
                variant="primary"
                className="flex items-center gap-2"
              >
                {importing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Import POD ({Array.from(selectedProducts).filter(id => id.startsWith("printful-")).length})
              </Button>
              <Button 
                onClick={() => importSelectedProducts("digital")}
                disabled={importing || Array.from(selectedProducts).filter(id => id.startsWith("digital-")).length === 0}
                variant="primary"
                className="flex items-center gap-2"
              >
                {importing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Import Digital ({Array.from(selectedProducts).filter(id => id.startsWith("digital-")).length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-semibold text-gray-900">
                {allProducts.filter(p => !p.already_imported).length}
              </p>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Imported</p>
              <p className="text-2xl font-semibold text-green-600">
                {allProducts.filter(p => p.already_imported).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">POD Products</p>
              <p className="text-2xl font-semibold text-green-600">{availableProducts.printful.length}</p>
            </div>
            <Package className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Digital Products</p>
              <p className="text-2xl font-semibold text-blue-600">{availableProducts.digital.length}</p>
            </div>
            <Download className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Selected</p>
              <p className="text-2xl font-semibold text-blue-600">{selectedProducts.size}</p>
            </div>
            <Checkbox className="w-8 h-8 text-blue-400" />
          </div>
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
        
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <Select.Trigger className="w-[140px]">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Providers</Select.Item>
            <Select.Item value="printful">Printful POD</Select.Item>
            <Select.Item value="digital">Digital</Select.Item>
          </Select.Content>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <Select.Trigger className="w-[140px]">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Status</Select.Item>
            <Select.Item value="available">Available</Select.Item>
            <Select.Item value="imported">Already Imported</Select.Item>
          </Select.Content>
        </Select>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Text className="text-sm text-gray-600">
            {filteredAndSortedProducts.length} products
          </Text>
        </div>
      </div>

      {/* Products Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table className="sencommerce-sync-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="w-12">
                <Checkbox
                  checked={
                    selectedProducts.size === filteredAndSortedProducts.filter(p => !p.already_imported).length &&
                    filteredAndSortedProducts.filter(p => !p.already_imported).length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </Table.HeaderCell>
              <Table.HeaderCell 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Product
                  <SortIcon field="name" />
                </div>
              </Table.HeaderCell>
              <Table.HeaderCell 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('provider')}
              >
                <div className="flex items-center gap-1">
                  Provider
                  <SortIcon field="provider" />
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
              <Table.HeaderCell>Details</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredAndSortedProducts.map((product) => (
              <Table.Row key={product.key} className={`hover:bg-gray-50 ${product.already_imported ? 'bg-gray-25' : ''}`}>
                <Table.Cell>
                  <Checkbox
                    checked={selectedProducts.has(product.key)}
                    onCheckedChange={() => toggleProductSelection(product.key, product)}
                    disabled={product.already_imported}
                  />
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {product.thumbnail_url ? (
                      <img 
                        src={product.thumbnail_url} 
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        {getProviderIcon(product.provider)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">
                        {product.description}
                      </div>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="small" className={`inline-flex items-center gap-1 ${getProviderColor(product.provider)}`}>
                    {getProviderIcon(product.provider)}
                    {product.provider.charAt(0).toUpperCase() + product.provider.slice(1)}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {product.already_imported ? (
                    <Badge size="small" className="bg-green-100 text-green-800">
                      Imported
                    </Badge>
                  ) : (
                    <Badge size="small" className="bg-blue-100 text-blue-800">
                      Available
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <div className="text-sm text-gray-600">
                    {product.provider === 'digital' && product.file_size && (
                      <div>Size: {Math.round(product.file_size / 1024 / 1024 * 10) / 10} MB</div>
                    )}
                    {product.provider === 'digital' && product.mime_type && (
                      <div>Type: {product.mime_type}</div>
                    )}
                    {product.provider === 'printful' && product.product_type && (
                      <div>Type: {product.product_type}</div>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end gap-2">
                    {product.already_imported && product.medusa_product_id ? (
                      <IconButton
                        onClick={() => navigate(`/products/${product.medusa_product_id}/edit`)}
                        size="small"
                        variant="transparent"
                        title="Edit in Medusa"
                      >
                        <Edit className="w-4 h-4" />
                      </IconButton>
                    ) : (
                      <IconButton
                        onClick={() => importSingleProduct(product.provider, product.id)}
                        size="small"
                        variant="transparent"
                        title="Import this product"
                        disabled={importing}
                      >
                        <Plus className="w-4 h-4" />
                      </IconButton>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {filteredAndSortedProducts.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Product Sync",
  icon: Database,
})

export default ProductSyncPage