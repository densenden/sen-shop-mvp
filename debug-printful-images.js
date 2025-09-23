// Debug script to test Printful image collection
async function testPrintfulImageCollection() {
  const PRINTFUL_API_TOKEN = process.env.PRINTFUL_API_TOKEN
  
  if (!PRINTFUL_API_TOKEN) {
    console.error('PRINTFUL_API_TOKEN not found in environment')
    return
  }

  // Test V2 catalog API for a common product (t-shirt)
  const testProductId = '71' // Basic t-shirt
  
  try {
    console.log(`Testing Printful V2 catalog product: ${testProductId}`)
    const response = await fetch(`https://api.printful.com/v2/catalog-products/${testProductId}`, {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error('V2 API Error:', response.status, await response.text())
      return
    }
    
    const data = await response.json()
    console.log('✅ V2 Catalog API Response:')
    console.log(`Product ID: ${data.data.id}`)
    console.log(`Product Name: ${data.data.name}`)
    console.log(`Main Image: ${data.data.image}`)
    console.log(`Variants count: ${data.data.variants?.length || 0}`)
    
    console.log('\nVariant Images:')
    data.data.variants?.forEach((variant, index) => {
      console.log(`  Variant ${index}: ${variant.name} - ${variant.image}`)
    })
    
    // Test V2 catalog product with variants (different endpoint)
    console.log(`\n--- Testing V2 catalog product with variants ---`)
    const variantsResponse = await fetch(`https://api.printful.com/v2/catalog-products/${testProductId}/variants`, {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (variantsResponse.ok) {
      const variantsData = await variantsResponse.json()
      console.log(`✅ V2 Variants API Response: Found ${variantsData.data?.length || 0} variants`)
      variantsData.data?.forEach((variant, index) => {
        console.log(`  V2 Variant ${index}: ${variant.name} - Image: ${variant.image}`)
        console.log(`    Size: ${variant.size}, Color: ${variant.color}`)
      })
    } else {
      console.log('V2 Variants API not available or failed:', variantsResponse.status)
    }
    
    return data.data
  } catch (error) {
    console.error('Error testing Printful API:', error)
  }
}

// Test V1 store products (if we have any)
async function testStoreProducts() {
  const PRINTFUL_API_TOKEN = process.env.PRINTFUL_API_TOKEN
  
  try {
    console.log('\n--- Testing V1 Store Products ---')
    const response = await fetch('https://api.printful.com/store/products', {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_TOKEN}`
      }
    })
    
    if (!response.ok) {
      console.error('V1 Store API Error:', response.status, await response.text())
      return
    }
    
    const data = await response.json()
    console.log(`Found ${data.result?.length || 0} store products`)
    
    if (data.result && data.result.length > 0) {
      const firstProduct = data.result[0]
      console.log(`\nFirst store product: ${firstProduct.name}`)
      console.log(`ID: ${firstProduct.id}`)
      console.log(`Thumbnail: ${firstProduct.thumbnail_url}`)
      
      // Get detailed product info
      console.log(`\n--- Getting detailed store product info ---`)
      const detailResponse = await fetch(`https://api.printful.com/store/products/${firstProduct.id}`, {
        headers: {
          'Authorization': `Bearer ${PRINTFUL_API_TOKEN}`
        }
      })
      
      if (detailResponse.ok) {
        const detailData = await detailResponse.json()
        const product = detailData.result
        console.log(`✅ Detailed product: ${product.sync_product.name}`)
        console.log(`Thumbnail: ${product.sync_product.thumbnail_url}`)
        console.log(`Variants: ${product.sync_variants?.length || 0}`)
        
        product.sync_variants?.forEach((variant, index) => {
          console.log(`  Store Variant ${index}:`)
          console.log(`    Name: ${variant.name}`)
          console.log(`    Retail Price: ${variant.retail_price}`)
          console.log(`    Files: ${variant.files?.length || 0}`)
          variant.files?.forEach((file, fileIndex) => {
            console.log(`      File ${fileIndex}: Type: ${file.type}, URL: ${file.preview_url || file.url}`)
          })
        })
      } else {
        console.log(`Failed to get detailed product info: ${detailResponse.status}`)
      }
    }
    
  } catch (error) {
    console.error('Error testing store products:', error)
  }
}

// Test mockup generation
async function testMockupGeneration() {
  const PRINTFUL_API_TOKEN = process.env.PRINTFUL_API_TOKEN
  
  try {
    console.log('\n--- Testing Mockup Generation ---')
    const testProductId = '71'
    const testVariantId = '4011' // Common variant for basic t-shirt
    const testArtworkUrl = 'https://files.cdn.printful.com/upload/bP2/bP2aGOd-V_lJumhXBgqI_l1w4_generated.png'
    
    const mockupRequest = {
      variant_ids: [testVariantId],
      files: [
        {
          placement: 'front',
          image_url: testArtworkUrl,
          position: {
            area_width: 1800,
            area_height: 2400,
            width: 1800,
            height: 2400,
            top: 0,
            left: 0
          }
        }
      ]
    }
    
    console.log('Requesting mockup generation...')
    const response = await fetch(`https://api.printful.com/mockup-generator/create-task/${testProductId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockupRequest)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Mockup task created: ${data.result.task_key}`)
      console.log(`Status: ${data.result.status}`)
      
      // Check task status
      setTimeout(async () => {
        const statusResponse = await fetch(`https://api.printful.com/mockup-generator/task?task_key=${data.result.task_key}`, {
          headers: {
            'Authorization': `Bearer ${PRINTFUL_API_TOKEN}`
          }
        })
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          console.log(`Mockup status: ${statusData.result.status}`)
          if (statusData.result.result && statusData.result.result.mockups) {
            console.log(`Generated ${statusData.result.result.mockups.length} mockups:`)
            statusData.result.result.mockups.forEach((mockup, index) => {
              console.log(`  Mockup ${index}: ${mockup.mockup_url}`)
            })
          }
        }
      }, 5000) // Wait 5 seconds for generation
      
    } else {
      console.log(`Mockup generation failed: ${response.status}`)
      console.log(await response.text())
    }
    
  } catch (error) {
    console.error('Error testing mockup generation:', error)
  }
}

