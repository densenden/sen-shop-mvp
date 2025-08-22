export interface SecureDownloadToken {
  token: string
  expiresAt: number
  maxUsage: number
}

export class SecureDownloadService {
  private static instance: SecureDownloadService
  
  static getInstance(): SecureDownloadService {
    if (!SecureDownloadService.instance) {
      SecureDownloadService.instance = new SecureDownloadService()
    }
    return SecureDownloadService.instance
  }

  /**
   * Generate a secure download token for a file
   */
  async generateSecureToken(
    downloadUrl: string, 
    productId: string, 
    orderId: string, 
    userEmail: string,
    collectionName?: string,
    artworkName?: string
  ): Promise<SecureDownloadToken> {
    try {
      console.log('[SecureDownloadService] Generating token with:', { downloadUrl, productId, orderId, userEmail, collectionName, artworkName })
      
      const response = await fetch('/api/secure-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          downloadUrl,
          productId,
          orderId,
          userEmail,
          collectionName,
          artworkName
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[SecureDownloadService] API Error Response:', errorData)
        throw new Error(`Failed to generate secure token: ${response.statusText} - ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      return {
        token: data.token,
        expiresAt: data.expiresAt,
        maxUsage: data.maxUsage
      }

    } catch (error) {
      console.error('[SecureDownloadService] Error generating token:', error)
      throw error
    }
  }

  /**
   * Create a secure download URL that doesn't reveal the actual file URL
   */
  createSecureDownloadUrl(token: string): string {
    return `/api/secure-download?token=${token}`
  }

  /**
   * Initiate a secure download
   */
  async initiateSecureDownload(token: string, filename?: string): Promise<void> {
    try {
      const secureUrl = this.createSecureDownloadUrl(token)
      
      // Create a temporary link and click it to start download
      const link = document.createElement('a')
      link.href = secureUrl
      link.download = filename || 'download'
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log('[SecureDownloadService] Download initiated for token:', token)

    } catch (error) {
      console.error('[SecureDownloadService] Error initiating download:', error)
      throw error
    }
  }

  /**
   * Check if a token is still valid (client-side check)
   */
  isTokenValid(token: SecureDownloadToken): boolean {
    return Date.now() < token.expiresAt
  }

  /**
   * Format expiration time for display
   */
  formatExpirationTime(expiresAt: number): string {
    const now = Date.now()
    const timeLeft = expiresAt - now
    
    if (timeLeft <= 0) {
      return 'Expired'
    }

    const minutes = Math.floor(timeLeft / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `Expires in ${hours}h ${minutes % 60}m`
    } else {
      return `Expires in ${minutes}m`
    }
  }
}

export const secureDownloadService = SecureDownloadService.getInstance()