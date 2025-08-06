import {
  Button,
  Section,
  Text,
  Heading,
  Link,
  Row,
  Column
} from '@react-email/components'
import BaseEmailLayout from './components/BaseLayout'
import SenCommerceSignature from './components/SenCommerceSignature'
import { emailStyles } from './components/EmailStyles'

interface PaymentConfirmationEmailProps {
  customerName: string
  orderId: string
  orderNumber: string
  paymentAmount: number
  currencyCode: string
  paymentMethod: string
  transactionId?: string
  storeUrl?: string
}

export const PaymentConfirmationEmail = ({
  customerName = 'John Doe',
  orderId = 'order_123',
  orderNumber = '#SC-2024-001',
  paymentAmount = 2999,
  currencyCode = 'USD',
  paymentMethod = 'Credit Card',
  transactionId,
  storeUrl = 'https://shop.sen.studio'
}: PaymentConfirmationEmailProps) => {
  const formatPrice = (price: number) => `$${(price / 100).toFixed(2)}`

  return (
    <BaseEmailLayout
      previewText={`Payment confirmed for order ${orderNumber} - SenCommerce`}
      title="Payment Confirmed"
      logoUrl="https://shop.sen.studio/logo.svg"
      logoAlt="SenCommerce"
    >
      {/* Greeting */}
      <Section className={emailStyles.layout.section}>
        <Text className={`${emailStyles.typography.sizes.base} text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.sm}`}>
          Hi {customerName},
        </Text>
        
        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.md}`}>
          Great news! We've successfully processed your payment for order {orderNumber}. 💳
        </Text>

        {/* Payment Details Card */}
        <Section className={`bg-green-50 p-6 rounded-lg border border-green-200 ${emailStyles.layout.sectionSmall}`}>
          <Heading className={`text-green-800 ${emailStyles.typography.sizes.lg} ${emailStyles.typography.weights.medium} ${emailStyles.layout.spacing.sm}`}>
            ✅ Payment Confirmed
          </Heading>
          
          <Row className="py-2">
            <Column className="w-1/2">
              <Text className={`text-green-700 font-medium text-sm`}>
                Order Number:
              </Text>
            </Column>
            <Column className="w-1/2">
              <Text className={`text-green-800 font-semibold text-sm`}>
                {orderNumber}
              </Text>
            </Column>
          </Row>
          
          <Row className="py-2">
            <Column className="w-1/2">
              <Text className={`text-green-700 font-medium text-sm`}>
                Payment Amount:
              </Text>
            </Column>
            <Column className="w-1/2">
              <Text className={`text-green-800 font-semibold text-sm`}>
                {formatPrice(paymentAmount)} {currencyCode.toUpperCase()}
              </Text>
            </Column>
          </Row>
          
          <Row className="py-2">
            <Column className="w-1/2">
              <Text className={`text-green-700 font-medium text-sm`}>
                Payment Method:
              </Text>
            </Column>
            <Column className="w-1/2">
              <Text className={`text-green-800 font-semibold text-sm`}>
                {paymentMethod}
              </Text>
            </Column>
          </Row>
          
          {transactionId && (
            <Row className="py-2">
              <Column className="w-1/2">
                <Text className={`text-green-700 font-medium text-sm`}>
                  Transaction ID:
                </Text>
              </Column>
              <Column className="w-1/2">
                <Text className={`text-green-800 font-semibold text-sm`}>
                  {transactionId}
                </Text>
              </Column>
            </Row>
          )}
          
          <Row className="py-2">
            <Column className="w-1/2">
              <Text className={`text-green-700 font-medium text-sm`}>
                Payment Date:
              </Text>
            </Column>
            <Column className="w-1/2">
              <Text className={`text-green-800 font-semibold text-sm`}>
                {new Date().toLocaleDateString()}
              </Text>
            </Column>
          </Row>
        </Section>

        {/* What's Next Section */}
        <Section className={`${emailStyles.components.card.neutral} ${emailStyles.layout.sectionSmall}`}>
          <Heading className={`${emailStyles.typography.sizes.lg} ${emailStyles.typography.weights.medium} text-${emailStyles.colors.text.primary} ${emailStyles.layout.spacing.sm}`}>
            What Happens Next?
          </Heading>
          
          <Text className={`text-${emailStyles.colors.text.secondary} text-sm mb-2`}>
            ✅ Your payment has been processed successfully
          </Text>
          <Text className={`text-${emailStyles.colors.text.secondary} text-sm mb-2`}>
            📦 Your order is now being prepared for fulfillment
          </Text>
          <Text className={`text-${emailStyles.colors.text.secondary} text-sm mb-2`}>
            📧 You'll receive order confirmation and tracking information shortly
          </Text>
          <Text className={`text-${emailStyles.colors.text.secondary} text-sm`}>
            💾 Digital products will be available for download within minutes
          </Text>
        </Section>

        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.md}`}>
          If you have any questions about your payment or order, please contact us at <Link href="mailto:shop@sen.studio" className={emailStyles.components.link.underlined}>shop@sen.studio</Link>.
        </Text>
      </Section>

      {/* Action Button */}
      <Section className={`text-center ${emailStyles.layout.section}`}>
        <Text className={`text-${emailStyles.colors.text.muted} text-sm ${emailStyles.layout.spacing.sm}`}>
          View your order details and track progress
        </Text>
        <Button
          href={`${storeUrl}/account/orders/${orderId}`}
          className={emailStyles.components.button.primary}
        >
          View Order Details
        </Button>
      </Section>

      {/* Signature */}
      <SenCommerceSignature />
    </BaseEmailLayout>
  )
}

export default PaymentConfirmationEmail