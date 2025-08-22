import type { NextApiRequest, NextApiResponse } from 'next'

type HealthResponse = {
  status: string
  timestamp: string
  uptime: number
  environment: string
  services: {
    backend: string
    [key: string]: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse | { status: string; message: string; timestamp: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed',
      timestamp: new Date().toISOString()
    })
  }

  try {
    // Check backend connectivity
    let backendStatus = 'disconnected'
    try {
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET'
      })
      if (response.ok) {
        backendStatus = 'connected'
      }
    } catch (error) {
      console.error('Backend health check failed:', error)
    }

    const health: HealthResponse = {
      status: backendStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        backend: backendStatus
      }
    }
    
    const statusCode = health.status === 'ok' ? 200 : 503
    res.status(statusCode).json(health)
    
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    })
  }
}