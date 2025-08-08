import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: printfulProductId } = req.params
    
    const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY
    if (!PRINTFUL_API_KEY) {
      return res.status(500).json({ error: "Printful API key not configured" })
    }

    // Fetch mockup templates from Printful API v2
    const response = await fetch(`https://api.printful.com/mockup-generator/templates/${printfulProductId}`, {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Printful API error:', response.status)
      return res.status(response.status).json({ 
        error: "Failed to fetch mockup templates from Printful" 
      })
    }

    const data = await response.json()
    
    res.json({
      templates: data.result || []
    })
  } catch (error) {
    console.error("Error fetching mockup templates:", error)
    res.status(500).json({
      error: "Failed to fetch mockup templates",
      details: error.message
    })
  }
}