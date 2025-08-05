import { Button as EmailButton, Link } from '@react-email/components'

interface ButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export const Button = ({ href, children, variant = 'primary' }: ButtonProps) => (
  <Link 
    href={href} 
    className={`
      inline-block px-6 py-3 rounded text-sm font-medium text-center no-underline transition-colors
      ${variant === 'primary' 
        ? 'bg-gray-900 text-white hover:bg-gray-800' 
        : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100'
      }
    `}
  >
    {children}
  </Link>
)

