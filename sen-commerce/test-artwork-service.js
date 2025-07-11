const { Client } = require('pg')

async function testArtworkService() {
  console.log('Testing direct database access...')
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })
  
  try {
    await client.connect()
    
    // Test artwork collections
    const collections = await client.query('SELECT * FROM artwork_collection LIMIT 2')
    console.log('Collections from DB:', collections.rows)
    
    // Test artworks
    const artworks = await client.query('SELECT * FROM artwork WHERE artwork_collection_id IS NOT NULL LIMIT 3')
    console.log('Artworks from DB:', artworks.rows)
    
    await client.end()
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testArtworkService()