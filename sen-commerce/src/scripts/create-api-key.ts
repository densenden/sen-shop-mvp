export default async function createApiKey() {
  console.log("Creating publishable API key...")
  
  try {
    // Use medusa's database connection
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    })
    
    const key = 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0'
    
    // Insert the publishable API key
    await pool.query(`
      INSERT INTO publishable_api_key (id, title, created_at, updated_at) 
      VALUES ($1, $2, NOW(), NOW()) 
      ON CONFLICT (id) DO NOTHING
    `, [key, 'Storefront API Key'])
    
    // Create default sales channel
    await pool.query(`
      INSERT INTO sales_channel (id, name, description, is_default, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, ['sc_default', 'Default Sales Channel', 'Default sales channel for the storefront', true])
    
    // Link API key to sales channel
    await pool.query(`
      INSERT INTO publishable_api_key_sales_channel (publishable_api_key_id, sales_channel_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [key, 'sc_default'])
    
    console.log("✅ Created publishable API key:", key)
    console.log("✅ Created sales channel: sc_default")
    console.log("✅ Linked API key to sales channel")
    
    await pool.end()
    
    return { success: true, key }
  } catch (error) {
    console.error("❌ Error creating API key:", error)
    return { success: false, error: error.message }
  }
}