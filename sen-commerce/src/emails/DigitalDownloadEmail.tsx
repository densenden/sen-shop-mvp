import {
  Button,
  Section,
  Text,
  Heading,
  Link,
  Row,
  Column,
  Hr
} from '@react-email/components'
import BaseEmailLayout from './components/BaseLayout'
import SenCommerceSignature from './components/SenCommerceSignature'
import { emailStyles } from './components/EmailStyles'

interface DownloadLink {
  productTitle: string
  downloadUrl: string
  expiresAt: string
}

interface DigitalDownloadEmailProps {
  customerName: string
  customerEmail: string
  orderId: string
  orderNumber: string
  downloadLinks: DownloadLink[]
  storeUrl?: string
}

export const DigitalDownloadEmail = ({
  customerName = 'John Doe',
  customerEmail = 'customer@example.com',
  orderId = 'order_123',
  orderNumber = '#SC-2024-001',
  downloadLinks = [
    { 
      productTitle: 'Digital Artwork - Abstract Design', 
      downloadUrl: 'https://example.com/download/token123',
      expiresAt: '2024-01-22'
    }
  ],
  storeUrl = 'https://shop.sen.studio'
}: DigitalDownloadEmailProps) => {

  return (
    <BaseEmailLayout
      previewText={`Your digital downloads are ready - Order ${orderNumber}`}
      title="Digital Downloads Ready"
      logoUrl="https://shop.sen.studio/logo.svg"
      logoAlt="SenCommerce"
    >
      {/* Greeting */}
      <Section className={emailStyles.layout.section}>
        <Text className={`${emailStyles.typography.sizes.base} text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.sm}`}>
          Hi {customerName},
        </Text>
        
        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.md}`}>
          Great news! Your digital products from order <strong>{orderNumber}</strong> are now ready for download.
        </Text>

        {/* Download Notice */}
        <Section className={`${emailStyles.components.card.primary} ${emailStyles.layout.sectionSmall}`}>
          <Heading className={`${emailStyles.typography.sizes.lg} ${emailStyles.typography.weights.medium} text-${emailStyles.colors.text.primary} ${emailStyles.layout.spacing.sm}`}>
            📱 Digital Downloads Ready
          </Heading>
          
          <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.sm}`}>
            Click the download links below to access your digital products. These links are secure and will expire in 7 days.
          </Text>
        </Section>

        {/* Download Links */}
        <Section className={`${emailStyles.components.card.neutral} ${emailStyles.layout.sectionSmall}`}>
          <Heading className={`${emailStyles.typography.sizes.lg} ${emailStyles.typography.weights.medium} text-${emailStyles.colors.text.primary} ${emailStyles.layout.spacing.sm}`}>
            Your Downloads
          </Heading>
          
          {downloadLinks.map((link, index) => (
            <div key={index}>
              <Row className="py-3">
                <Column className="flex-1">
                  <Text className={`text-${emailStyles.colors.text.secondary} font-medium mb-1`}>
                    {link.productTitle}
                  </Text>
                  <Text className={`text-${emailStyles.colors.text.light} text-sm mb-3`}>
                    Expires: {link.expiresAt}
                  </Text>
                  <Button
                    href={link.downloadUrl}
                    className={emailStyles.components.button.primary}
                  >
                    Download Now
                  </Button>
                </Column>
              </Row>
              {index < downloadLinks.length - 1 && <Hr className="border-gray-200 my-3" />}
            </div>
          ))}
        </Section>

        {/* Important Information */}
        <Section className={`bg-yellow-50 p-4 rounded-lg border border-yellow-200 ${emailStyles.layout.sectionSmall}`}>
          <Heading className="text-yellow-800 font-semibold text-base mb-2">⚠️ Important Information</Heading>
          <Text className="text-yellow-700 text-sm mb-2">
            • Download links expire in 7 days for security
          </Text>
          <Text className="text-yellow-700 text-sm mb-2">
            • Please download your files immediately and save them locally
          </Text>
          <Text className="text-yellow-700 text-sm">
            • Contact us if you need help accessing your downloads
          </Text>
        </Section>

        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.md}`}>
          Having trouble with your downloads? Contact our support team at <Link href="mailto:shop@sen.studio" className={emailStyles.components.link.underlined}>shop@sen.studio</Link> and we'll be happy to help.
        </Text>
      </Section>

      {/* Support Section */}
      <Section className={`text-center ${emailStyles.layout.section}`}>
        <Text className={`text-${emailStyles.colors.text.muted} text-sm ${emailStyles.layout.spacing.sm}`}>
          Need assistance? We're here to help!
        </Text>
        <Button
          href="https://shop.sen.studio/support"
          className={emailStyles.components.button.secondary}
        >
          Contact Support
        </Button>
      </Section>

      {/* Signature */}
      <SenCommerceSignature />
    </BaseEmailLayout>
  )
}

export default DigitalDownloadEmail