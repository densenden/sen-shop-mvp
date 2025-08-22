import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

interface DownloadToken {
  token: string
  downloadUrl: string
  productId: string
  orderId: string
  expiresAt: number
  usageCount: number
  maxUsage: number
  collectionName?: string
  artworkName?: string
}

// In-memory store for tokens (in production, use Redis or database)
const tokenStore = new Map<string, DownloadToken>()

// Generate secure token
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Clean up expired tokens
function cleanupExpiredTokens() {
  const now = Date.now()
  for (const [token, data] of tokenStore.entries()) {
    if (data.expiresAt < now) {
      tokenStore.delete(token)
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { downloadUrl, productId, orderId, userEmail, collectionName, artworkName } = req.body

      console.log('[Secure Download] Request body:', { downloadUrl, productId, orderId, userEmail, collectionName, artworkName })

      if (!downloadUrl || !productId || !orderId || !userEmail) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          received: { downloadUrl: !!downloadUrl, productId: !!productId, orderId: !!orderId, userEmail: !!userEmail }
        })
      }

      // Clean up old tokens
      cleanupExpiredTokens()

      // Generate secure token
      const token = generateSecureToken()
      
      // Token expires in 1 hour
      const expiresAt = Date.now() + (60 * 60 * 1000)
      
      // Store token with metadata
      tokenStore.set(token, {
        token,
        downloadUrl,
        productId,
        orderId,
        expiresAt,
        usageCount: 0,
        maxUsage: 10, // Allow 10 downloads per token
        collectionName,
        artworkName
      })

      console.log(`[Secure Download] Generated token for product ${productId}, order ${orderId}`)

      res.status(200).json({
        success: true,
        token,
        expiresAt,
        maxUsage: 10
      })

    } catch (error) {
      console.error('[Secure Download] Error generating token:', error)
      res.status(500).json({ 
        error: 'Failed to generate secure download token',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } 
  
  else if (req.method === 'GET') {
    try {
      const { token } = req.query

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Invalid token' })
      }

      // Clean up expired tokens
      cleanupExpiredTokens()

      const tokenData = tokenStore.get(token)
      
      if (!tokenData) {
        return res.status(404).json({ error: 'Invalid or expired token' })
      }

      // Check if token is expired
      if (tokenData.expiresAt < Date.now()) {
        tokenStore.delete(token)
        return res.status(404).json({ error: 'Token has expired' })
      }

      // Check usage limit
      if (tokenData.usageCount >= tokenData.maxUsage) {
        return res.status(429).json({ error: 'Download limit exceeded' })
      }

      // Increment usage count
      tokenData.usageCount++

      console.log(`[Secure Download] Token ${token} used ${tokenData.usageCount}/${tokenData.maxUsage} times`)

      // Fetch the actual file and return it
      try {
        const response = await fetch(tokenData.downloadUrl)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`)
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream'
        const contentLength = response.headers.get('content-length')
        
        // Create cool filename with actual collection and artwork names
        const fileExt = contentType.includes('zip') ? 'zip' : tokenData.downloadUrl.includes('.png') ? 'png' : 'jpg'
        const orderShort = tokenData.orderId.split('_').pop()?.substring(0, 8) || 'unknown'
        const productShort = tokenData.productId.split('_').pop()?.substring(0, 8) || 'unknown'
        
        // Note: We need collection name and artwork name from the request
        // For now using placeholders - these should be passed from the client
        const collectionName = tokenData.collectionName || 'Collection'
        const artworkName = tokenData.artworkName || 'Artwork'
        
        const coolFilename = `SenCommerce_${collectionName}_${artworkName}_order_${orderShort}_prod_${productShort}.${fileExt}`
        
        // Set appropriate headers for file download
        res.setHeader('Content-Type', contentType)
        res.setHeader('Content-Disposition', `attachment; filename="${coolFilename}"`)
        
        if (contentLength) {
          res.setHeader('Content-Length', contentLength)
        }

        // Stream the file to the client
        const fileBuffer = await response.arrayBuffer()
        res.status(200).send(Buffer.from(fileBuffer))

      } catch (fetchError) {
        console.error('[Secure Download] Error fetching file:', fetchError)
        res.status(500).json({ error: 'Failed to retrieve file' })
      }

    } catch (error) {
      console.error('[Secure Download] Error processing download:', error)
      res.status(500).json({ 
        error: 'Failed to process download',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } 
  
  else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}