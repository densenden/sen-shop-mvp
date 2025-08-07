const fetch = require('node-fetch');

const API_TOKEN = "vyDUCpUttBXTBobLEdwEGzKXm26VH5BQ8ReFE2sk";
const productId = "388838163";

async function testGetProduct() {
  console.log(`Testing Printful product fetch for ID: ${productId}`);
  
  try {
    // Try V1 API first
    const v1Response = await fetch(`https://api.printful.com/store/products/${productId}`, {
      headers: { 
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
    });
    
    console.log(`V1 API Status: ${v1Response.status}`);
    
    if (v1Response.ok) {
      const v1Data = await v1Response.json();
      console.log("V1 Product Data:", JSON.stringify(v1Data, null, 2));
    } else {
      const errorText = await v1Response.text();
      console.log("V1 API Error:", errorText);
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testGetProduct();
