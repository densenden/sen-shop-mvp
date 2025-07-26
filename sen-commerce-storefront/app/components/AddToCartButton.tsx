'use client'

import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { cartService } from '../../lib/cart'

interface AddToCartButtonProps {
  productId: string
  variantId: string
  title?: string
  quantity?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function AddToCartButton({
  productId,
  variantId,
  title = 'Add to Cart',
  quantity = 1,
  className = '',
  size = 'md',
  variant = 'primary',
  disabled = false,
  onSuccess,
  onError
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const handleAddToCart = async () => {
    if (isLoading || disabled) return

    setIsLoading(true)
    try {
      await cartService.addItem(productId, variantId, quantity)
      
      // Show success state
      setIsAdded(true)
      onSuccess?.()
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setIsAdded(false)
      }, 2000)
      
    } catch (error) {
      console.error('Error adding to cart:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart'
      onError?.(errorMessage)
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  // Variant classes
  const variantClasses = {
    primary: isAdded 
      ? 'bg-green-600 text-white hover:bg-green-700' 
      : 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: isAdded
      ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
      : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
  }

  const baseClasses = `
    inline-flex items-center justify-center space-x-2 font-medium 
    transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]} 
    ${variantClasses[variant]}
    ${className}
  `.trim()

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isLoading}
      className={baseClasses}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>Adding...</span>
        </>
      ) : isAdded ? (
        <>
          <Check className="h-4 w-4" />
          <span>Added!</span>
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" />
          <span>{title}</span>
        </>
      )}
    </button>
  )
}