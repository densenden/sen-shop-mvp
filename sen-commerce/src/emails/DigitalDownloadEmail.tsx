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
        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.sm}`}>
          Hi {customerName},
        </Text>
        
        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.md}`}>
          Your digital products from order <strong>{orderNumber}</strong> are ready for download.
        </Text>

        <Hr className="border-gray-200 my-6" />

        {/* Download Links */}
        {downloadLinks.map((link, index) => (
          <div key={index}>
            <Section className="text-center py-6">
              <Text className={`text-${emailStyles.colors.text.primary} font-medium text-lg mb-2`}>
                {link.productTitle}
              </Text>
              <Text className={`text-${emailStyles.colors.text.light} text-sm mb-4`}>
                Digital Download • Expires {link.expiresAt}
              </Text>
              <Button
                href={link.downloadUrl}
                className={`${emailStyles.components.button.black} mx-auto`}
              >
                Download Now
              </Button>
            </Section>
            {index < downloadLinks.length - 1 && <Hr className="border-gray-200 my-4" />}
          </div>
        ))}

        <Hr className="border-gray-200 my-6" />

        {/* Important Information */}
        <Section className={`bg-gray-50 p-4 border-l-4 border-gray-400 ${emailStyles.layout.sectionSmall}`}>
          <Text className="text-gray-800 font-medium text-sm mb-2">Important:</Text>
          <Text className="text-gray-700 text-sm mb-1">
            Download links expire in 7 days for security.
          </Text>
          <Text className="text-gray-700 text-sm">
            Save your files locally after downloading.
          </Text>
        </Section>

        <Text className={`text-${emailStyles.colors.text.secondary} text-center ${emailStyles.layout.spacing.md}`}>
          Questions? Contact us at <Link href="mailto:shop@sen.studio" className={emailStyles.components.link.underlined}>shop@sen.studio</Link>
        </Text>
      </Section>


      {/* Signature */}
      <SenCommerceSignature />
    </BaseEmailLayout>
  )
}

export default DigitalDownloadEmail