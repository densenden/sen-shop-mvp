import { Section, Text, Row, Column, Heading, Img, Link } from '@react-email/components'
import { EmailLayout } from './components/Layout'
import { Button } from './components/Button'

interface WelcomeEmailProps {
  customerName: string
  storeUrl?: string
}

export const WelcomeEmail = ({ 
  customerName, 
  storeUrl = 'https://shop.sen.studio' 
}: WelcomeEmailProps) => (
  <EmailLayout preview={`Welcome to SenCommerce, ${customerName}! Discover digital art and custom prints.`}>
    <Section className="px-8 py-6">
      <Heading className="text-3xl font-light text-gray-900 text-center m-0 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Welcome, {customerName}!</Heading>
      <Text className="text-lg text-gray-600 text-center m-0 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>Your creative journey begins now 🎨</Text>
      
      {/* Hero Product Image from Supabase */}
      <Section className="text-center mb-8">
        <Img
          src="https://dltvkqzxlwxbtgiofkds.supabase.co/storage/v1/object/public/artwork-images/hero-collection.jpg"
          alt="SenCommerce Digital Art Collection"
          width="560"
          height="280"
          className="w-full max-w-full rounded-lg shadow-md"
        />
      </Section>
      
      <Text className="text-base text-gray-700 leading-relaxed m-0 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        Thank you for joining SenCommerce, your premier destination for digital art and custom print-on-demand products. We're excited to have you as part of our creative community!
      </Text>
      
      {/* What's Available Section */}
      <Section className="mb-8">
        <Heading as="h3" className="text-xl font-semibold text-gray-900 text-center m-0 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>What you can do:</Heading>
        
        {/* Features with Images */}
        <Row className="mb-6">
          <Column className="w-1/2 pr-4">
            <Section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
              <Img
                src="https://dltvkqzxlwxbtgiofkds.supabase.co/storage/v1/object/public/artwork-images/digital-art-preview.jpg"
                alt="Digital Art Downloads"
                width="200"
                height="120"
                className="w-full rounded mb-3"
              />
              <Text className="text-base font-semibold text-gray-900 m-0 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Digital Downloads</Text>
              <Text className="text-sm text-gray-600 m-0" style={{ fontFamily: 'Inter, sans-serif' }}>Instant access to high-resolution digital artworks</Text>
            </Section>
          </Column>
          <Column className="w-1/2 pl-4">
            <Section className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
              <Img
                src="https://dltvkqzxlwxbtgiofkds.supabase.co/storage/v1/object/public/artwork-images/print-products.jpg"
                alt="Print on Demand Products"
                width="200"
                height="120"
                className="w-full rounded mb-3"
              />
              <Text className="text-base font-semibold text-gray-900 m-0 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Custom Prints</Text>
              <Text className="text-sm text-gray-600 m-0" style={{ fontFamily: 'Inter, sans-serif' }}>Premium quality prints, apparel, and accessories</Text>
            </Section>
          </Column>
        </Row>
      </Section>
      
      {/* Call to Action */}
      <Section className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg p-6 text-center mb-8">
        <Heading as="h3" className="text-xl font-semibold text-white m-0 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Ready to get started?</Heading>
        <Text className="text-gray-200 m-0 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Explore our curated collections and find your perfect artwork</Text>
        <Button href={storeUrl}>
          Browse Collections
        </Button>
      </Section>
      
      {/* Support Section */}
      <Section className="bg-gray-50 rounded-lg p-4 text-center mb-6">
        <Text className="text-sm text-gray-600 m-0" style={{ fontFamily: 'Inter, sans-serif' }}>
          Questions? We're here to help! Reply to this email or contact us at <Link href="mailto:shop@sen.studio" className="text-gray-900 underline font-medium">shop@sen.studio</Link>
        </Text>
      </Section>
      
      <Text className="text-base text-gray-700 text-center m-0" style={{ fontFamily: 'Inter, sans-serif' }}>
        Happy creating! 🎨<br/>
        <Text className="font-semibold text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>The SenCommerce Team</Text>
      </Text>
    </Section>
  </EmailLayout>
)

