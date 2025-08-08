const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://dltvkqzxlwxbtgiofkds.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdHZrcXp4bHd4YnRnaW9ma2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjI4NzgsImV4cCI6MjA1MzAzODg3OH0.t-ux8_MhUUQE4eNTEhOEaOsjBw0R9Mz6wpAX_WaG7FU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createPricesForDigitalProducts() {
  // First get all digital variants without prices
  const { data: variants } = await supabase
    .from('product_variant')
    .select(`
      id, 
      product_id,
      product!inner(title, metadata)
    `)
    .eq('product.metadata->>fulfillment_type', 'digital_download')
  
  console.log('Found digital variants:', variants?.length || 0)
  
  for (const variant of variants || []) {
    try {
      console.log(`Processing variant ${variant.id} for product ${variant.product.title}`)
      
      // Create price set
      const { data: priceSet, error: priceSetError } = await supabase
        .from('price_set')
        .insert({ type: 'variant' })
        .select()
        .single()
      
      if (priceSetError) {
        console.error('Error creating price set:', priceSetError)
        continue
      }
      
      console.log(`Created price set ${priceSet.id}`)
      
      // Link price set to variant
      const { error: linkError } = await supabase
        .from('product_variant_price_set')
        .insert({
          variant_id: variant.id,
          price_set_id: priceSet.id
        })
      
      if (linkError) {
        console.error('Error linking price set to variant:', linkError)
        continue
      }
      
      // Create EUR price (€12.50 = 1250 cents)
      const { error: priceError } = await supabase
        .from('price')
        .insert({
          price_set_id: priceSet.id,
          amount: 1250,
          currency_code: 'eur'
        })
      
      if (priceError) {
        console.error('Error creating price:', priceError)
        continue
      }
      
      console.log(`✅ Set €12.50 price for ${variant.product.title}`)
      
    } catch (error) {
      console.error(`Error processing variant ${variant.id}:`, error)
    }
  }
}

createPricesForDigitalProducts()
  .then(() => {
    console.log('✅ Digital product pricing setup complete!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error setting up pricing:', error)
    process.exit(1)
  })