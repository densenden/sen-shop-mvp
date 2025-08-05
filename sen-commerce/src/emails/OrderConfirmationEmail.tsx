import { Section, Text, Row, Column, Hr, Heading, Link, Img } from '@react-email/components'
import { EmailLayout } from './components/Layout'
import { Button } from './components/Button'

interface OrderItem {
  title: string
  quantity: number
  unitPrice: number
  fulfillmentType?: string
}

interface OrderConfirmationEmailProps {
  customerName: string
  orderId: string
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  currencyCode: string
  storeUrl?: string
}

export const OrderConfirmationEmail = ({
  customerName,
  orderId,
  orderNumber,
  items,
  totalAmount,
  currencyCode,
  storeUrl = 'https://shop.sen.studio'
}: OrderConfirmationEmailProps) => {
  const formatPrice = (price: number) => `$${(price / 100).toFixed(2)}`
  const hasDigitalProducts = items.some(item => item.fulfillmentType === 'digital')
  const hasPrintProducts = items.some(item => item.fulfillmentType === 'printful_pod')

  return (
    <EmailLayout preview={`Order confirmation #${orderNumber}`}>
      <Section className="px-8 py-6">
        {/* Success Header */}
        <Section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 text-center mb-8 border border-green-200">
          <Text className="text-4xl m-0 mb-2">✅</Text>
          <Heading className="text-2xl font-semibold text-green-700 m-0 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Order Confirmed!</Heading>
          <Heading as="h2" className="text-lg font-medium text-green-600 m-0" style={{ fontFamily: 'Inter, sans-serif' }}>Thank you, {customerName}</Heading>
        </Section>
        
        <Text className="text-base text-gray-700 leading-relaxed m-0 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
          Your order has been confirmed and is being processed. Here are your order details:
        </Text>
        
        {/* Order Details Card */}
        <Section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
          {/* Order Header */}
          <Section className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <Row>
              <Column>
                <Heading as="h2" className="text-lg font-semibold text-gray-900 m-0" style={{ fontFamily: 'Inter, sans-serif' }}>Order #{orderNumber}</Heading>
              </Column>
              <Column className="text-right">
                <Text className="text-sm text-gray-500 m-0" style={{ fontFamily: 'Inter, sans-serif' }}>{new Date().toLocaleDateString()}</Text>
              </Column>
            </Row>
          </Section>
          
          {/* Order Items */}
          <Section className="px-6 py-4">
            {items.map((item, index) => (
              <div key={index}>
                <Row className="py-4">
                  <Column className="w-16 pr-4">
                    <Img
                      src={item.fulfillmentType === 'digital' 
                        ? 'https://dltvkqzxlwxbtgiofkds.supabase.co/storage/v1/object/public/artwork-images/digital-art-thumb.jpg'
                        : 'https://dltvkqzxlwxbtgiofkds.supabase.co/storage/v1/object/public/artwork-images/print-product-thumb.jpg'
                      }
                      alt={item.title}
                      width="56"
                      height="56"
                      className="rounded-lg border border-gray-200 shadow-sm"
                    />
                  </Column>
                  <Column className="flex-1 pr-4">
                    <Text className="text-base font-semibold text-gray-900 m-0 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{item.title}</Text>
                    <Row>
                      <Column>
                        <Text className="text-sm text-gray-600 m-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {item.fulfillmentType === 'digital' && '📱 Digital Download'}
                          {item.fulfillmentType === 'printful_pod' && '🖨️ Print-on-Demand'}
                          {!item.fulfillmentType && '📦 Product'}
                        </Text>
                      </Column>
                      <Column className="text-right">
                        <Text className="text-sm text-gray-500 m-0" style={{ fontFamily: 'Inter, sans-serif' }}>Qty: {item.quantity}</Text>
                      </Column>
                    </Row>
                  </Column>
                  <Column className="text-right w-20">
                    <Text className="text-base font-bold text-gray-900 m-0" style={{ fontFamily: 'Inter, sans-serif' }}>{formatPrice(item.unitPrice * item.quantity)}</Text>
                  </Column>
                </Row>
                {index < items.length - 1 && <Hr className="border-gray-100 my-0" />}
              </div>
            ))}
          </Section>
          
          {/* Order Total */}
          <Section className="bg-gray-900 px-6 py-4">
            <Row>
              <Column>
                <Text className="text-lg font-semibold text-white m-0" style={{ fontFamily: 'Inter, sans-serif' }}>Total</Text>
              </Column>
              <Column className="text-right">
                <Text className="text-xl font-bold text-white m-0" style={{ fontFamily: 'Inter, sans-serif' }}>{formatPrice(totalAmount)} {currencyCode.toUpperCase()}</Text>
              </Column>
            </Row>
          </Section>
        </Section>
        
        {hasDigitalProducts && (
          <Section className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
            <Text className="text-base font-semibold text-blue-800 m-0 mb-2">📱 Digital Products</Text>
            <Text className="text-sm text-blue-700 m-0">
              Your digital products will be available for download shortly. You'll receive a separate email with secure download links.
            </Text>
          </Section>
        )}
        
        {hasPrintProducts && (
          <Section className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
            <Text className="text-base font-semibold text-green-800 m-0 mb-2">🖨️ Print-on-Demand Items</Text>
            <Text className="text-sm text-green-700 m-0">
              Your print-on-demand items will be processed and shipped within 2-3 business days. You'll receive tracking information once shipped.
            </Text>
          </Section>
        )}
        
        <Section className="text-center mb-8">
          <Button href={`${storeUrl}/account/orders/${orderId}`}>
            Track Your Order
          </Button>
        </Section>
        
        <Text className="text-base text-gray-700 leading-6 m-0 mb-4">
          Questions about your order? Contact us at <Link href="mailto:shop@sen.studio" className="text-gray-900 underline">shop@sen.studio</Link> or visit our support center.
        </Text>
        
        <Text className="text-base text-gray-700 text-center m-0 mt-8">
          Thank you for choosing SenCommerce!<br/>
          <strong>The SenCommerce Team</strong>
        </Text>
      </Section>
    </EmailLayout>
  )
}

