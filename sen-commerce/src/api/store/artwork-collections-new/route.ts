import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("ARTWORK COLLECTIONS NEW ENDPOINT CALLED")
    
    // Mock data that matches the database structure for testing
    const mockCollections = [
      {
        id: "01JXZE24MHVCJ2SSENQMP1TH70",
        name: "Brobrella",
        description: "Born from the streets of Frankfurt and refined by brotherhood, Brobrella emerged in March 2024 as more than just a clothing brand—it's a movement.",
        topic: "Urban Streetwear",
        thumbnail_url: "https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/1750180362859-4xkaun.jpg",
        brand_tagline: "We don't just wear the brand—we live the brotherhood.",
        created_at: "2025-06-17T17:12:49.044Z",
        artworks: [
          {
            id: "01JXZEAHZX9Y9MJAPRWQZ8N3XX",
            title: "Gothic Shelter",
            description: "Dark gothic design representing protection and brotherhood",
            image_url: "https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/1750179866259-v25f8d.jpg",
            artwork_collection_id: "01JXZE24MHVCJ2SSENQMP1TH70",
            product_ids: ["prod_01JY1AWA7HJ0CYDSAKX7JRNTC3"]
          },
          {
            id: "01JXZEBV8X8VKJ49R5BJ9X0H24",
            title: "Storm Breaker",
            description: "Powerful imagery of breaking through life's storms",
            image_url: "https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/1750179872483-uzevb.jpg",
            artwork_collection_id: "01JXZE24MHVCJ2SSENQMP1TH70",
            product_ids: ["prod_01JY1AWA7HJ0CYDSAKX7JRNTC3"]
          },
          {
            id: "01JXZE99T2ZKRS3TJMSEX6JGSV",
            title: "Silent Guardian",
            description: "Minimalist design representing silent protection",
            image_url: "https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/1750179880587-2jr8e.jpg",
            artwork_collection_id: "01JXZE24MHVCJ2SSENQMP1TH70",
            product_ids: ["prod_01JY1AWA7HJ0CYDSAKX7JRNTC3"]
          }
        ]
      },
      {
        id: "01JZTBBKVXMG0KMYC12B87FFPW",
        name: "Coolo",
        description: "Modern cool designs for contemporary lifestyle",
        topic: "Modern Art",
        thumbnail_url: null,
        brand_tagline: "Stay Cool, Stay Creative",
        created_at: "2025-07-10T14:20:45.309Z",
        artworks: []
      }
    ]
    
    console.log("Mock collections prepared:", mockCollections.length)
    
    res.json({
      collections: mockCollections,
      count: mockCollections.length
    })
    
  } catch (error) {
    console.error("Error fetching artwork collections for store:", error)
    
    res.json({
      collections: [],
      count: 0
    })
  }
}