'use client'

import Layout from '../components/Layout'
import MaterialIcon, { MaterialIcons } from '../components/MaterialIcon'

export default function AboutPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
            About SenCommerce
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Where art meets technology. Creating unique digital experiences and print-on-demand artworks for the modern world.
          </p>
        </div>

        {/* Story Section */}
        <div className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">Our Story</h2>
          <div className="text-gray-600 space-y-4">
            <p>
              SenCommerce was born from a passion for bridging the gap between traditional artistry and digital innovation. 
              Founded by artists and technologists, we believe that art should be accessible, sustainable, and meaningful.
            </p>
            <p>
              Our platform showcases unique artwork collections that can be experienced both as digital downloads and 
              high-quality print-on-demand products. Each piece tells a story, carries an emotion, and connects with 
              people across the globe.
            </p>
            <p>
              We're committed to supporting artists by providing them with a platform to showcase their work while 
              offering customers the flexibility to enjoy art in the format that speaks to them most.
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">Our Mission</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-2">Passionate</h3>
              <p className="text-sm text-gray-600">We pour our heart into every creation, ensuring each artwork resonates with genuine emotion and creativity.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MaterialIcon icon="local_florist" size="medium" className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-sm font-medium mb-2">Sustainable</h3>
              <p className="text-sm text-gray-600">Our print-on-demand model reduces waste while our digital offerings provide instant, eco-friendly access to art.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-2">Innovative</h3>
              <p className="text-sm text-gray-600">We leverage cutting-edge technology to create seamless experiences between digital and physical art.</p>
            </div>
          </div>
        </div>

        {/* What We Offer */}
        <div className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6">
              <h3 className="text-sm font-medium mb-4">Digital Art Collections</h3>
              <p className="text-sm text-gray-600 mb-4">
                High-resolution digital artworks available for instant download. Perfect for digital displays, 
                social media, or personal creative projects.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Multiple format options (PNG, JPG, SVG)</li>
                <li>• High-resolution files suitable for printing</li>
                <li>• Commercial use licenses available</li>
                <li>• Instant download after purchase</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-6">
              <h3 className="text-sm font-medium mb-4">Print-on-Demand Products</h3>
              <p className="text-sm text-gray-600 mb-4">
                Transform our artwork into physical products through our print-on-demand service. 
                Each item is made to order with premium materials.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Premium paper and canvas prints</li>
                <li>• Apparel and accessories</li>
                <li>• Home decor items</li>
                <li>• Worldwide shipping available</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="py-8 border-t border-gray-100 text-center">
          <h2 className="text-2xl font-medium text-gray-900 mb-4">Get in Touch</h2>
          <p className="text-sm text-gray-600 mb-6">
            Have questions about our artwork or custom commissions? We'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:hello@sencommerce.com" 
              className="bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Email Us
            </a>
            <a 
              href="/artworks" 
              className="bg-gray-100 text-gray-900 px-6 py-3 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Browse Artworks
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}