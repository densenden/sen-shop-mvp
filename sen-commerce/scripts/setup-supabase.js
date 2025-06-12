const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'artworks'

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in environment variables')
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file')
  process.exit(1)
}

const isServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ? true : false
const supabase = createClient(supabaseUrl, supabaseKey)

async function setupSupabaseBucket() {
  try {
    console.log('Setting up Supabase storage bucket...')
    console.log(`Using Supabase URL: ${supabaseUrl}`)
    console.log(`Bucket name: ${bucketName}`)
    console.log(`Key type: ${isServiceRole ? 'Service Role' : 'Anon'}`)

    let bucketExists = false

    if (isServiceRole) {
      // Service role can list buckets
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.error('Error listing buckets:', listError)
        return
      }

      bucketExists = buckets.some(bucket => bucket.name === bucketName)

      if (bucketExists) {
        console.log(`✅ Bucket "${bucketName}" already exists`)
      } else {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        })

        if (error) {
          console.error('Error creating bucket:', error)
          return
        } else {
          console.log(`✅ Successfully created bucket "${bucketName}"`)
          bucketExists = true
        }
      }
    } else {
      // Anon key - assume bucket exists and test directly
      console.log('⚠️  Using anon key - cannot list buckets. Testing bucket directly...')
      bucketExists = true // Assume it exists, will fail in test if not
    }

    // Test upload to verify bucket is working
    if (bucketExists) {
      console.log('Testing bucket accessibility...')
      
      // Create a minimal valid PNG image (1x1 pixel, transparent)
      const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk size
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // width: 1
        0x00, 0x00, 0x00, 0x01, // height: 1
        0x08, 0x06, // bit depth: 8, color type: 6 (truecolor with alpha)
        0x00, 0x00, 0x00, // compression, filter, interlace
        0x1F, 0x15, 0xC4, 0x89, // CRC
        0x00, 0x00, 0x00, 0x0A, // IDAT chunk size
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
        0xE5, 0x27, 0xDE, 0xFC, // CRC
        0x00, 0x00, 0x00, 0x00, // IEND chunk size
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // CRC
      ])
      
      const testPath = `test/test-image-${Date.now()}.png`

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(testPath, pngData, {
          contentType: 'image/png',
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error('❌ Bucket test failed:', uploadError)
        
        if (uploadError.message && uploadError.message.includes('Bucket not found')) {
          console.log('\n💡 The bucket does not exist. Please:')
          console.log('1. Create the bucket manually in Supabase Dashboard')
          console.log('2. Or add SUPABASE_SERVICE_ROLE_KEY to your .env file')
        } else if (uploadError.message && uploadError.message.includes('mime type')) {
          console.log('\n💡 MIME type restriction detected.')
          console.log('To fix this, go to Supabase Dashboard > Storage > Bucket Settings:')
          console.log('- Add the required MIME types')
          console.log('- Or remove all MIME type restrictions')
        } else if (uploadError.message && uploadError.message.includes('already exists')) {
          // File already exists, that's actually good - means bucket works
          console.log('✅ Bucket test successful (file already exists)')
          bucketExists = true
        }
      } else {
        console.log('✅ Bucket test successful')
        
        // Clean up test file
        await supabase.storage.from(bucketName).remove([testPath])
      }
    }

    // Get bucket info
    console.log('\n📊 Bucket Configuration:')
    console.log(`- Name: ${bucketName}`)
    console.log(`- URL: ${supabaseUrl}/storage/v1/object/public/${bucketName}/`)
    
    if (bucketExists) {
      console.log('\n✅ Setup complete! Your artwork module is ready to use.')
    } else {
      console.log('\n❌ Setup incomplete. Please create the bucket manually or use a service role key.')
    }

  } catch (error) {
    console.error('Setup failed:', error)
    
    if (error.message && error.message.includes('Invalid API key')) {
      console.log('\n💡 Check your Supabase credentials in the .env file')
    }
  }
}

setupSupabaseBucket() 