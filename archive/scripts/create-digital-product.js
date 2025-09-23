const axios = require('axios');

const ADMIN_URL = 'http://localhost:9000/admin';
const API_URL = 'http://localhost:9000';

async function createDigitalProduct() {
  try {
    console.log('Creating a digital download product...\n');
    
    // First, get admin auth token (in a real scenario, you'd login)
    // For testing, we'll create directly through the store API
    
    // Create a product with digital download metadata
    const productData = {
      title: "Digital Artwork - Test Download",
      handle: "digital-artwork-test",
      description: "A test digital artwork for download testing",
      status: "published",
      metadata: {
        fulfillment_type: "digital_download",
        digital_download_url: "https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/test-artwork.jpg",
        supabase_url: "https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/test-artwork.jpg",
        file_size: 1024000,
        mime_type: "image/jpeg"
      },
      images: [
        {
          url: "https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/test-artwork.jpg"
        }
      ],
      thumbnail: "https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/test-artwork.jpg",
      variants: [
        {
          title: "Digital Download",
          sku: "DIGITAL-TEST-001",
          manage_inventory: false,
          prices: [
            {
              amount: 2999, // €29.99
              currency_code: "eur"
            }
          ],
          options: []
        }
      ],
      options: [],
      categories: []
    };
    
    // Since we need admin access, let's create a simpler version through a custom endpoint
    console.log('Product data prepared:', JSON.stringify(productData, null, 2));
    
    console.log('\nTo create this product:');
    console.log('1. Go to http://localhost:9000/app');
    console.log('2. Login to admin panel');
    console.log('3. Go to Products > Create Product');
    console.log('4. Fill in the following details:');
    console.log('   - Title: Digital Artwork - Test Download');
    console.log('   - Handle: digital-artwork-test');
    console.log('   - Price: €29.99');
    console.log('   - In metadata, add:');
    console.log('     - fulfillment_type: digital_download');
    console.log('     - digital_download_url: https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/test-artwork.jpg');
    
    // Alternative: Use the admin API directly if we have the session
    console.log('\nAlternatively, checking if we can use the admin API...');
    
    // Try to use the admin digital products endpoint
    try {
      const response = await axios.post(`${ADMIN_URL}/digital-products`, {
        name: "Digital Artwork - Test Download",
        product_id: null, // Will be created
        file_url: "https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/test-artwork.jpg",
        storage_bucket: "artworks",
        storage_path: "test-artwork.jpg",
        mime_type: "image/jpeg",
        file_size: 1024000,
        max_downloads: -1,
        expires_in_days: null,
        is_active: true
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Digital product created:', response.data);
    } catch (adminError) {
      console.log('Admin API not accessible. Please create the product manually through the admin panel.');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createDigitalProduct();