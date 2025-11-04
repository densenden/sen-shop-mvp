'use client'

import { useState, useEffect } from 'react'

interface TileContent {
  title: string
  subtitle: string
  highlight: string
}

interface FloatingTileProps {
  id: string
  size: 'small' | 'medium' | 'large'
  delay: number
  content: TileContent
  onClick: () => void
}

const sizeClasses = {
  small: 'w-64 h-32',
  medium: 'w-80 h-40', 
  large: 'w-96 h-48'
}

export default function FloatingTile({ id, size, delay, content, onClick }: FloatingTileProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [delay])

  if (!isVisible) return null

  return (
    <div 
      className={`tile ${sizeClasses[size]} p-6 animate-float hover:animate-none`}
      onClick={onClick}
      style={{
        animationDelay: `${delay}s`,
        top: `${Math.random() * 70 + 10}%`
      }}
    >
      <div className="h-full flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {content.title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {content.subtitle}
          </p>
        </div>
        <div className="flex justify-end">
          <span className="bg-sen-accent text-white px-3 py-1 rounded-full text-xs font-medium">
            {content.highlight}
          </span>
        </div>
      </div>
    </div>
  )
}