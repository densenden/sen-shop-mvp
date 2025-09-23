'use client'

import { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import dynamic from 'next/dynamic'

// Dynamic imports to avoid SSR issues
const T = dynamic(() => import('gt-react').then(mod => ({ default: mod.T })), {
  ssr: false,
  loading: () => null
})

const Var = dynamic(() => import('gt-react').then(mod => ({ default: mod.Var })), {
  ssr: false,
  loading: () => null
})

interface TranslatedContentProps {
  children: ReactNode
  context?: string
}

export function TranslatedContent({ children, context }: TranslatedContentProps) {
  // Hybrid approach: GT only for database content (product titles, descriptions, artwork details)
  // Static UI text uses next-intl, dynamic DB content uses GT instant translation
  return (
    <ErrorBoundary fallback={<>{children}</>}>
      <T context={context}>{children}</T>
    </ErrorBoundary>
  )
}

interface TranslatedVariableProps {
  children: string | number
  name?: string
}

export function TranslatedVariable({ children, name }: TranslatedVariableProps) {
  // GT is now configured and enabled
  return (
    <ErrorBoundary fallback={<>{children}</>}>
      <Var name={name}>{children}</Var>
    </ErrorBoundary>
  )
}

interface ProductContentProps {
  title: string
  description?: string
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function TranslatedProductContent({ 
  title, 
  description, 
  className = '',
  titleClassName = '',
  descriptionClassName = ''
}: ProductContentProps) {
  return (
    <div className={className}>
      <TranslatedContent context="product">
        <h3 className={titleClassName}>
          <TranslatedVariable name="title">{title}</TranslatedVariable>
        </h3>
        {description && (
          <p className={descriptionClassName}>
            <TranslatedVariable name="description">{description}</TranslatedVariable>
          </p>
        )}
      </TranslatedContent>
    </div>
  )
}