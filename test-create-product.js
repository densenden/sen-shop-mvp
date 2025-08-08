// Simple test for product creation
async function testProductCreation() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('Testing product creation API...\n');
  
  // Test 1: Create service product without artwork (should work)
  console.log('Test 1: Service product without artwork');
  const serviceResponse = await fetch('http://localhost:9000/admin/products/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_type: 'service',
      title: 'Test Service Product',
      description: 'A test service',
      price: 5000 // $50.00
    })
  });
  
  const serviceResult = await serviceResponse.json();
  if (serviceResponse.ok) {
    console.log('✅ Service product created successfully');
  } else {
    console.log('❌ Service product failed:', serviceResult.error);
  }
  
  // Test 2: Digital product without digital_product_id (should fail)
  console.log('\nTest 2: Digital product without digital_product_id');
  const digitalResponse = await fetch('http://localhost:9000/admin/products/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_type: 'digital',
      title: 'Test Digital Product',
      description: 'A test digital product',
      price: 1000 // $10.00
    })
  });
  
  const digitalResult = await digitalResponse.json();
  if (!digitalResponse.ok && digitalResult.error.includes('digital_product_id')) {
    console.log('✅ Correctly requires digital_product_id');
  } else {
    console.log('❌ Should have failed for missing digital_product_id');
  }
  
  console.log('\n✅ All tests completed');
}

testProductCreation().catch(console.error);