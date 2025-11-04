'use client'

import { ChevronLeft, ChevronRight, Home } from 'lucide-react'

interface PresentationNavigationProps {
  currentSlide: number
  totalSlides: number
  onPrevious: () => void
  onNext: () => void
  onHome: () => void
}

export default function PresentationNavigation({ 
  currentSlide, 
  totalSlides, 
  onPrevious, 
  onNext, 
  onHome 
}: PresentationNavigationProps) {
  return (
    <div className="presentation-nav">
      <button
        onClick={onHome}
        className="p-2 hover:bg-white/20 rounded-full transition-colors flex items-center"
        title="Home"
      >
        <img 
          src="/images/StudioSen2024slim.svg" 
          alt="Studio Sen Logo" 
          className="h-6 w-6 filter invert"
        />
      </button>
      
      <button
        onClick={onPrevious}
        disabled={currentSlide === 0}
        className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Previous slide"
      >
        <ChevronLeft size={16} />
      </button>
      
      <span className="px-3 py-1 text-xs font-medium">
        {currentSlide + 1} / {totalSlides}
      </span>
      
      <button
        onClick={onNext}
        disabled={currentSlide === totalSlides - 1}
        className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Next slide"
      >
        <ChevronRight size={16} />
      </button>
      
      <div className="text-xs ml-4 opacity-70">
        Use ← → keys or click to navigate
      </div>
    </div>
  )
}