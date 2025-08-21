import { useState, useEffect } from "react"
import { Container, Heading, Table } from "@medusajs/ui"

interface Order {
  id: string
  display_id: number
  status: string
  created_at: string
  updated_at: string
  email: string
  total: number
  currency_code: string
  payment_status: string
  fulfillment_status: string
}

const OrdersCustomPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      console.log("Fetching orders from frontend...")
      const response = await fetch("/admin/orders")
      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)
      setOrders(data.orders || [])
      console.log("Orders set:", data.orders?.length || 0)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    // Format in local timezone (Central European Time)
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Berlin' // Adjust to your timezone
    }).format(date)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount / 100)
  }

  if (loading) {
    return <div>Loading orders...</div>
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h1">Orders ({orders.length})</Heading>
      </div>
      
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Order #</Table.HeaderCell>
            <Table.HeaderCell>Customer</Table.HeaderCell>
            <Table.HeaderCell>Date & Time</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Payment</Table.HeaderCell>
            <Table.HeaderCell>Fulfillment</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {orders.map((order) => (
            <Table.Row key={order.id}>
              <Table.Cell className="font-medium">
                #{order.display_id}
              </Table.Cell>
              <Table.Cell>{order.email}</Table.Cell>
              <Table.Cell className="font-mono">
                {formatDateTime(order.created_at)}
              </Table.Cell>
              <Table.Cell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.payment_status === 'captured' ? 'bg-green-100 text-green-800' :
                  order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.payment_status}
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.fulfillment_status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                  order.fulfillment_status === 'not_fulfilled' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.fulfillment_status}
                </span>
              </Table.Cell>
              <Table.Cell className="text-right font-medium">
                {formatCurrency(order.total, order.currency_code)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      
      {orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}
    </Container>
  )
}

export default OrdersCustomPage