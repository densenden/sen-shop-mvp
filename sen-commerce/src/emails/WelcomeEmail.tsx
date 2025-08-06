import {
  Button,
  Section,
  Text,
  Heading,
  Link,
  Row,
  Column,
  Img
} from '@react-email/components'
import BaseEmailLayout from './components/BaseLayout'
import SenCommerceSignature from './components/SenCommerceSignature'
import { emailStyles } from './components/EmailStyles'

interface WelcomeEmailProps {
  customerName: string
  storeUrl?: string
}

export const WelcomeEmail = ({ 
  customerName = 'John Doe',
  storeUrl = 'https://shop.sen.studio' 
}: WelcomeEmailProps) => {

  return (
    <BaseEmailLayout
      previewText={`Welcome to SenCommerce, ${customerName}! Discover digital art and custom prints.`}
      title="Welcome to SenCommerce"
      logoUrl="https://shop.sen.studio/logo.svg"
      logoAlt="SenCommerce"
    >
      {/* Greeting */}
      <Section className={emailStyles.layout.section}>
        <Text className={`${emailStyles.typography.sizes.base} text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.sm}`}>
          Hi {customerName},
        </Text>
        
        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.md}`}>
          Welcome to SenCommerce! We're excited to have you as part of our creative community. Your creative journey begins now 🎨
        </Text>

        {/* Hero Product Image */}
        <Section className={`text-center ${emailStyles.layout.sectionSmall}`}>
          <Img
            src="https://dltvkqzxlwxbtgiofkds.supabase.co/storage/v1/object/public/artwork-images/hero-collection.jpg"
            alt="SenCommerce Digital Art Collection"
            width="560"
            height="280"
            className="w-full max-w-full rounded-lg"
          />
        </Section>

        {/* Introduction */}
        <Section className={`${emailStyles.components.card.primary} ${emailStyles.layout.sectionSmall}`}>
          <Heading className={`${emailStyles.typography.sizes.lg} ${emailStyles.typography.weights.medium} text-${emailStyles.colors.text.primary} ${emailStyles.layout.spacing.sm}`}>
            Your Creative Journey Starts Here
          </Heading>
          
          <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.sm}`}>
            Thank you for joining SenCommerce, your premier destination for digital art and custom print-on-demand products.
          </Text>
        </Section>

        {/* What's Available Section */}
        <Section className={`${emailStyles.components.card.neutral} ${emailStyles.layout.sectionSmall}`}>
          <Heading className={`${emailStyles.typography.sizes.lg} ${emailStyles.typography.weights.medium} text-${emailStyles.colors.text.primary} ${emailStyles.layout.spacing.sm}`}>
            What You Can Do
          </Heading>
          
          {/* Features with Images */}
          <Row className="py-3">
            <Column className="w-1/2 pr-4">
              <Section className={`${emailStyles.components.card.secondary} p-4`}>
                <Img
                  src="https://dltvkqzxlwxbtgiofkds.supabase.co/storage/v1/object/public/artwork-images/digital-art-preview.jpg"
                  alt="Digital Art Downloads"
                  width="200"
                  height="120"
                  className="w-full rounded mb-3"
                />
                <Text className={`text-${emailStyles.colors.text.secondary} font-medium mb-1`}>
                  📱 Digital Downloads
                </Text>
                <Text className={`text-${emailStyles.colors.text.light} text-sm`}>
                  Instant access to high-resolution digital artworks
                </Text>
              </Section>
            </Column>
            <Column className="w-1/2 pl-4">
              <Section className="bg-green-50 p-4 rounded-lg">
                <Img
                  src="https://dltvkqzxlwxbtgiofkds.supabase.co/storage/v1/object/public/artwork-images/print-products.jpg"
                  alt="Print on Demand Products"
                  width="200"
                  height="120"
                  className="w-full rounded mb-3"
                />
                <Text className="text-green-800 font-medium mb-1">
                  🖨️ Custom Prints
                </Text>
                <Text className="text-green-700 text-sm">
                  Premium quality prints, apparel, and accessories
                </Text>
              </Section>
            </Column>
          </Row>
        </Section>

        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.md}`}>
          Ready to explore our curated collections? Browse through our digital artwork and custom print options to find your perfect match.
        </Text>

        <Text className={`text-${emailStyles.colors.text.secondary} ${emailStyles.layout.spacing.md}`}>
          Questions? We're here to help! Reply to this email or contact us at <Link href="mailto:shop@sen.studio" className={emailStyles.components.link.underlined}>shop@sen.studio</Link>
        </Text>
      </Section>

      {/* Action Button */}
      <Section className={`text-center ${emailStyles.layout.section}`}>
        <Text className={`text-${emailStyles.colors.text.muted} text-sm ${emailStyles.layout.spacing.sm}`}>
          Start exploring our collections today!
        </Text>
        <Button
          href={storeUrl}
          className={emailStyles.components.button.primary}
        >
          Browse Collections
        </Button>
      </Section>

      {/* Signature */}
      <SenCommerceSignature />
    </BaseEmailLayout>
  )
}

