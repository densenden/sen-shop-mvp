'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FloatingTile from '@/components/FloatingTile'
import presentationData from '@/data/presentation.json'

export default function HomePage() {
  const router = useRouter()
  const [showCenterContent, setShowCenterContent] = useState(false)

  useEffect(() => {
    // Show center content after tiles start appearing
    const timer = setTimeout(() => {
      setShowCenterContent(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleTileClick = () => {
    router.push('/presentation')
  }

  const handleEnterPresentation = () => {
    router.push('/presentation')
  }

  return (
    <div 
      className="min-h-screen overflow-hidden relative"
      style={{
        backgroundImage: 'url(/images/startpage.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better text contrast */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />
      
      {/* Floating Tiles */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {presentationData.floatingTiles.map((tile) => (
          <div 
            key={tile.id} 
            className="absolute pointer-events-auto"
            style={{
              right: '100%',
              top: `${Math.random() * 70 + 10}%`
            }}
          >
            <FloatingTile 
              id={tile.id}
              size={tile.size as 'small' | 'medium' | 'large'}
              delay={tile.delay}
              content={tile.content}
              onClick={handleTileClick}
            />
          </div>
        ))}
      </div>

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className={`text-center transition-all duration-1000 ${
          showCenterContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Logo */}
          <div className="mb-6">
            <img 
              src="/images/StudioSen2024slim.svg" 
              alt="Studio Sen Logo" 
              className="h-16 mx-auto mb-4 filter invert"
            />
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-2">
            SenCommerce MVP Presentation
          </h1>
          <p className="text-xl text-gray-200 mb-6 max-w-2xl mx-auto">
            Digital Art & Print-on-Demand E-commerce Platform
          </p>
          
          <div className="mb-8 space-y-2">
            <div className="text-lg text-white font-medium">Presenter: Denis Kreuzer</div>
            <div className="text-sm text-gray-300">WebDev Track - Only three months</div>
            <div className="text-sm text-gray-300">May 2025 - August 2025</div>
          </div>
          
          <button
            onClick={handleEnterPresentation}
            className="bg-white text-black px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Enter Presentation
          </button>
          <div className="mt-6 text-sm text-gray-300">
            Click any floating tile or use the button above
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-8 text-gray-300 text-sm">
        Student Project - Looking forward to v2
      </div>

      <div className="absolute bottom-8 right-8 text-gray-300 text-sm">
        <a href="https://github.com/densenden/sen-shop-mvp" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
          GitHub Repository
        </a>
      </div>
    </div>
  )
}