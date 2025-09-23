// Script to analyze image availability across Printful products
async function analyzeImageStatus() {
  const PRINTFUL_API_TOKEN = process.env.PRINTFUL_API_TOKEN || 'vyDUCpUttBXTBobLEdwEGzKXm26VH5BQ8ReFE2sk'
  
  console.log('🔍 PRINTFUL IMAGE ANALYSIS REPORT')
  console.log('=====================================\n')

  try {
    // 1. Fetch all store products
    console.log('📋 Fetching Printful store products...')
    const storeResponse = await fetch('https://api.printful.com/store/products', {
      headers: { Authorization: `Bearer ${PRINTFUL_API_TOKEN}` }
    })
    
    if (!storeResponse.ok) {
      throw new Error(`Store API failed: ${storeResponse.status}`)
    }
    
    const storeData = await storeResponse.json()
    const storeProducts = storeData.result || []
    
    console.log(`✅ Found ${storeProducts.length} store products\n`)
    
    // 2. Analyze each product in detail
    const analysisResults = []
    
    for (let i = 0; i < storeProducts.length; i++) {
      const product = storeProducts[i]
      console.log(`[${i+1}/${storeProducts.length}] Analyzing: ${product.name}`)
      
      try {
        // Get detailed product info
        const detailResponse = await fetch(`https://api.printful.com/store/products/${product.id}`, {
          headers: { Authorization: `Bearer ${PRINTFUL_API_TOKEN}` }
        })
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json()
          const syncProduct = detailData.result.sync_product
          const syncVariants = detailData.result.sync_variants || []
          
          // Count images
          let totalImages = 0
          let imageTypes = new Set()
          let variantCount = syncVariants.length
          
          // Add thumbnail
          if (syncProduct.thumbnail_url) {
            totalImages++
            imageTypes.add('thumbnail')
          }
          
          // Count variant files
          syncVariants.forEach(variant => {
            if (variant.files && Array.isArray(variant.files)) {
              variant.files.forEach(file => {
                totalImages++
                imageTypes.add(file.type || 'unknown')
              })
            }
          })
          
          analysisResults.push({
            id: product.id,
            name: product.name,
            thumbnail: syncProduct.thumbnail_url,
            variants: variantCount,
            totalImages,
            imageTypes: Array.from(imageTypes),
            status: totalImages > 1 ? '✅ Multiple' : totalImages === 1 ? '⚠️ Single' : '❌ None'
          })
          
        } else {
          analysisResults.push({
            id: product.id,
            name: product.name,
            thumbnail: product.thumbnail_url,
            variants: 0,
            totalImages: product.thumbnail_url ? 1 : 0,
            imageTypes: product.thumbnail_url ? ['thumbnail'] : [],
            status: '❌ API Error'
          })
        }
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`)
        analysisResults.push({
          id: product.id,
          name: product.name,
          thumbnail: 'Error',
          variants: 0,
          totalImages: 0,
          imageTypes: [],
          status: '❌ Error'
        })
      }
    }
    
    // 3. Generate comprehensive table
    console.log('\n📊 COMPREHENSIVE IMAGE STATUS TABLE')
    console.log('=====================================')
    
    // Header
    const header = '| Product Name'.padEnd(35) + 
                   '| ID'.padEnd(12) + 
                   '| Variants'.padEnd(10) + 
                   '| Images'.padEnd(8) + 
                   '| Types'.padEnd(25) + 
                   '| Status'.padEnd(12) + '|'
    
    console.log(header)
    console.log('|' + '-'.repeat(header.length - 2) + '|')
    
    // Data rows
    analysisResults.forEach(result => {
      const row = '| ' + result.name.substring(0, 32).padEnd(33) + 
                  '| ' + result.id.toString().padEnd(10) + 
                  '| ' + result.variants.toString().padEnd(8) + 
                  '| ' + result.totalImages.toString().padEnd(6) + 
                  '| ' + result.imageTypes.join(',').substring(0, 22).padEnd(23) + 
                  '| ' + result.status.padEnd(10) + '|'
      console.log(row)
    })
    
    // 4. Summary statistics
    const multipleImages = analysisResults.filter(r => r.totalImages > 1)
    const singleImage = analysisResults.filter(r => r.totalImages === 1)
    const noImages = analysisResults.filter(r => r.totalImages === 0)
    const totalVariants = analysisResults.reduce((sum, r) => sum + r.variants, 0)
    const totalImages = analysisResults.reduce((sum, r) => sum + r.totalImages, 0)
    
    console.log('\n📈 SUMMARY STATISTICS')
    console.log('=====================')
    console.log(`Total Products: ${analysisResults.length}`)
    console.log(`Total Variants: ${totalVariants}`)
    console.log(`Total Images Available: ${totalImages}`)
    console.log(`Average Images per Product: ${(totalImages / analysisResults.length).toFixed(1)}`)
    console.log('')
    console.log(`✅ Products with Multiple Images: ${multipleImages.length} (${((multipleImages.length / analysisResults.length) * 100).toFixed(1)}%)`)
    console.log(`⚠️  Products with Single Image: ${singleImage.length} (${((singleImage.length / analysisResults.length) * 100).toFixed(1)}%)`)
    console.log(`❌ Products with No Images: ${noImages.length} (${((noImages.length / analysisResults.length) * 100).toFixed(1)}%)`)
    
    // 5. Image type breakdown
    const allImageTypes = new Set()
    analysisResults.forEach(r => r.imageTypes.forEach(type => allImageTypes.add(type)))
    
    console.log('\n🎨 IMAGE TYPE BREAKDOWN')
    console.log('=======================')
    Array.from(allImageTypes).forEach(type => {
      const count = analysisResults.filter(r => r.imageTypes.includes(type)).length
      console.log(`${type.padEnd(15)}: ${count} products`)
    })
    
    // 6. Recommendations
    console.log('\n💡 RECOMMENDATIONS')
    console.log('==================')
    
    if (multipleImages.length < analysisResults.length * 0.8) {
      console.log('⚠️  Less than 80% of products have multiple images')
      console.log('   → Consider running image import to collect all variant files')
    }
    
    if (noImages.length > 0) {
      console.log('❌ Some products have no images')
      console.log('   → Check API connectivity and product configuration')
    }
    
    const avgImagesPerVariant = totalImages / Math.max(totalVariants, 1)
    console.log(`📊 Average images per variant: ${avgImagesPerVariant.toFixed(1)}`)
    
    if (avgImagesPerVariant < 3) {
      console.log('   → Consider implementing mockup generation for more visual options')
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
  }
}

// Run analysis
analyzeImageStatus().catch(console.error)