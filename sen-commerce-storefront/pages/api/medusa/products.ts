import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Try to connect to the Medusa server
    const medusaUrl = 'http://localhost:9000/store/products'
    
    try {
      const response = await fetch(medusaUrl)
      if (response.ok) {
        const data = await response.json()
        return res.status(200).json(data)
      }
    } catch (error) {
      console.log('Medusa server not available, using fallback data')
    }
    
    // Fallback data - Medusa seed products
    const products = [
      {
        id: "prod_medusa_tshirt",
        title: "Medusa T-Shirt",
        handle: "t-shirt",
        description: "Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary.",
        status: "published",
        thumbnail: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
        images: [
          { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png" },
          { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png" },
          { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png" },
          { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png" }
        ],
        price: 1500,
        currency_code: "usd",
        variants: [
          {
            id: "var_shirt_s_black",
            title: "S / Black",
            sku: "SHIRT-S-BLACK",
            price: 1500,
            inventory_quantity: 100
          },
          {
            id: "var_shirt_m_black",
            title: "M / Black", 
            sku: "SHIRT-M-BLACK",
            price: 1500,
            inventory_quantity: 100
          },
          {
            id: "var_shirt_l_black",
            title: "L / Black",
            sku: "SHIRT-L-BLACK",
            price: 1500,
            inventory_quantity: 100
          }
        ],
        tags: ["medusa", "clothing", "cotton"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "prod_medusa_sweatshirt",
        title: "Medusa Sweatshirt", 
        handle: "sweatshirt",
        description: "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.",
        status: "published",
        thumbnail: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
        images: [
          { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png" },
          { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png" }
        ],
        price: 1500,
        currency_code: "usd",
        variants: [
          {
            id: "var_sweatshirt_s",
            title: "S",
            sku: "SWEATSHIRT-S",
            price: 1500,
            inventory_quantity: 100
          },
          {
            id: "var_sweatshirt_m",
            title: "M", 
            sku: "SWEATSHIRT-M",
            price: 1500,
            inventory_quantity: 100
          },
          {
            id: "var_sweatshirt_l",
            title: "L",
            sku: "SWEATSHIRT-L",
            price: 1500,
            inventory_quantity: 100
          }
        ],
        tags: ["medusa", "clothing", "cotton", "sweatshirt"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "prod_medusa_sweatpants",
        title: "Medusa Sweatpants",
        handle: "sweatpants", 
        description: "Reimagine the feeling of classic sweatpants. With our cotton sweatpants, everyday essentials no longer have to be ordinary.",
        status: "published",
        thumbnail: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png",
        images: [
          { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png" },
          { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-back.png" }
        ],
        price: 1500,
        currency_code: "usd",
        variants: [
          {
            id: "var_sweatpants_s",
            title: "S",
            sku: "SWEATPANTS-S",
            price: 1500,
            inventory_quantity: 100
          },
          {
            id: "var_sweatpants_m",
            title: "M",
            sku: "SWEATPANTS-M", 
            price: 1500,
            inventory_quantity: 100
          }
        ],
        tags: ["medusa", "clothing", "cotton", "pants"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "prod_medusa_shorts",
        title: "Medusa Shorts",
        handle: "shorts",
        description: "Reimagine the feeling of classic shorts. With our cotton shorts, everyday essentials no longer have to be ordinary.",
        status: "published", 
        thumbnail: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png",
        images: [
          { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png" },
          { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png" }
        ],
        price: 1500,
        currency_code: "usd",
        variants: [
          {
            id: "var_shorts_s",
            title: "S",
            sku: "SHORTS-S",
            price: 1500,
            inventory_quantity: 100
          },
          {
            id: "var_shorts_m",
            title: "M",
            sku: "SHORTS-M",
            price: 1500,
            inventory_quantity: 100
          }
        ],
        tags: ["medusa", "clothing", "cotton", "shorts"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    
    res.status(200).json({
      products,
      count: products.length,
      limit: 20,
      offset: 0
    })
    
  } catch (error) {
    console.error('API error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch products',
      message: error.message 
    })
  }
}