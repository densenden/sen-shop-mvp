import { Link, Text, Section, Hr } from '@react-email/components'

export default function SenCommerceSignature() {
  return (
    <Section style={{
      borderTop: '1px solid #e5e7eb',
      paddingTop: '30px',
      marginTop: '40px'
    }}>
      <Text style={{
        color: '#6b7280',
        fontSize: '14px',
        marginBottom: '20px',
        fontFamily: "'Inter', sans-serif"
      }}>
        Best regards,<br />
        <strong>SenCommerce Team</strong><br />
        E-commerce Solutions<br />
        <Link 
          href="https://shop.sen.studio" 
          style={{
            color: '#374151',
            textDecoration: 'none'
          }}
        >
          shop.sen.studio
        </Link>
      </Text>
      
      <Hr style={{
        border: 'none',
        borderTop: '1px solid #e5e7eb',
        margin: '20px 0'
      }} />
      
      <Text style={{
        color: '#9ca3af',
        fontSize: '12px',
        margin: '0 0 15px 0',
        fontFamily: "'Inter', sans-serif"
      }}>
        SenCommerce ™ – Fast-track your e-commerce success with full-stack solutions
      </Text>
      
      <Text style={{
        color: '#d1d5db',
        fontSize: '11px',
        lineHeight: 1.5,
        margin: '0',
        fontFamily: "'Inter', sans-serif"
      }}>
        <strong>SEN.CO UG (haftungsbeschränkt)</strong><br />
        Paradiesgasse 53, 60594 Frankfurt am Main, Germany<br />
        Phone: <Link href="tel:+4915566179807" style={{ color: '#d1d5db', textDecoration: 'none' }}>+49 15566179807</Link> | 
        Email: <Link href="mailto:shop@sen.studio" style={{ color: '#d1d5db', textDecoration: 'none' }}>shop@sen.studio</Link><br />
        Registered: Local Court Frankfurt am Main, HRB 129222<br />
        VAT ID: DE358821685
      </Text>
    </Section>
  )
}