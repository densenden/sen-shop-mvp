import { Section, Text, Row, Column, Heading, Link } from '@react-email/components'
import { EmailLayout } from './components/Layout'
import { Button } from './components/Button'

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
  customerName,
  orderId,
  orderNumber,
  paymentAmount,
  currencyCode,
  paymentMethod,
  transactionId,
  storeUrl = 'https://shop.sen.studio'
}: PaymentConfirmationEmailProps) => {
  const formatPrice = (price: number) => `$${(price / 100).toFixed(2)}`

  return (
    <EmailLayout preview={`Payment confirmed for order #${orderNumber}`}>
      <Section style={content}>
        <Heading style={greeting}>Payment Confirmed! 💳</Heading>
        
        <Text style={paragraph}>
          Hi {customerName}, we've successfully processed your payment for order #{orderNumber}.
        </Text>
        
        <Section style={paymentSection}>
          <Heading as="h2" style={sectionTitle}>Payment Details</Heading>
          
          <Row style={detailRow}>
            <Column style={labelColumn}>
              <Text style={label}>Order Number:</Text>
            </Column>
            <Column style={valueColumn}>
              <Text style={value}>#{orderNumber}</Text>
            </Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={labelColumn}>
              <Text style={label}>Payment Amount:</Text>
            </Column>
            <Column style={valueColumn}>
              <Text style={value}>{formatPrice(paymentAmount)} {currencyCode.toUpperCase()}</Text>
            </Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={labelColumn}>
              <Text style={label}>Payment Method:</Text>
            </Column>
            <Column style={valueColumn}>
              <Text style={value}>{paymentMethod}</Text>
            </Column>
          </Row>
          
          {transactionId && (
            <Row style={detailRow}>
              <Column style={labelColumn}>
                <Text style={label}>Transaction ID:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={value}>{transactionId}</Text>
              </Column>
            </Row>
          )}
          
          <Row style={detailRow}>
            <Column style={labelColumn}>
              <Text style={label}>Payment Date:</Text>
            </Column>
            <Column style={valueColumn}>
              <Text style={value}>{new Date().toLocaleDateString()}</Text>
            </Column>
          </Row>
        </Section>
        
        <Section style={statusSection}>
          <Heading as="h3" style={statusTitle}>What happens next?</Heading>
          <ul style={statusList}>
            <li style={statusItem}>✅ Your payment has been processed successfully</li>
            <li style={statusItem}>📦 Your order is now being prepared for fulfillment</li>
            <li style={statusItem}>📧 You'll receive order confirmation and tracking information shortly</li>
            <li style={statusItem}>💾 Digital products will be available for download within minutes</li>
          </ul>
        </Section>
        
        <Section style={ctaSection}>
          <Button href={`${storeUrl}/account/orders/${orderId}`}>
            View Order Details
          </Button>
        </Section>
        
        <Text style={paragraph}>
          If you have any questions about your payment or order, please contact us at <Link href="mailto:shop@sen.studio" style={emailLink}>shop@sen.studio</Link>.
        </Text>
        
        <Text style={signature}>
          Thank you for your purchase!<br/>
          <strong>The SenCommerce Team</strong>
        </Text>
      </Section>
    </EmailLayout>
  )
}

// Styles
const content = {
  padding: '0 20px',
}

const greeting = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#059669',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  margin: '0 0 16px 0',
}

const paymentSection = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #22c55e',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const sectionTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#15803d',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
}

const detailRow = {
  margin: '12px 0',
}

const labelColumn = {
  width: '40%',
}

const valueColumn = {
  width: '60%',
}

const label = {
  fontSize: '14px',
  color: '#374151',
  margin: '0',
  fontWeight: '500',
}

const value = {
  fontSize: '14px',
  color: '#1e293b',
  margin: '0',
  fontWeight: '600',
}

const statusSection = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const statusTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 16px 0',
}

const statusList = {
  color: '#374151',
  fontSize: '14px',
  margin: '0',
  paddingLeft: '20px',
}

const statusItem = {
  margin: '8px 0',
  lineHeight: '20px',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const signature = {
  fontSize: '16px',
  color: '#374151',
  margin: '32px 0 0 0',
  textAlign: 'center' as const,
}

const emailLink = {
  color: '#2563eb',
  textDecoration: 'underline',
}