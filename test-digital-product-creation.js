async function testDigitalProductCreation() {
  const fetch = (await import('node-fetch')).default;
  console.log('Testing digital product creation without artwork_id...\n');
  
  try {
    // Use a dummy digital product ID (since we're testing the product creation, not digital product linking)
    const digitalProductId = 'test-digital-product-' + Date.now();
    console.log('Using digital product ID:', digitalProductId);
    
    // Test creating a product WITHOUT artwork_id
    const createResponse = await fetch('http://localhost:9000/admin/products/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'sid=eyJpZCI6InVzZXJfMDFKWjJBWDBOV0ExWUtLQ0xMWVdRQ1ZBRFAifQ%3D%3D.IyJfcmFpbHMiLCJzZXNzaW9uX2lkIiwicGF0aCIsInN0b3JlIiwibWVkaWNhbF9pdGVtcyJd.q81eUh7BoQvuHV84lQJFGHiPGrN1BzrNBcQJA4eBo0Y'
      },
      body: JSON.stringify({
        product_type: 'digital',
        title: 'Test Digital Product - No Artwork',
        description: 'Testing digital product creation without artwork',
        price: 999, // $9.99
        digital_product_id: digitalProductId
      })
    });
    
    const result = await createResponse.json();
    
    if (createResponse.ok) {
      console.log('\n✅ SUCCESS! Digital product created without artwork_id');
      console.log('Product ID:', result.product?.id);
      console.log('Product Title:', result.product?.title);
      console.log('Product Type:', result.product?.metadata?.fulfillment_type);
    } else {
      console.log('\n❌ ERROR:', result.error);
      console.log('Details:', result);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDigitalProductCreation();
