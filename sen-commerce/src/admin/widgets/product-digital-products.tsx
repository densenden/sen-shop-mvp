import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DigitalProductSection } from "../components/products/digital-product-section"
import { CloudArrowDown } from "@medusajs/icons"

// Widget to add digital products section to product detail page
const ProductDigitalProductsWidget = ({ data }: { data: any }) => {
  // Extract product ID from the data
  const productId = data?.id
  
  if (!productId) {
    return null
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-ui-border-base p-6">
      <DigitalProductSection productId={productId} />
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after", // Add after the main product details
})

export default ProductDigitalProductsWidget 