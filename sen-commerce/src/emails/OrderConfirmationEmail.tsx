import {
  Button,
  Section,
  Text,
  Heading,
  Link,
  Row,
  Column,
  Hr,
  Img
} from '@react-email/components'
import BaseEmailLayout from './components/BaseLayout'
import SenCommerceSignature from './components/SenCommerceSignature'
import { emailStyles } from './components/EmailStyles'

interface OrderItem {
  title: string
  quantity: number
  unitPrice: number
  fulfillmentType?: string
  thumbnail?: string
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
  customerName = 'John Doe',
  orderId = 'order_123',
  orderNumber = '#SC-2024-001',
  items = [
    { title: 'Premium Product', quantity: 1, unitPrice: 2999, fulfillmentType: 'digital' }
  ],
  totalAmount = 2999,
  currencyCode = 'USD',
  storeUrl = 'https://shop.sen.studio'
}: OrderConfirmationEmailProps) => {
  
  const formatPrice = (price: number) => `$${(price / 100).toFixed(2)}`
  const hasDigitalProducts = items.some(item => item.fulfillmentType === 'digital' || item.fulfillmentType === 'digital_download')
  const hasPrintProducts = items.some(item => item.fulfillmentType === 'printful_pod')

  return (
    <BaseEmailLayout
      previewText={`Order confirmation ${orderNumber} - SenCommerce`}
      title="Order Confirmed"
      logoUrl="https://shop.sen.studio/logo.svg"
      logoAlt="SenCommerce"
    >
      {/* Greeting */}
      <Section className={emailStyles.layout.section}>
        <Text className={`${emailStyles.typography.sizes.base} text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.sm}`}>
          Hi {customerName},
        </Text>
        
        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.md}`}>
          Thank you for your order! We're excited to get your products to you. Your order has been confirmed and is being processed.
        </Text>

        {/* Order Details Card */}
        <Section className={`${emailStyles.components.card.primary} ${emailStyles.layout.sectionSmall}`}>
          <Heading className={`${emailStyles.typography.sizes.lg} ${emailStyles.typography.weights.medium} text-${emailStyles.colors.text.primary} ${emailStyles.layout.spacing.sm}`}>
            Order Details
          </Heading>
          
          <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.xs}`}>
            <strong>Order Number:</strong> {orderNumber}
          </Text>
          
          <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.xs}`}>
            <strong>Order Date:</strong> {new Date().toLocaleDateString()}
          </Text>
          
          <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.sm}`}>
            <strong>Total:</strong> {formatPrice(totalAmount)} {currencyCode.toUpperCase()}
          </Text>
        </Section>

        {/* Items Ordered */}
        <Section className={`${emailStyles.components.card.neutral} ${emailStyles.layout.sectionSmall}`}>
          <Heading className={`${emailStyles.typography.sizes.lg} ${emailStyles.typography.weights.medium} text-${emailStyles.colors.text.primary} ${emailStyles.layout.spacing.sm}`}>
            Items Ordered
          </Heading>
          
          {items.map((item, index) => (
            <div key={index}>
              <Row className="py-2">
                <Column className="w-16 pr-4">
                  <Img
                    src={item.thumbnail || 
                      (item.fulfillmentType === 'digital' || item.fulfillmentType === 'digital_download'
                        ? 'https://picsum.photos/48/48?random=digital'
                        : item.fulfillmentType === 'printful_pod'
                        ? 'https://picsum.photos/48/48?random=pod'
                        : 'https://picsum.photos/48/48?random=product')
                    }
                    alt={item.title}
                    width="48"
                    height="48"
                    className="rounded-lg border border-gray-200"
                  />
                </Column>
                <Column className="flex-1">
                  <Text className={`text-${emailStyles.colors.text.secondary} font-medium mb-1`}>
                    {item.quantity}x {item.title}
                  </Text>
                  <Text className={`text-${emailStyles.colors.text.light} text-sm`}>
                    {item.fulfillmentType === 'digital' && '📱 Digital Download'}
                    {item.fulfillmentType === 'printful_pod' && '🖨️ Print-on-Demand'}
                    {!item.fulfillmentType && '📦 Product'}
                  </Text>
                </Column>
                <Column className="text-right">
                  <Text className={`text-${emailStyles.colors.text.secondary} font-medium`}>
                    {formatPrice(item.unitPrice * item.quantity)}
                  </Text>
                </Column>
              </Row>
              {index < items.length - 1 && <Hr className="border-gray-200 my-2" />}
            </div>
          ))}
        </Section>

        {/* Digital Products Notice */}
        {hasDigitalProducts && (
          <Section className={`${emailStyles.components.card.secondary} ${emailStyles.layout.sectionSmall}`}>
            <Text className={`text-${emailStyles.colors.secondary} font-semibold mb-2`}>📱 Digital Products</Text>
            <Text className={`text-${emailStyles.colors.text.secondary} text-sm`}>
              Your digital products will be available for download shortly. You'll receive a separate email with secure download links.
            </Text>
          </Section>
        )}

        {/* Print Products Notice */}
        {hasPrintProducts && (
          <Section className={`bg-green-50 p-4 rounded-lg ${emailStyles.layout.sectionSmall}`}>
            <Text className="text-green-800 font-semibold mb-2">🖨️ Print-on-Demand Items</Text>
            <Text className="text-green-700 text-sm">
              Your print-on-demand items will be processed and shipped within 2-3 business days. You'll receive tracking information once shipped.
            </Text>
          </Section>
        )}

        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.sm}`}>
          You'll receive a shipping confirmation email with tracking information once your order ships.
        </Text>

        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.md}`}>
          Need help? Visit our <Link href="https://shop.sen.studio/support" className={emailStyles.components.link.underlined}>support center</Link> or reply to this email.
        </Text>
      </Section>

      {/* Action Button */}
      <Section className={`text-center ${emailStyles.layout.section}`}>
        <Button
          href={`${storeUrl}/account`}
          className={emailStyles.components.button.primary}
        >
          View Order in Account
        </Button>
      </Section>

      {/* Signature */}
      <SenCommerceSignature />
    </BaseEmailLayout>
  )
}

export default OrderConfirmationEmail