import { defineSettingConfig } from "@medusajs/admin-sdk"
import { Container, Heading } from "@medusajs/ui"

const BrandingSettings = () => {
  return (
    <Container>
      <Heading level="h1">SenCommerce Admin</Heading>
      <p>Powered by SEN Studio</p>
    </Container>
  )
}

export const config = defineSettingConfig({
  label: "Branding",
})

export default BrandingSettings