// Test specific product that was imported
async function testSpecificProduct() {
  const PRINTFUL_API_TOKEN = process.env.PRINTFUL_API_TOKEN
  const productId = '392324178' // The product from your metadata
  
  try {
    console.log(`\n--- Testing Specific Product ${productId} ---`)
    const response = await fetch(`https://api.printful.com/store/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_TOKEN}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Product found: ${data.result.sync_product.name}`)
      console.log(`Sync variants: ${data.result.sync_variants?.length || 0}`)
      
      data.result.sync_variants?.forEach((variant, index) => {
        console.log(`\nVariant ${index}:`)
        console.log(`  - ID: ${variant.id}`)
        console.log(`  - Name: ${variant.name}`)
        console.log(`  - Files: ${variant.files?.length || 0}`)
        variant.files?.forEach((file, fileIndex) => {
          console.log(`    File ${fileIndex}: ${file.type} -> ${file.preview_url || file.url}`)
        })
      })
      
      // Show what our service should return
      console.log('\n--- What our service should map this to ---')
      const mappedVariants = data.result.sync_variants?.map((v) => ({
        id: v.id.toString(),
        name: v.name,
        price: parseFloat(v.retail_price),
        currency: v.currency || 'USD',
        image: v.image || v.preview_url,
        files: v.files || []
      }))
      
      console.log(`Mapped variants: ${mappedVariants?.length || 0}`)
      mappedVariants?.forEach((variant, index) => {
        console.log(`  Mapped variant ${index}: ${variant.name} - Files: ${variant.files.length}`)
      })
      
    } else {
      console.log(`❌ Failed to fetch product: ${response.status}`)
    }
    
  } catch (error) {
    console.error('Error testing specific product:', error)
  }
}

// Run tests
testSpecificProduct()
  .then(() => testPrintfulImageCollection())
  .then(() => testStoreProducts())
  .catch(console.error)