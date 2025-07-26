import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SenCommerce - Digital Art & Print on Demand',
  description: 'Discover unique artworks available as digital downloads and premium prints',
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