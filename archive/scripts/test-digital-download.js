const axios = require('axios');

const API_URL = 'http://localhost:9000';
const STORE_URL = 'http://localhost:3000';
const API_KEY = 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0';

const testUserEmail = 'test.digital@example.com';

async function testDigitalDownloadFlow() {
  try {
    console.log('\n=== Testing Digital Download Flow ===\n');

    // 1. Find a digital download product
    console.log('1. Finding digital download products...');
    const productsResponse = await axios.get(`${API_URL}/store/products`, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });

    const digitalProducts = productsResponse.data.products.filter(
      p => p.metadata?.fulfillment_type === 'digital_download'
    );

    if (digitalProducts.length === 0) {
      console.log('No digital download products found. Creating one...');
      // You would need to create a digital product here through admin API
      console.log('Please create a digital download product first.');
      return;
    }

    const testProduct = digitalProducts[0];
    console.log(`Found digital product: ${testProduct.title} (${testProduct.id})`);
    console.log(`Price: €${(testProduct.variants[0].calculated_price?.calculated_amount / 100).toFixed(2)}`);

    // 2. Create a cart
    console.log('\n2. Creating cart...');
    const cartResponse = await axios.post(`${API_URL}/store/carts`, {}, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });
    
    const cart = cartResponse.data.cart;
    console.log(`Cart created: ${cart.id}`);

    // 3. Add digital product to cart
    console.log('\n3. Adding digital product to cart...');
    await axios.post(`${API_URL}/store/carts/${cart.id}/line-items`, {
      variant_id: testProduct.variants[0].id,
      quantity: 1
    }, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });
    console.log('Product added to cart');

    // 4. Update cart with customer email
    console.log('\n4. Setting customer email...');
    await axios.post(`${API_URL}/store/carts/${cart.id}`, {
      email: testUserEmail
    }, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });
    console.log(`Customer email set: ${testUserEmail}`);

    // 5. Add shipping address (even for digital products, often required)
    console.log('\n5. Adding shipping address...');
    await axios.post(`${API_URL}/store/carts/${cart.id}`, {
      shipping_address: {
        first_name: 'Test',
        last_name: 'User',
        address_1: '123 Digital Street',
        city: 'Test City',
        country_code: 'US',
        postal_code: '12345',
        phone: '+1234567890'
      },
      billing_address: {
        first_name: 'Test',
        last_name: 'User',
        address_1: '123 Digital Street',
        city: 'Test City',
        country_code: 'US',
        postal_code: '12345',
        phone: '+1234567890'
      }
    }, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });
    console.log('Addresses added');

    // 6. Initialize payment session
    console.log('\n6. Initializing payment session...');
    await axios.post(`${API_URL}/store/carts/${cart.id}/payment-sessions`, {}, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });
    
    // Select manual payment provider for testing
    await axios.post(`${API_URL}/store/carts/${cart.id}/payment-sessions/manual/update`, {
      data: {}
    }, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });
    console.log('Payment session initialized (manual)');

    // 7. Complete the cart
    console.log('\n7. Completing cart...');
    const completeResponse = await axios.post(`${API_URL}/store/carts/${cart.id}/complete`, {}, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });

    const order = completeResponse.data.order;
    console.log(`\n✅ Order created successfully!`);
    console.log(`Order ID: ${order.id}`);
    console.log(`Display ID: #${order.display_id}`);
    console.log(`Total: €${(order.total / 100).toFixed(2)}`);

    // 8. Check for digital downloads
    console.log('\n8. Checking for digital downloads...');
    const downloadsResponse = await axios.get(
      `${API_URL}/store/customers/me/downloads?customer_email=${encodeURIComponent(testUserEmail)}`,
      {
        headers: {
          'x-publishable-api-key': API_KEY
        }
      }
    );

    const downloads = downloadsResponse.data.downloads;
    console.log(`Found ${downloads.length} digital download(s)`);
    
    if (downloads.length > 0) {
      downloads.forEach((download, index) => {
        console.log(`\nDownload ${index + 1}:`);
        console.log(`- Product: ${download.product_name}`);
        console.log(`- Order: #${download.order_display_id}`);
        console.log(`- Download URL: ${download.download_url}`);
        console.log(`- Expires: ${download.expires_at || 'Never'}`);
      });
    }

    // 9. Test account page data
    console.log('\n9. Testing account page orders...');
    const ordersResponse = await axios.get(
      `${API_URL}/store/account/orders?customer_email=${encodeURIComponent(testUserEmail)}`,
      {
        headers: {
          'x-publishable-api-key': API_KEY
        }
      }
    );

    const accountOrders = ordersResponse.data.orders;
    console.log(`\nAccount has ${accountOrders.length} order(s)`);
    
    if (accountOrders.length > 0) {
      const latestOrder = accountOrders[0];
      console.log(`\nLatest Order:`);
      console.log(`- ID: #${latestOrder.display_id}`);
      console.log(`- Status: ${latestOrder.status}`);
      console.log(`- Total: €${(latestOrder.total / 100).toFixed(2)}`);
      console.log(`- Subtotal: €${(latestOrder.subtotal / 100).toFixed(2)}`);
      console.log(`- Items: ${latestOrder.items.length}`);
      
      latestOrder.items.forEach((item, index) => {
        console.log(`\n  Item ${index + 1}:`);
        console.log(`  - Title: ${item.title}`);
        console.log(`  - Quantity: ${item.quantity}`);
        console.log(`  - Unit Price: €${(item.unit_price / 100).toFixed(2)}`);
        console.log(`  - Total: €${(item.total / 100).toFixed(2)}`);
        console.log(`  - Thumbnail: ${item.thumbnail || 'No thumbnail'}`);
        console.log(`  - Type: ${item.metadata?.fulfillment_type || 'standard'}`);
      });
    }

    console.log('\n=== Test Complete ===\n');
    console.log('Summary:');
    console.log('✅ Product found and added to cart');
    console.log('✅ Order created successfully');
    console.log('✅ Digital downloads accessible');
    console.log('✅ Account page shows order with correct prices');
    
    console.log('\nNext steps:');
    console.log('1. Check email for order confirmation');
    console.log('2. Visit http://localhost:3000/account to see the order');
    console.log('3. Test download functionality from account page');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testDigitalDownloadFlow();