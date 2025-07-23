import { defineRouteConfig } from "@medusajs/admin-sdk"
import { RefreshCw, CheckCircle, AlertCircle, Clock, Play, Pause, Database, ArrowRight, Download, Package, Plus } from "lucide-react"
import { useState, useEffect } from "react"

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
}

const ProductSyncPage = () => {
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
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [providerFilter, setProviderFilter] = useState("all")
  const [activeTab, setActiveTab] = useState<"logs" | "products">("products")

  useEffect(() => {
    fetchSyncLogs()
  }, [])

  const fetchSyncLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/product-sync")
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

  const startAction = async (action: string) => {
    setSyncing(true)
    try {
      const response = await fetch("/api/admin/product-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          provider: "printful"
        })
      })
      
      if (!response.ok) {
        throw new Error("Failed to start sync")
      }
      
      // Refresh logs after starting sync
      await fetchSyncLogs()
      
      // Poll for updates
      const interval = setInterval(async () => {
        await fetchSyncLogs()
      }, 2000)
      
      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(interval)
      }, 30000)
      
    } catch (error) {
      console.error("Error starting sync:", error)
    } finally {
      setSyncing(false)
    }
  }

  const startBulkSync = () => startAction("bulk_import")

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
      const response = await fetch("/api/admin/product-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "import_products",
          provider,
          product_ids: productIds
        })
      })
      
      if (!response.ok) {
        throw new Error("Failed to import products")
      }
      
      const result = await response.json()
      alert(`Successfully imported ${result.imported} products. ${result.failed} failed.`)
      
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

  const toggleProductSelection = (productId: string, provider: string) => {
    const key = `${provider}-${productId}`
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(key)) {
      newSelection.delete(key)
    } else {
      newSelection.add(key)
    }
    setSelectedProducts(newSelection)
  }

  const selectAllProducts = (provider: string) => {
    const newSelection = new Set(selectedProducts)
    const products = availableProducts[provider as keyof typeof availableProducts]
    products.forEach(product => {
      if (!product.already_imported) {
        newSelection.add(`${provider}-${product.id}`)
      }
    })
    setSelectedProducts(newSelection)
  }

  const filteredLogs = syncLogs.filter(log => {
    const matchesStatus = statusFilter === "all" || log.status === statusFilter
    const matchesType = typeFilter === "all" || log.sync_type === typeFilter
    const matchesProvider = providerFilter === "all" || log.provider_type === providerFilter
    return matchesStatus && matchesType && matchesProvider
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />
      case "in_progress": return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed": return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "in_progress": return "bg-blue-100 text-blue-800"
      case "success": return "bg-green-100 text-green-800"
      case "failed": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime()
    const endTime = end ? new Date(end).getTime() : Date.now()
    const duration = Math.floor((endTime - startTime) / 1000)
    
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.floor(duration / 60)}m`
    return `${Math.floor(duration / 3600)}h`
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Product Sync</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage product synchronization with POD providers
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchSyncLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={startBulkSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {syncing ? "Starting..." : "Start Bulk Sync"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Syncs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <Database className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.in_progress}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success</p>
              <p className="text-2xl font-semibold text-green-600">{stats.success}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "products"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
          }`}
        >
          Available Products
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "logs"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
          }`}
        >
          Sync Logs
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Printful Products */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold">Printful Products</h2>
                  <span className="text-sm text-gray-500">({availableProducts.printful.length} available)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAllProducts("printful")}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => importSelectedProducts("printful")}
                    disabled={importing || Array.from(selectedProducts).filter(id => id.startsWith("printful-")).length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {importing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Import Selected
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {availableProducts.printful.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No Printful products available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableProducts.printful.map((product) => (
                    <div key={product.id} className={`border rounded-lg p-4 ${product.already_imported ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(`printful-${product.id}`)}
                          onChange={() => toggleProductSelection(product.id, "printful")}
                          disabled={product.already_imported}
                          className="mt-1"
                        />
                        {product.thumbnail_url && (
                          <img
                            src={product.thumbnail_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                          {product.already_imported && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Already Imported
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Digital Products */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Digital Products</h2>
                  <span className="text-sm text-gray-500">({availableProducts.digital.length} available)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAllProducts("digital")}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => importSelectedProducts("digital")}
                    disabled={importing || Array.from(selectedProducts).filter(id => id.startsWith("digital-")).length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {importing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Import Selected
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {availableProducts.digital.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No digital products available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableProducts.digital.map((product) => (
                    <div key={product.id} className={`border rounded-lg p-4 ${product.already_imported ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(`digital-${product.id}`)}
                          onChange={() => toggleProductSelection(product.id, "digital")}
                          disabled={product.already_imported}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                          <div className="mt-2 flex gap-2">
                            {product.file_size && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {Math.round(product.file_size / 1024 / 1024 * 10) / 10} MB
                              </span>
                            )}
                            {product.mime_type && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {product.mime_type}
                              </span>
                            )}
                          </div>
                          {product.already_imported && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Already Imported
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          {/* Sync Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => startBulkSync()}
            disabled={syncing}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Import All Products</div>
              <div className="text-sm text-gray-600">Sync all products from Printful</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => startAction("update_prices")}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Update Prices</div>
              <div className="text-sm text-gray-600">Sync latest pricing from providers</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => startAction("check_inventory")}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Check Inventory</div>
              <div className="text-sm text-gray-600">Verify product availability</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="import">Import</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="bulk_import">Bulk Import</option>
        </select>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Providers</option>
          <option value="printful">Printful</option>
          <option value="gooten">Gooten</option>
        </select>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          {filteredLogs.length} of {syncLogs.length} sync operations
        </div>
      </div>

      {/* Sync Logs */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.product_name || "Bulk Operation"}
                        </div>
                        {log.product_id && (
                          <div className="text-sm text-gray-500">{log.product_id}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {log.sync_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{log.provider_type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getDuration(log.created_at, log.completed_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDate(log.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.error_message ? (
                        <div className="text-red-600" title={log.error_message}>
                          {log.error_message.length > 50 
                            ? `${log.error_message.substring(0, 50)}...`
                            : log.error_message
                          }
                        </div>
                      ) : log.status === "success" ? (
                        <span className="text-green-600">Completed successfully</span>
                      ) : log.status === "in_progress" ? (
                        <span className="text-blue-600">Processing...</span>
                      ) : (
                        <span className="text-gray-500">Waiting to start</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sync operations found</h3>
              <p className="text-gray-600">
                {statusFilter !== "all" || typeFilter !== "all" || providerFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No sync operations have been performed yet"
                }
              </p>
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Product Sync",
  icon: Database,
})

export default ProductSyncPage