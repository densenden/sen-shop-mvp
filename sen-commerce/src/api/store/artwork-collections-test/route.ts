import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("Getting artwork collections for store (test endpoint)...")
    
    // Direct database access
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })
    
    await client.connect()
    
    // Get collections with their artworks
    const collectionsQuery = await client.query(`
      SELECT 
        ac.*,
        json_agg(
          json_build_object(
            'id', a.id,
            'title', a.title,
            'description', a.description,
            'image_url', a.image_url,
            'artwork_collection_id', a.artwork_collection_id,
            'product_ids', a.product_ids
          )
        ) FILTER (WHERE a.id IS NOT NULL) as artworks
      FROM artwork_collection ac
      LEFT JOIN artwork a ON ac.id = a.artwork_collection_id
      WHERE ac.deleted_at IS NULL
      GROUP BY ac.id
    `)
    
    await client.end()
    
    const collections = collectionsQuery.rows.map(row => ({
      ...row,
      artworks: row.artworks || []
    }))
    
    console.log("Direct DB collections retrieved:", collections.length)
    
    res.json({
      collections: collections || [],
      count: collections?.length || 0
    })
    
  } catch (error) {
    console.error("Error fetching artwork collections for store:", error)
    console.error("Error details:", error.stack)
    
    // If everything fails, return empty array so storefront doesn't break
    res.json({
      collections: [],
      count: 0
    })
  }
}