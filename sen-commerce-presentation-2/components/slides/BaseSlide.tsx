interface BaseSlideProps {
  children: React.ReactNode
  className?: string
}

export default function BaseSlide({ children, className = '' }: BaseSlideProps) {
  return (
    <div className={`slide-container ${className}`}>
      <div className="slide-content">
        {children}
      </div>
    </div>
  )
}