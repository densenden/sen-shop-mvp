'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  User, Package, Heart, Settings, LogOut, Download, Eye, Calendar, 
  CreditCard, Truck, MapPin, Phone, Mail, Edit3, Save, X, 
  CheckCircle, Clock, AlertCircle, RefreshCw 
} from 'lucide-react'
import Layout from '../components/Layout'
import { MEDUSA_API_CONFIG, getHeaders } from '../../lib/config'

interface UserData {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  created_at: string
  metadata?: {
    avatar_url?: string
    preferences?: any
  }
}

interface Address {
  id: string
  first_name: string
  last_name: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
  phone?: string
  is_default_shipping?: boolean
  is_default_billing?: boolean
}

interface OrderItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  total: number
  thumbnail?: string
  product_id: string
  variant_id: string
  metadata?: {
    fulfillment_type?: string
    digital_download_url?: string
    artwork_id?: string
  }
}

interface Order {
  id: string
  display_id: number
  status: string
  fulfillment_status: string
  payment_status: string
  total: number
  subtotal: number
  tax_total: number
  shipping_total: number
  currency_code: string
  created_at: string
  updated_at: string
  items: OrderItem[]
  shipping_address?: Address
  billing_address?: Address
  tracking_links?: Array<{
    tracking_number: string
    url?: string
  }>
  payment_sessions?: Array<{
    provider_id: string
    status: string
  }>
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [downloads, setDownloads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'downloads' | 'addresses' | 'favorites' | 'settings'>('overview')
  const [editingProfile, setEditingProfile] = useState(false)
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState({
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    province: '',
    postal_code: '',
    country_code: 'US',
    phone: ''
  })

  // Form state for profile editing
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    setLoading(true)
    try {
      // Check for stored user data
      const storedUser = localStorage.getItem('user')
      const authToken = localStorage.getItem('authToken')
      
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        
        // Use real user data
        const user: UserData = {
          id: userData.id || userData.uid || 'user_' + Date.now(),
          email: userData.email || 'discord@deniskreuzer.dk',
          first_name: userData.first_name || userData.name?.split(' ')[0] || 'Denis',
          last_name: userData.last_name || userData.name?.split(' ').slice(1).join(' ') || 'Kreuzer',
          phone: userData.phone || '',
          created_at: userData.created_at || new Date().toISOString(),
          metadata: userData.metadata || {}
        }
        
        setUser(user)
        setProfileForm({
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone || '',
          email: user.email
        })
        
        // Fetch real orders and other data for this user
        await fetchUserOrders(user.email)
        await fetchAddresses(user.email)
        await fetchDownloads(user.email)
        await fetchFavorites()
        
      } else {
        // No user logged in, redirect to login
        router.push('/login')
        return
      }
      
      // Favorites are already loaded in fetchFavorites()
      
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/auth/me`, {
        headers: {
          ...getHeaders(),
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.customer)
        setProfileForm({
          first_name: data.customer.first_name || '',
          last_name: data.customer.last_name || '',
          phone: data.customer.phone || '',
          email: data.customer.email || ''
        })
      } else {
        throw new Error('Failed to fetch user profile')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchUserOrders = async (email: string) => {
    try {
      console.log(`[Account] Fetching orders for user email: ${email}`)
      
      // Get order IDs from localStorage for this specific user email
      const userOrdersKey = `userOrders_${email}`
      const orderIds = localStorage.getItem(userOrdersKey)
      let userOrderIds: string[] = []
      if (orderIds) {
        userOrderIds = JSON.parse(orderIds)
        console.log(`[Account] Found ${userOrderIds.length} order IDs in localStorage for ${email}:`, userOrderIds)
      }
      
      // Try to fetch orders from the account orders API
      let apiUrl = `${MEDUSA_API_CONFIG.baseUrl}/store/account/orders?customer_email=${encodeURIComponent(email)}`
      if (userOrderIds.length > 0) {
        apiUrl += `&order_ids=${userOrderIds.join(',')}`
      }
      
      const response = await fetch(apiUrl, {
        headers: getHeaders()
      })
      
      let orders: Order[] = []
      
      if (response.ok) {
        const data = await response.json()
        console.log('Orders from API:', data)
        orders = data.orders || []
      } else {
        console.error('Failed to fetch orders from API:', response.status)
      }
      
      // Also try to get orders by ID from localStorage as fallback/supplement
      for (const orderId of userOrderIds) {
        try {
          const detailResponse = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/orders/${orderId}/details`, {
            headers: getHeaders()
          })
          if (detailResponse.ok) {
            const detailData = await detailResponse.json()
            if (detailData.order) {
              // Check if we already have this order from the API call
              const existingOrder = orders.find(o => o.id === orderId)
              if (!existingOrder) {
                console.log(`[Account] Adding order from localStorage: ${orderId}`)
                orders.push(detailData.order)
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch order ${orderId}:`, err)
        }
      }
      
      // Sort by creation date (newest first)
      orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      console.log(`[Account] Final orders count: ${orders.length}`)
      setOrders(orders)
    } catch (error) {
      console.error('Error fetching user orders:', error)
      setOrders([])
    }
  }
  
  const fetchOrders = async (token: string) => {
    try {
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/orders`, {
        headers: {
          ...getHeaders(),
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const fetchAddresses = async (email: string) => {
    try {
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/customers/me/addresses?customer_email=${encodeURIComponent(email)}`, {
        headers: getHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const fetchDownloads = async (email: string) => {
    try {
      // Fetch digital downloads from the dedicated endpoint
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/downloads?customer_email=${encodeURIComponent(email)}`, {
        headers: getHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Account] Downloads fetched:', data.downloads)
        setDownloads(data.downloads || [])
      } else {
        console.error('Failed to fetch downloads:', response.status)
        // Fallback: Try to extract from orders
        const ordersResponse = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/account/orders?customer_email=${encodeURIComponent(email)}`, {
          headers: getHeaders()
        })
        
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          const digitalDownloads: any[] = []
          
          for (const order of ordersData.orders || []) {
            for (const item of order.items || []) {
              if (item.metadata?.fulfillment_type === 'digital_download' || item.metadata?.fulfillment_type === 'digital') {
                const downloadUrl = item.metadata.digital_download_url || 
                  (item.metadata.supabase_url ? item.metadata.supabase_url : '#')
                  
                digitalDownloads.push({
                  order_id: order.id,
                  order_display_id: order.display_id,
                  order_date: order.created_at,
                  product_name: item.title,
                  download_url: downloadUrl,
                  is_expired: false,
                  download_count: 0,
                  max_downloads: -1
                })
              }
            }
          }
          
          setDownloads(digitalDownloads)
        }
      }
    } catch (error) {
      console.error('Error fetching downloads:', error)
    }
  }

  const updateProfile = async () => {
    if (!user) return
    
    setUpdatingProfile(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/customers/me`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.customer)
        setEditingProfile(false)
        alert('Profile updated successfully!')
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setUpdatingProfile(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      // Load favorites from localStorage
      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) {
        const favoriteIds = JSON.parse(savedFavorites)
        setFavorites(favoriteIds)
        
        // Optionally fetch product details for favorites
        if (favoriteIds.length > 0) {
          const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/customers/me/favorites?favorite_ids=${favoriteIds.join(',')}`, {
            headers: getHeaders()
          })
          
          if (response.ok) {
            const data = await response.json()
            // Store favorite products data if needed
            localStorage.setItem('favoriteProducts', JSON.stringify(data.favorites))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  const addAddress = async (addressData: any) => {
    try {
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/customers/me/addresses`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_email: user?.email,
          ...addressData
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Refresh addresses
        if (user) await fetchAddresses(user.email)
        return data.address
      }
    } catch (error) {
      console.error('Error adding address:', error)
      throw error
    }
  }

  const downloadMyData = async () => {
    try {
      if (!user) return
      
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/customers/me/export-data?customer_email=${encodeURIComponent(user.email)}`, {
        headers: getHeaders()
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `my-data-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to download data. Please try again.')
      }
    } catch (error) {
      console.error('Error downloading data:', error)
      alert('Failed to download data. Please try again.')
    }
  }

  const handleLogout = () => {
    // Clear all user-specific data
    const currentUser = localStorage.getItem('user')
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser)
        if (userData.email) {
          // Clear user-specific orders
          localStorage.removeItem(`userOrders_${userData.email}`)
        }
      } catch (e) {
        console.error('Error clearing user data:', e)
      }
    }
    
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    router.push('/')
  }

  const downloadDigitalProduct = async (downloadUrl: string, filename: string) => {
    try {
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(price / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getOrderStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFulfillmentStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    switch (status.toLowerCase()) {
      case 'fulfilled':
        return 'bg-green-100 text-green-800'
      case 'partially_fulfilled':
        return 'bg-yellow-100 text-yellow-800'
      case 'not_fulfilled':
        return 'bg-red-100 text-red-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusIcon = (status: string | undefined) => {
    if (!status) return <RefreshCw className="h-4 w-4 text-gray-600" />
    switch (status.toLowerCase()) {
      case 'captured':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <RefreshCw className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  {user.metadata?.avatar_url ? (
                    <img 
                      src={user.metadata.avatar_url} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${
                    activeTab === 'overview' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Overview</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${
                    activeTab === 'orders' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  <span>Orders ({orders.length})</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('downloads')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${
                    activeTab === 'downloads' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  <span>Downloads ({downloads.length})</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${
                    activeTab === 'addresses' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span>Addresses ({addresses.length})</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${
                    activeTab === 'favorites' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Heart className="h-4 w-4" />
                  <span>Favorites ({favorites.length})</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Account Stats */}
                <div className="bg-white border border-gray-100">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900">Account Overview</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-2xl font-medium text-gray-900">{orders.length}</div>
                        <div className="text-sm text-gray-600">Total Orders</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="text-2xl font-medium text-gray-900">
                          {orders.filter(o => o.status === 'completed').length}
                        </div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Heart className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="text-2xl font-medium text-gray-900">{favorites.length}</div>
                        <div className="text-sm text-gray-600">Favorites</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Calendar className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(user.created_at)}
                        </div>
                        <div className="text-sm text-gray-600">Member Since</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                {orders.length > 0 && (
                  <div className="bg-white border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                            <div>
                              <div className="font-medium text-gray-900">#{order.display_id}</div>
                              <div className="text-sm text-gray-600">{formatDate(order.created_at)}</div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-block px-2 py-1 text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                  {order.status || 'Unknown'}
                                </span>
                                <span className={`inline-block px-2 py-1 text-xs font-medium ${getFulfillmentStatusColor(order.fulfillment_status)}`}>
                                  {order.fulfillment_status || 'Not fulfilled'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {formatPrice(order.total, order.currency_code)}
                              </div>
                              <div className="flex items-center justify-end space-x-1 mt-1">
                                {getPaymentStatusIcon(order.payment_status)}
                                <span className="text-sm text-gray-600 capitalize">
                                  {order.payment_status || 'pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {orders.length > 3 && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => setActiveTab('orders')}
                            className="text-gray-900 hover:text-gray-700 font-medium"
                          >
                            View all orders
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900">Order History</h3>
                </div>
                <div className="p-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-6">Start shopping to see your orders here.</p>
                      <Link
                        href="/"
                        className="bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-100 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                Order #{order.display_id}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Placed on {formatDate(order.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {formatPrice(order.total, order.currency_code)}
                              </div>
                              <div className="flex items-center justify-end space-x-2 mt-1">
                                <span className={`inline-block px-2 py-1 text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                  {order.status || 'Unknown'}
                                </span>
                                <span className={`inline-block px-2 py-1 text-xs font-medium ${getFulfillmentStatusColor(order.fulfillment_status)}`}>
                                  {order.fulfillment_status || 'Not fulfilled'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-3 mb-4">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center space-x-4">
                                {item.thumbnail ? (
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="w-16 h-16 object-cover bg-gray-50"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{item.title}</h5>
                                  <p className="text-sm text-gray-600">
                                    Quantity: {item.quantity} × {formatPrice(item.unit_price, order.currency_code)}
                                  </p>
                                  {item.metadata?.fulfillment_type && (
                                    <span className={`inline-block px-2 py-1 text-xs font-medium mt-1 ${
                                      (item.metadata.fulfillment_type === 'digital_download' || item.metadata.fulfillment_type === 'digital')
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {(item.metadata.fulfillment_type === 'digital_download' || item.metadata.fulfillment_type === 'digital') ? 'Digital' : 'Physical'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-gray-900">
                                    {formatPrice(item.total, order.currency_code)}
                                  </div>
                                  {item.metadata?.fulfillment_type === 'digital_download' && 
                                   item.metadata?.digital_download_url && (
                                    <button
                                      onClick={() => downloadDigitalProduct(
                                        item.metadata!.digital_download_url!,
                                        `${item.title}.zip`
                                      )}
                                      className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-2 py-1 text-xs font-medium hover:bg-blue-100 mt-1"
                                    >
                                      <Download className="h-3 w-3" />
                                      <span>Download</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Order Summary */}
                          <div className="border-t border-gray-100 pt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Subtotal:</span>
                                <div className="font-medium">{formatPrice(order.subtotal, order.currency_code)}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Shipping:</span>
                                <div className="font-medium">{formatPrice(order.shipping_total, order.currency_code)}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Tax:</span>
                                <div className="font-medium">{formatPrice(order.tax_total, order.currency_code)}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Total:</span>
                                <div className="font-medium">{formatPrice(order.total, order.currency_code)}</div>
                              </div>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          {order.shipping_address && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="flex items-start space-x-2 text-sm text-gray-600">
                                <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900">Shipping Address:</div>
                                  <div>
                                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                                  </div>
                                  <div>{order.shipping_address.address_1}</div>
                                  {order.shipping_address.address_2 && (
                                    <div>{order.shipping_address.address_2}</div>
                                  )}
                                  <div>
                                    {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}
                                  </div>
                                  <div>{order.shipping_address.country_code.toUpperCase()}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tracking Information */}
                          {order.tracking_links && order.tracking_links.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">Tracking:</span>
                                <div className="mt-1 space-y-1">
                                  {order.tracking_links.map((link, index) => (
                                    <div key={index}>
                                      {link.url ? (
                                        <a 
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-700"
                                        >
                                          {link.tracking_number}
                                        </a>
                                      ) : (
                                        <span className="text-gray-600">{link.tracking_number}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'downloads' && (
              <div className="bg-white border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900">Digital Downloads</h3>
                </div>
                <div className="p-6">
                  {downloads.length === 0 ? (
                    <div className="text-center py-12">
                      <Download className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No digital downloads yet</h3>
                      <p className="text-gray-600 mb-6">Purchase digital artworks to see your download links here.</p>
                      <Link
                        href="/artworks"
                        className="bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800"
                      >
                        Browse Digital Artworks
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {downloads.map((download, index) => (
                        <div key={index} className="border border-gray-100 p-6 hover:border-gray-200 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium text-gray-900">{download.product_name}</h4>
                                {download.is_expired ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                    Expired
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              
                              {download.product_description && (
                                <p className="text-sm text-gray-600 mb-3">{download.product_description}</p>
                              )}
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Order:</span>
                                  <div>#{download.order_display_id}</div>
                                </div>
                                <div>
                                  <span className="font-medium">Purchased:</span>
                                  <div>{formatDate(download.order_date)}</div>
                                </div>
                                <div>
                                  <span className="font-medium">Downloads:</span>
                                  <div>
                                    {download.download_count} / {download.max_downloads === -1 ? '∞' : download.max_downloads}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium">Expires:</span>
                                  <div>
                                    {download.expires_at ? formatDate(download.expires_at) : 'Never'}
                                  </div>
                                </div>
                              </div>
                              
                              {download.file_size && (
                                <div className="mt-2 text-sm text-gray-600">
                                  File size: {(download.file_size / (1024 * 1024)).toFixed(1)} MB
                                </div>
                              )}
                            </div>
                            
                            <div className="ml-6">
                              {download.is_expired ? (
                                <div className="text-center">
                                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                                  <p className="text-xs text-red-600">Link expired</p>
                                </div>
                              ) : (
                                <a
                                  href={download.download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex flex-col items-center space-y-2 bg-gray-900 text-white px-4 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                                >
                                  <Download className="h-5 w-5" />
                                  <span>Download</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Saved Addresses</h3>
                    {!showAddressForm && (
                      <button 
                        onClick={() => {
                          setShowAddressForm(true)
                          setEditingAddress(null)
                          setAddressForm({
                            first_name: user?.first_name || '',
                            last_name: user?.last_name || '',
                            company: '',
                            address_1: '',
                            address_2: '',
                            city: '',
                            province: '',
                            postal_code: '',
                            country_code: 'US',
                            phone: user?.phone || ''
                          })
                        }}
                        className="bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">
                        Add Address
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {showAddressForm && (
                    <div className="border border-gray-200 p-6 mb-6">
                      <h4 className="font-medium text-gray-900 mb-4">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                          <input
                            type="text"
                            value={addressForm.first_name}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, first_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                          <input
                            type="text"
                            value={addressForm.last_name}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, last_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                          <input
                            type="text"
                            value={addressForm.company}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, company: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                          <input
                            type="text"
                            value={addressForm.address_1}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, address_1: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                          <input
                            type="text"
                            value={addressForm.address_2}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, address_2: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                          <input
                            type="text"
                            value={addressForm.province}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, province: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                          <input
                            type="text"
                            value={addressForm.postal_code}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country Code *</label>
                          <select
                            value={addressForm.country_code}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, country_code: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                            required
                          >
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="GB">United Kingdom</option>
                            <option value="DE">Germany</option>
                            <option value="FR">France</option>
                            <option value="ES">Spain</option>
                            <option value="IT">Italy</option>
                            <option value="AU">Australia</option>
                            <option value="JP">Japan</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-3 mt-6">
                        <button
                          onClick={async () => {
                            if (addressForm.first_name && addressForm.last_name && 
                                addressForm.address_1 && addressForm.city && 
                                addressForm.postal_code) {
                              try {
                                await addAddress(addressForm)
                                setShowAddressForm(false)
                                setEditingAddress(null)
                                if (user) await fetchAddresses(user.email)
                              } catch (error) {
                                console.error('Failed to add address:', error)
                              }
                            }
                          }}
                          className="bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800"
                        >
                          {editingAddress ? 'Update Address' : 'Save Address'}
                        </button>
                        <button
                          onClick={() => {
                            setShowAddressForm(false)
                            setEditingAddress(null)
                          }}
                          className="border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {addresses.length === 0 && !showAddressForm ? (
                    <div className="text-center py-12">
                      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
                      <p className="text-gray-600 mb-6">Add an address to make checkout faster.</p>
                      <button 
                        onClick={() => {
                          setShowAddressForm(true)
                          setEditingAddress(null)
                          setAddressForm({
                            first_name: user?.first_name || '',
                            last_name: user?.last_name || '',
                            company: '',
                            address_1: '',
                            address_2: '',
                            city: '',
                            province: '',
                            postal_code: '',
                            country_code: 'US',
                            phone: user?.phone || ''
                          })
                        }}
                        className="bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800">
                        Add Address
                      </button>
                    </div>
                  ) : addresses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {addresses.map((address) => (
                        <div key={address.id} className="border border-gray-100 p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-medium text-gray-900">
                                {address.first_name} {address.last_name}
                              </div>
                              {address.company && (
                                <div className="text-sm text-gray-600">{address.company}</div>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              {address.is_default_shipping && (
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                                  Default Shipping
                                </span>
                              )}
                              {address.is_default_billing && (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                                  Default Billing
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>{address.address_1}</div>
                            {address.address_2 && <div>{address.address_2}</div>}
                            <div>
                              {address.city}, {address.province} {address.postal_code}
                            </div>
                            <div>{address.country_code.toUpperCase()}</div>
                            {address.phone && (
                              <div className="flex items-center space-x-1 mt-2">
                                <Phone className="h-3 w-3" />
                                <span>{address.phone}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2 mt-4">
                            <button 
                              onClick={() => {
                                setEditingAddress(address)
                                setAddressForm({
                                  first_name: address.first_name,
                                  last_name: address.last_name,
                                  company: address.company || '',
                                  address_1: address.address_1,
                                  address_2: address.address_2 || '',
                                  city: address.city,
                                  province: address.province || '',
                                  postal_code: address.postal_code,
                                  country_code: address.country_code,
                                  phone: address.phone || ''
                                })
                                setShowAddressForm(true)
                              }}
                              className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="bg-white border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900">Favorite Items</h3>
                </div>
                <div className="p-6">
                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                      <p className="text-gray-600 mb-6">Heart items you love to keep track of them here.</p>
                      <Link
                        href="/artworks"
                        className="bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800"
                      >
                        Browse Artworks
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-red-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        You have {favorites.length} favorite items. Visit the artworks page to see them with full details.
                      </p>
                      <Link
                        href="/artworks"
                        className="mt-4 inline-block bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800"
                      >
                        View Favorites
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Profile Information */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Personal Information</h4>
                        {!editingProfile && (
                          <button
                            onClick={() => setEditingProfile(true)}
                            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                          >
                            <Edit3 className="h-4 w-4" />
                            <span className="text-sm">Edit</span>
                          </button>
                        )}
                      </div>
                      
                      {editingProfile ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name
                              </label>
                              <input
                                type="text"
                                value={profileForm.first_name}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name
                              </label>
                              <input
                                type="text"
                                value={profileForm.last_name}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                            />
                          </div>
                          
                          <div className="flex space-x-3 pt-4">
                            <button
                              onClick={updateProfile}
                              disabled={updatingProfile}
                              className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                              <span>{updatingProfile ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingProfile(false)
                                setProfileForm({
                                  first_name: user.first_name || '',
                                  last_name: user.last_name || '',
                                  phone: user.phone || '',
                                  email: user.email || ''
                                })
                              }}
                              className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                            >
                              <X className="h-4 w-4" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-50 text-gray-700 text-sm">
                              {user.first_name || 'Not provided'}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-50 text-gray-700 text-sm">
                              {user.last_name || 'Not provided'}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-50 text-gray-700 text-sm">
                              {user.email}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-50 text-gray-700 text-sm">
                              {user.phone || 'Not provided'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Account Actions */}
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Account Actions</h4>
                      <div className="space-y-3">
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm">
                          <span>Change Password</span>
                        </button>
                        <button 
                          onClick={downloadMyData}
                          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm">
                          <span>Download My Data</span>
                        </button>
                        <button className="flex items-center space-x-2 text-red-600 hover:text-red-700 text-sm">
                          <span>Delete Account</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}