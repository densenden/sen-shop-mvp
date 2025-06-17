require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndFixBucket() {
  console.log('🔍 Checking bucket configuration...')
  
  try {
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
      return
    }
    
    const artworksBucket = buckets.find(b => b.name === 'artworks')
    
    if (!artworksBucket) {
      console.error('❌ Bucket "artworks" not found')
      return
    }
    
    console.log('\n📊 Current bucket configuration:')
    console.log('- Name:', artworksBucket.name)
    console.log('- ID:', artworksBucket.id)
    console.log('- Public:', artworksBucket.public ? '✅ Yes' : '❌ No')
    console.log('- Created:', artworksBucket.created_at)
    
    if (!artworksBucket.public) {
      console.log('\n⚠️  Bucket is not public!')
      console.log('\n📝 To make it public, you need to:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to Storage > artworks bucket')
      console.log('3. Click the gear icon (⚙️) next to the bucket name')
      console.log('4. Toggle "Public bucket" to ON')
      console.log('5. Save the changes')
      console.log('\nAlternatively, run this SQL in Supabase SQL Editor:')
      console.log(`UPDATE storage.buckets SET public = true WHERE name = 'artworks';`)
    }
    
    // Test file upload and URL
    console.log('\n🧪 Testing file access...')
    const testFileName = 'test-public-access.txt'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(testFileName, 'Test content', { upsert: true })
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message)
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('artworks')
        .getPublicUrl(testFileName)
      
      console.log('📎 Test file URL:', publicUrl)
      
      // Try to fetch the URL
      try {
        const response = await fetch(publicUrl)
        if (response.ok) {
          console.log('✅ Public URL is accessible!')
        } else {
          console.log('❌ Public URL returned:', response.status, response.statusText)
          const errorText = await response.text()
          console.log('Error response:', errorText)
        }
      } catch (fetchError) {
        console.error('❌ Failed to fetch URL:', fetchError.message)
      }
      
      // Clean up test file
      await supabase.storage.from('artworks').remove([testFileName])
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkAndFixBucket() 