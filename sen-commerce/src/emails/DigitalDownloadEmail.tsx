import { Section, Text, Row, Column, Hr, Heading, Link } from '@react-email/components'
import { EmailLayout } from './components/Layout'
import { Button } from './components/Button'

interface DownloadLink {
  productTitle: string
  downloadUrl: string
  expiresAt: string
}

interface DigitalDownloadEmailProps {
  customerName: string
  orderId: string
  orderNumber: string
  downloadLinks: DownloadLink[]
  storeUrl?: string
}

export const DigitalDownloadEmail = ({
  customerName,
  orderId,
  orderNumber,
  downloadLinks,
  storeUrl = 'https://shop.sen.studio'
}: DigitalDownloadEmailProps) => (
  <EmailLayout preview={`Your digital downloads are ready - Order #${orderNumber}`}>
    <Section style={content}>
      <Heading style={greeting}>Your Downloads Are Ready! 🎨</Heading>
      
      <Text style={paragraph}>
        Hi {customerName}, your digital products from order #{orderNumber} are now available for download.
      </Text>
      
      <Section style={downloadsSection}>
        <Heading as="h2" style={sectionTitle}>Digital Downloads</Heading>
        
        {downloadLinks.map((link, index) => (
          <div key={index}>
            <Section style={downloadItem}>
              <Row>
                <Column style={productColumn}>
                  <Text style={productTitle}>{link.productTitle}</Text>
                  <Text style={expiryText}>Expires: {link.expiresAt}</Text>
                </Column>
                <Column style={downloadColumn}>
                  <Button href={link.downloadUrl}>
                    Download Now
                  </Button>
                </Column>
              </Row>
            </Section>
            {index < downloadLinks.length - 1 && <Hr style={itemDivider} />}
          </div>
        ))}
      </Section>
      
      <Section style={warningSection}>
        <Text style={warningTitle}>⚠️ Important Information</Text>
        <ul style={warningList}>
          <li style={warningItem}>Download links expire after 7 days or 3 downloads, whichever comes first</li>
          <li style={warningItem}>Please save your files immediately after downloading</li>
          <li style={warningItem}>Files are high-resolution and suitable for both digital and print use</li>
          <li style={warningItem}>For commercial use, please review our licensing terms</li>
        </ul>
      </Section>
      
      <Section style={ctaSection}>
        <Button href={`${storeUrl}/account/downloads`} variant="secondary">
          View All Downloads
        </Button>
      </Section>
      
      <Text style={paragraph}>
        Having trouble downloading? Contact our support team at <Link href="mailto:shop@sen.studio" style={emailLink}>shop@sen.studio</Link> and we'll help you right away.
      </Text>
      
      <Text style={signature}>
        Enjoy your digital artwork!<br/>
        <strong>The SenCommerce Team</strong>
      </Text>
    </Section>
  </EmailLayout>
)

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

const downloadsSection = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const sectionTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#0c4a6e',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
}

const downloadItem = {
  padding: '16px 0',
}

const productColumn = {
  width: '70%',
}

const downloadColumn = {
  width: '30%',
  textAlign: 'right' as const,
}

const productTitle = {
  fontSize: '16px',
  fontWeight: '500',
  color: '#1e293b',
  margin: '0 0 4px 0',
}

const expiryText = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0',
}

const itemDivider = {
  borderColor: '#bae6fd',
  margin: '8px 0',
}

const warningSection = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const warningTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 12px 0',
}

const warningList = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
  paddingLeft: '20px',
}

const warningItem = {
  margin: '4px 0',
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