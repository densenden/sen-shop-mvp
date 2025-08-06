import {
  Button,
  Section,
  Text,
  Heading,
  Link,
  Hr
} from '@react-email/components'
import BaseEmailLayout from './components/BaseLayout'
import SenCommerceSignature from './components/SenCommerceSignature'

interface OrderUpdateEmailProps {
  customerName: string
  orderId: string
  orderNumber: string
  updateType: 'shipped' | 'in_production' | 'delayed' | 'completed'
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: string
  updateMessage?: string
  storeUrl?: string
}

export const OrderUpdateEmail = ({
  customerName = 'John Doe',
  orderId = 'order_123',
  orderNumber = '#SC-2024-001',
  updateType = 'shipped',
  trackingNumber,
  trackingUrl,
  estimatedDelivery,
  updateMessage,
  storeUrl = 'https://shop.sen.studio'
}: OrderUpdateEmailProps) => {

  const getUpdateTitle = () => {
    switch (updateType) {
      case 'shipped':
        return 'Order Shipped'
      case 'in_production':
        return 'Order in Production'
      case 'delayed':
        return 'Order Update'
      case 'completed':
        return 'Order Delivered'
      default:
        return 'Order Update'
    }
  }

  const getUpdateEmoji = () => {
    switch (updateType) {
      case 'shipped':
        return '📦'
      case 'in_production':
        return '🏭'
      case 'delayed':
        return '⏰'
      case 'completed':
        return '✅'
      default:
        return '📋'
    }
  }

  const getDefaultMessage = () => {
    switch (updateType) {
      case 'shipped':
        return 'Great news! Your order has been shipped and is on its way to you.'
      case 'in_production':
        return 'Your order is currently being produced by our print-on-demand partner.'
      case 'delayed':
        return 'We wanted to keep you informed about a slight delay with your order.'
      case 'completed':
        return 'Wonderful! Your order has been successfully delivered.'
      default:
        return 'We have an update regarding your order.'
    }
  }

  return (
    <BaseEmailLayout
      previewText={`${getUpdateTitle()} - Order ${orderNumber}`}
      title={getUpdateTitle()}
    >
      {/* Content */}
      <Section style={{ marginBottom: '40px' }}>
        <Text style={{
          color: '#374151',
          margin: '0 0 20px 0',
          fontFamily: "'Inter', sans-serif"
        }}>
          Hi {customerName},
        </Text>
        
        <Text style={{
          color: '#374151',
          margin: '0 0 30px 0',
          fontFamily: "'Inter', sans-serif"
        }}>
          {updateMessage || getDefaultMessage()}
        </Text>
        
        <Hr style={{
          border: 'none',
          borderTop: '1px solid #e5e7eb',
          margin: '30px 0'
        }} />
        
        <Heading style={{
          color: '#1f2937',
          fontSize: '18px',
          fontWeight: '500',
          margin: '30px 0 20px 0',
          fontFamily: "'Inter', sans-serif"
        }}>
          {getUpdateEmoji()} Order Details
        </Heading>
        
        <Text style={{
          color: '#374151',
          margin: '5px 0',
          fontFamily: "'Inter', sans-serif"
        }}>
          <strong>Order Number:</strong> {orderNumber}
        </Text>
        
        <Text style={{
          color: '#374151',
          margin: '5px 0',
          fontFamily: "'Inter', sans-serif"
        }}>
          <strong>Status:</strong> {getUpdateTitle()}
        </Text>
        
        {trackingNumber && (
          <Text style={{
            color: '#374151',
            margin: '5px 0',
            fontFamily: "'Inter', sans-serif"
          }}>
            <strong>Tracking Number:</strong> {trackingNumber}
          </Text>
        )}
        
        {estimatedDelivery && (
          <Text style={{
            color: '#374151',
            margin: '5px 0',
            fontFamily: "'Inter', sans-serif"
          }}>
            <strong>Estimated Delivery:</strong> {estimatedDelivery}
          </Text>
        )}
        
        {updateType === 'shipped' && (
          <>
            <Hr style={{
              border: 'none',
              borderTop: '1px solid #e5e7eb',
              margin: '30px 0'
            }} />
            
            <Heading style={{
              color: '#1f2937',
              fontSize: '18px',
              fontWeight: '500',
              margin: '30px 0 20px 0',
              fontFamily: "'Inter', sans-serif"
            }}>
              What's Next?
            </Heading>
            
            <Text style={{
              color: '#374151',
              margin: '8px 0',
              fontFamily: "'Inter', sans-serif"
            }}>
              • Your package is on its way to your delivery address
            </Text>
            <Text style={{
              color: '#374151',
              margin: '8px 0',
              fontFamily: "'Inter', sans-serif"
            }}>
              • You can track your shipment using the tracking information above
            </Text>
            <Text style={{
              color: '#374151',
              margin: '8px 0',
              fontFamily: "'Inter', sans-serif"
            }}>
              • We'll send you another update when your package is delivered
            </Text>
          </>
        )}
        
        <Text style={{
          color: '#374151',
          margin: '30px 0',
          fontFamily: "'Inter', sans-serif"
        }}>
          Questions? Feel free to contact us at <Link 
            href="mailto:shop@sen.studio" 
            style={{
              color: '#374151',
              textDecoration: 'underline'
            }}
          >
            shop@sen.studio
          </Link>
        </Text>
      </Section>

      {/* Action Buttons */}
      <Section style={{
        textAlign: 'center',
        margin: '60px 0 40px 0'
      }}>
        <Text style={{
          color: '#9ca3af',
          fontSize: '14px',
          margin: '0 0 20px 0',
          fontFamily: "'Inter', sans-serif"
        }}>
          {trackingUrl ? 'Track your shipment or view order details' : 'View your order details'}
        </Text>
        
        <div style={{ display: 'inline-block', marginRight: trackingUrl ? '15px' : '0' }}>
          <Button
            href={`${storeUrl}/account/orders/${orderId}`}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              padding: '16px 32px',
              textDecoration: 'none',
              fontWeight: '500',
              fontFamily: "'Inter', sans-serif",
              display: 'inline-block'
            }}
          >
            View Order
          </Button>
        </div>
        
        {trackingUrl && (
          <div style={{ display: 'inline-block' }}>
            <Button
              href={trackingUrl}
              style={{
                backgroundColor: '#6b7280',
                color: '#ffffff',
                padding: '16px 32px',
                textDecoration: 'none',
                fontWeight: '500',
                fontFamily: "'Inter', sans-serif",
                display: 'inline-block'
              }}
            >
              Track Package
            </Button>
          </div>
        )}
      </Section>

      {/* Signature */}
      <SenCommerceSignature />
    </BaseEmailLayout>
  )
}

export default OrderUpdateEmail