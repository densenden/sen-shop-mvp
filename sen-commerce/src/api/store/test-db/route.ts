import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("Testing database connection...")
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })
    
    await client.connect()
    
    // Test simple query
    const result = await client.query('SELECT COUNT(*) FROM artwork_collection WHERE deleted_at IS NULL')
    console.log("Collection count:", result.rows[0].count)
    
    // Test artwork query
    const artworkResult = await client.query('SELECT COUNT(*) FROM artwork WHERE deleted_at IS NULL')
    console.log("Artwork count:", artworkResult.rows[0].count)
    
    await client.end()
    
    res.json({
      success: true,
      collections_count: result.rows[0].count,
      artworks_count: artworkResult.rows[0].count
    })
    
  } catch (error) {
    console.error("Database test error:", error)
    res.json({
      success: false,
      error: error.message
    })
  }
}