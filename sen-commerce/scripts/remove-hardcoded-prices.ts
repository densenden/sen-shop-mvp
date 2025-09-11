import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

async function removeHardcodedPrices() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('Connected to database')

    // Find all hardcoded 20€ (2000) and 18€ (1800) prices
    const findPricesQuery = `
      SELECT id, amount, currency_code, price_set_id 
      FROM price 
      WHERE amount IN (2000, 1800)
    `
    
    const result = await client.query(findPricesQuery)
    console.log(`Found ${result.rows.length} hardcoded prices to remove:`)
    
    result.rows.forEach(row => {
      console.log(`- Price ID: ${row.id}, Amount: ${row.amount}, Currency: ${row.currency_code}`)
    })

    if (result.rows.length > 0) {
      // Delete the hardcoded prices
      const deletePricesQuery = `
        DELETE FROM price 
        WHERE amount IN (2000, 1800)
      `
      
      const deleteResult = await client.query(deletePricesQuery)
      console.log(`Deleted ${deleteResult.rowCount} hardcoded prices`)
    } else {
      console.log('No hardcoded prices found to remove')
    }

    console.log('Price cleanup completed successfully')

  } catch (error) {
    console.error('Error removing hardcoded prices:', error)
    throw error
  } finally {
    await client.end()
  }
}

// Run the script
removeHardcodedPrices()
  .then(() => {
    console.log('Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })