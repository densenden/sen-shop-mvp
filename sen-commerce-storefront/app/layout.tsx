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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}