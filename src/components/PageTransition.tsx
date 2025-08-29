import React, { useEffect, useState } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
  isVisible: boolean
  onTransitionComplete?: () => void
}

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  isVisible, 
  onTransitionComplete 
}) => {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false)
        onTransitionComplete?.()
      }, 300) // Match transition duration
      return () => clearTimeout(timer)
    }
  }, [isVisible, onTransitionComplete])

  if (!shouldRender) return null

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-95'
      }`}
    >
      {children}
    </div>
  )
}



