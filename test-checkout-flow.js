#!/usr/bin/env node
const API_BASE = 'http://localhost:9000';
const HEADERS = {
  'x-publishable-api-key': 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0',
  'Content-Type': 'application/json'
};

async function apiCall(endpoint, method = 'GET', body = null, headers = {}) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: { ...HEADERS, ...headers },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    console.log(`🔄 ${method} ${endpoint}`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} - ${JSON.stringify(data)}`);
      throw new Error(`API Error: ${response.status}`);
    }
    
    console.log(`✅ Success: ${response.status}`);
    return data;
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    throw error;
  }
}

async function testCheckoutFlow() {
  console.log('🧪 Starting E2E Checkout Test\n');
  
  try {
    // Step 1: Get products
    console.log('📦 Step 1: Fetching products...');
    const productsRes = await apiCall('/store/products');
    const products = productsRes.products.filter(p => p.status === 'published');
    
    if (products.length === 0) {
      throw new Error('No published products found');
    }
    
    const testProduct = products[0];
    const testVariant = testProduct.variants[0];
    console.log(`   Using product: ${testProduct.title} (${testProduct.id})`);
    console.log(`   Using variant: ${testVariant.title} (${testVariant.id})\n`);
    
    // Step 2: Create cart using Europe region
    console.log('🛒 Step 2: Creating cart...');
    const cartRes = await apiCall('/store/carts', 'POST', {
      region_id: 'reg_01JXAMMJEW67HVN6167BJ7513K',
      currency_code: 'eur'
    });
    const cartId = cartRes.cart.id;
    console.log(`   Cart created: ${cartId}\n`);
    
    // Step 3: Add item to cart
    console.log('➕ Step 3: Adding item to cart...');
    const addItemRes = await apiCall('/store/cart/items', 'POST', {
      product_id: testProduct.id,
      variant_id: testVariant.id,
      quantity: 2
    }, { 'x-cart-id': cartId });
    
    console.log(`   Item added. Cart total: $${(addItemRes.cart.total / 100).toFixed(2)}\n`);
    
    // Step 4: Update shipping address
    console.log('🏠 Step 4: Setting shipping address...');
    const addressRes = await apiCall('/store/cart/addresses', 'PUT', {
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        address_1: '123 Test Street',
        city: 'Berlin',
        postal_code: '10115',
        country_code: 'DE',
        province: 'Berlin'
      }
    }, { 'x-cart-id': cartId });
    
    console.log('   Shipping address set\n');
    
    // Step 5: Create payment session
    console.log('💳 Step 5: Creating payment session...');
    const paymentRes = await apiCall('/store/payment-sessions', 'POST', {
      cart_id: cartId,
      provider_id: 'stripe',
      data: {
        customer: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe'
        },
        amount: addressRes.cart.total,
        currency: 'usd'
      }
    });
    
    console.log('   Payment session created\n');
    
    // Step 6: Complete checkout (simulate)
    console.log('✅ Step 6: Simulating checkout completion...');
    const checkoutRes = await apiCall('/store/checkout', 'POST', {
      cart_id: cartId,
      payment_provider: 'stripe',
      customer_info: {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      }
    });
    
    console.log('   Checkout completed successfully!\n');
    
    console.log('🎉 ALL TESTS PASSED!');
    console.log(`   Final cart total: $${(addressRes.cart.total / 100).toFixed(2)}`);
    console.log(`   Items in cart: ${addressRes.cart.items.length}`);
    
  } catch (error) {
    console.error('❌ CHECKOUT FLOW FAILED:', error.message);
    process.exit(1);
  }
}

// Run the test
testCheckoutFlow();