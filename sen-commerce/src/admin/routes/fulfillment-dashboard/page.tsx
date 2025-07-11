import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Truck, Package, Clock, CheckCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

interface FulfillmentOrder {
  id: string
  medusa_order_id: string
  printful_order_id: string
  provider_type: string
  status: string
  tracking_number?: string
  tracking_url?: string
  shipped_at?: string
  delivered_at?: string
  estimated_delivery?: string
  customer_email?: string
  customer_name?: string
  total_amount?: number
  currency?: string
  created_at: string
  updated_at: string
}

interface StatusStats {
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  total: number
}

const FulfillmentDashboardPage = () => {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([])
  const [stats, setStats] = useState<StatusStats>({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [providerFilter, setProviderFilter] = useState("all")

  useEffect(() => {
    fetchFulfillmentOrders()
  }, [])

  const fetchFulfillmentOrders = async () => {
    try {
      setLoading(true)
      // Mock data for demonstration
      const mockOrders: FulfillmentOrder[] = [
        {
          id: "fo_1",
          medusa_order_id: "order_123",
          printful_order_id: "pf_456",
          provider_type: "printful",
          status: "processing",
          customer_email: "customer@example.com",
          customer_name: "John Doe",
          total_amount: 29.99,
          currency: "USD",
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "fo_2",
          medusa_order_id: "order_124",
          printful_order_id: "pf_457",
          provider_type: "printful",
          status: "shipped",
          tracking_number: "1Z999AA1234567890",
          tracking_url: "https://www.ups.com/track?tracknum=1Z999AA1234567890",
          shipped_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          customer_email: "jane@example.com",
          customer_name: "Jane Smith",
          total_amount: 45.50,
          currency: "USD",
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "fo_3",
          medusa_order_id: "order_125",
          printful_order_id: "pf_458",
          provider_type: "printful",
          status: "delivered",
          tracking_number: "1Z999AA1234567891",
          tracking_url: "https://www.ups.com/track?tracknum=1Z999AA1234567891",
          shipped_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          delivered_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          customer_email: "mike@example.com",
          customer_name: "Mike Johnson",
          total_amount: 22.99,
          currency: "USD",
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      setOrders(mockOrders)
      
      // Calculate stats
      const newStats = mockOrders.reduce((acc, order) => {
        acc[order.status as keyof StatusStats] = (acc[order.status as keyof StatusStats] || 0) + 1
        acc.total += 1
        return acc
      }, { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, total: 0 })
      
      setStats(newStats)
    } catch (error) {
      console.error("Error fetching fulfillment orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesProvider = providerFilter === "all" || order.provider_type === providerFilter
    return matchesStatus && matchesProvider
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />
      case "processing": return <Package className="w-4 h-4 text-blue-500" />
      case "shipped": return <Truck className="w-4 h-4 text-purple-500" />
      case "delivered": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "cancelled": return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "processing": return "bg-blue-100 text-blue-800"
      case "shipped": return "bg-purple-100 text-purple-800"
      case "delivered": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getEstimatedDelivery = (order: FulfillmentOrder) => {
    if (order.delivered_at) {
      return `Delivered ${formatDate(order.delivered_at)}`
    }
    if (order.estimated_delivery) {
      return `Est. ${formatDate(order.estimated_delivery)}`
    }
    return "No estimate"
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fulfillment Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track and manage print-on-demand order fulfillment
          </p>
        </div>
        <button
          onClick={fetchFulfillmentOrders}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
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
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.processing}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Shipped</p>
              <p className="text-2xl font-semibold text-purple-600">{stats.shipped}</p>
            </div>
            <Truck className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-semibold text-green-600">{stats.delivered}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-semibold text-red-600">{stats.cancelled}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
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
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
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
          {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Orders Table */}
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
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.medusa_order_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.provider_type} • {order.printful_order_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.tracking_number ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.tracking_number}
                          </div>
                          {order.tracking_url && (
                            <a
                              href={order.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                              Track Package
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No tracking</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getEstimatedDelivery(order)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${order.total_amount?.toFixed(2)} {order.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/admin/orders/${order.medusa_order_id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {statusFilter !== "all" || providerFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No fulfillment orders yet"
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Fulfillment",
  icon: Truck,
})

export default FulfillmentDashboardPage