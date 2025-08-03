'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import presentationData from '@/data/presentation.json'
import PresentationNavigation from '@/components/PresentationNavigation'
import TitleSlide from '@/components/slides/TitleSlide'
import DiagramSlide from '@/components/slides/DiagramSlide'
import ProblemSlide from '@/components/slides/ProblemSlide'
import SolutionSlide from '@/components/slides/SolutionSlide'
import TechStackSlide from '@/components/slides/TechStackSlide'
import DatabaseSlide from '@/components/slides/DatabaseSlide'
import FlowSlide from '@/components/slides/FlowSlide'
import RoadmapSlide from '@/components/slides/RoadmapSlide'
import GenericSlide from '@/components/slides/GenericSlide'

export default function PresentationPage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = presentationData.slides

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }, [currentSlide, slides.length])

  const previousSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }, [currentSlide])

  const goHome = useCallback(() => {
    router.push('/')
  }, [router])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case ' ':
          event.preventDefault()
          nextSlide()
          break
        case 'ArrowLeft':
          event.preventDefault()
          previousSlide()
          break
        case 'Home':
          event.preventDefault()
          setCurrentSlide(0)
          break
        case 'End':
          event.preventDefault()
          setCurrentSlide(slides.length - 1)
          break
        case 'Escape':
          event.preventDefault()
          goHome()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [nextSlide, previousSlide, goHome, slides.length])

  // Click to advance
  const handleSlideClick = (event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const width = rect.width
    
    if (clickX > width / 2) {
      nextSlide()
    } else {
      previousSlide()
    }
  }

  const renderSlide = () => {
    const slide = slides[currentSlide]
    
    switch (slide.type) {
      case 'title':
        return (
          <TitleSlide
            title={slide.title}
            subtitle={slide.subtitle}
            content={slide.content as any}
          />
        )
      case 'diagram':
        return (
          <DiagramSlide
            title={slide.title}
            subtitle={slide.subtitle}
            content={slide.content as any}
          />
        )
      case 'problem':
        return (
          <ProblemSlide
            title={slide.title}
            subtitle={slide.subtitle}
            content={slide.content as any}
          />
        )
      case 'solution':
        return (
          <SolutionSlide
            title={slide.title}
            subtitle={slide.subtitle}
            content={slide.content as any}
          />
        )
      case 'tech':
        return (
          <TechStackSlide
            title={slide.title}
            subtitle={slide.subtitle}
            content={slide.content as any}
          />
        )
      case 'database':
        return (
          <DatabaseSlide
            title={slide.title}
            subtitle={slide.subtitle}
            content={slide.content as any}
          />
        )
      case 'flow':
        return (
          <FlowSlide
            title={slide.title}
            subtitle={slide.subtitle}
            content={slide.content as any}
          />
        )
      case 'roadmap':
        return (
          <RoadmapSlide
            title={slide.title}
            subtitle={slide.subtitle}
            content={slide.content as any}
          />
        )
      case 'deep-dive':
      case 'api':
      case 'admin':
      case 'achievements':
      case 'modules':
      case 'features':
      case 'business':
      case 'demo':
      case 'contact':
      case 'fullscreen-image':
      case 'feature-showcase':
      case 'migration-story':
        return (
          <GenericSlide
            title={slide.title}
            subtitle={slide.subtitle}
            content={slide.content}
            type={slide.type}
          />
        )
      default:
        return (
          <GenericSlide
            title={slide.title}
            subtitle={slide.subtitle}
            content={slide.content}
            type={slide.type}
          />
        )
    }
  }

  return (
    <div className="relative">
      <div 
        className="cursor-pointer select-none"
        onClick={handleSlideClick}
      >
        {renderSlide()}
      </div>
      
      <PresentationNavigation
        currentSlide={currentSlide}
        totalSlides={slides.length}
        onPrevious={previousSlide}
        onNext={nextSlide}
        onHome={goHome}
      />
      
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-sen-accent transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  )
}