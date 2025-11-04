'use client'

import { GTProvider as GTProviderBase } from 'gt-react'
import { ReactNode, useState, useEffect } from 'react'

interface GTProviderProps {
  children: ReactNode
  projectId: string
  apiKey: string
}

export function GTProvider({ children, projectId, apiKey }: GTProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!projectId || !apiKey) {
    console.warn('[GTProvider] Missing projectId or apiKey, GT translations disabled')
    return <>{children}</>
  }

  // Don't render GTProvider during SSR to avoid hydration issues
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <GTProviderBase projectId={projectId} apiKey={apiKey}>
      {children}
    </GTProviderBase>
  )
}
