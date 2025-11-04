import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SenCommerce MVP Presentation',
  description: 'Digital Art & Print-on-Demand E-commerce Platform Presentation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}