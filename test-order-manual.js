const axios = require('axios');

const API_URL = 'http://localhost:9000';
const API_KEY = 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0';

const testUserEmail = 'test.manual@example.com';
const digitalProductId = 'prod_01K1JA8M5X255SZFTXRSECEGEJ'; // Digital Art Download

async function testManualOrder() {
  try {
    console.log('\n=== Manual Order Test for Digital Product ===\n');
    
    // 1. Get product directly
    console.log('1. Getting product details...');
    try {
      const productResponse = await axios.get(`${API_URL}/store/products?handle=digital-art-download`, {
        headers: {
          'x-publishable-api-key': API_KEY
        }
      });
      
      if (productResponse.data.products.length > 0) {
        const product = productResponse.data.products[0];
        console.log(`Found product via API: ${product.title}`);
        console.log(`Metadata:`, product.metadata);
      } else {
        console.log('Product not found via API, will use direct variant ID');
      }
    } catch (err) {
      console.log('Could not fetch via products API, continuing with direct variant...');
    }
    
    // 2. Use the variant ID we know exists
    const variantId = 'variant_01K1JA8M5X6P2EVZQW14TTG17W'; // Print Resolution variant
    console.log(`\n2. Using known variant ID: ${variantId}`);
    
    // 3. Create cart
    console.log('\n3. Creating cart...');
    const cartResponse = await axios.post(`${API_URL}/store/carts`, {}, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });
    
    const cart = cartResponse.data.cart;
    console.log(`Cart created: ${cart.id}`);
    
    // 4. Add variant directly
    console.log('\n4. Adding digital product variant to cart...');
    const addItemResponse = await axios.post(`${API_URL}/store/carts/${cart.id}/line-items`, {
      variant_id: variantId,
      quantity: 1
    }, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });
    
    console.log('Item added to cart successfully');
    
    // 5. Set customer email
    console.log('\n5. Setting customer email...');
    await axios.post(`${API_URL}/store/carts/${cart.id}`, {
      email: testUserEmail
    }, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });
    console.log(`Email set: ${testUserEmail}`);
    
    // 6. Add addresses
    console.log('\n6. Adding addresses...');
    await axios.post(`${API_URL}/store/carts/${cart.id}`, {
      shipping_address: {
        first_name: 'Test',
        last_name: 'Manual',
        address_1: '123 Digital Street',
        city: 'Test City',
        country_code: 'US',
        postal_code: '12345',
        phone: '+1234567890'
      },
      billing_address: {
        first_name: 'Test',
        last_name: 'Manual',
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
    
    // 7. Initialize payment
    console.log('\n7. Initializing payment session...');
    await axios.post(`${API_URL}/store/carts/${cart.id}/payment-sessions`, {}, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });
    
    await axios.post(`${API_URL}/store/carts/${cart.id}/payment-sessions/manual/update`, {
      data: {}
    }, {
      headers: {
        'x-publishable-api-key': API_KEY
      }
    });
    console.log('Payment session initialized');
    
    // 8. Complete order
    console.log('\n8. Completing order...');
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
    console.log(`Items in order: ${order.items?.length || 0}`);
    
    if (order.items) {
      order.items.forEach((item, i) => {
        console.log(`\nItem ${i + 1}:`);
        console.log(`  Title: ${item.title}`);
        console.log(`  Metadata:`, item.metadata);
        console.log(`  Price: €${(item.unit_price / 100).toFixed(2)}`);
      });
    }
    
    // 9. Check downloads
    console.log('\n9. Checking for downloads...');
    const downloadsResponse = await axios.get(
      `${API_URL}/store/downloads?customer_email=${encodeURIComponent(testUserEmail)}`,
      {
        headers: {
          'x-publishable-api-key': API_KEY
        }
      }
    );
    
    console.log(`Found ${downloadsResponse.data.downloads.length} download(s)`);
    
    if (downloadsResponse.data.downloads.length > 0) {
      downloadsResponse.data.downloads.forEach((dl, i) => {
        console.log(`\nDownload ${i + 1}:`);
        console.log(`  Product: ${dl.product_name}`);
        console.log(`  URL: ${dl.download_url}`);
      });
    }
    
    // 10. Test account page
    console.log('\n10. Testing account page orders API...');
    const accountResponse = await axios.get(
      `${API_URL}/store/account/orders?customer_email=${encodeURIComponent(testUserEmail)}`,
      {
        headers: {
          'x-publishable-api-key': API_KEY
        }
      }
    );
    
    console.log(`Account has ${accountResponse.data.orders.length} order(s)`);
    
    if (accountResponse.data.orders.length > 0) {
      const latestOrder = accountResponse.data.orders[0];
      console.log(`\nLatest order details:`);
      console.log(`  ID: #${latestOrder.display_id}`);
      console.log(`  Total: €${(latestOrder.total / 100).toFixed(2)}`);
      console.log(`  Subtotal: €${(latestOrder.subtotal / 100).toFixed(2)}`);
      console.log(`  Items: ${latestOrder.items?.length || 0}`);
      
      if (latestOrder.items) {
        latestOrder.items.forEach((item, i) => {
          console.log(`\n  Item ${i + 1}:`);
          console.log(`    Title: ${item.title}`);
          console.log(`    Unit Price: €${(item.unit_price / 100).toFixed(2)}`);
          console.log(`    Total: €${(item.total / 100).toFixed(2)}`);
          console.log(`    Thumbnail: ${item.thumbnail || 'None'}`);
          console.log(`    Type: ${item.metadata?.fulfillment_type || 'standard'}`);
        });
      }
    }
    
    console.log('\n=== Test Complete ===');
    console.log('Summary:');
    console.log('✅ Order created with known digital product variant');
    console.log(`✅ Order total: €${(order.total / 100).toFixed(2)}`);
    console.log(`${downloadsResponse.data.downloads.length > 0 ? '✅' : '❌'} Digital downloads available`);
    console.log(`${accountResponse.data.orders.length > 0 ? '✅' : '❌'} Order visible in account`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testManualOrder();