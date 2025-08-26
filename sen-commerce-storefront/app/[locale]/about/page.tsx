'use client'

import Layout from '../../components/Layout'
import MaterialIcon, { MaterialIcons } from '../../components/MaterialIcon'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'

export default function AboutPage() {
  const t = useTranslations('about')
  const locale = useLocale()

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Mission Section */}
        <div className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">{t('mission.title')}</h2>
          <div className="text-gray-600 space-y-4">
            <p>{t('mission.content')}</p>
          </div>
        </div>

        {/* Values Section */}
        <div className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">{t('values.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-2">{t('values.quality.title')}</h3>
              <p className="text-sm text-gray-600">{t('values.quality.description')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-2">{t('values.accessibility.title')}</h3>
              <p className="text-sm text-gray-600">{t('values.accessibility.description')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MaterialIcon icon="local_florist" size="medium" className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-sm font-medium mb-2">{t('values.sustainability.title')}</h3>
              <p className="text-sm text-gray-600">{t('values.sustainability.description')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-2">{t('values.fairness.title')}</h3>
              <p className="text-sm text-gray-600">{t('values.fairness.description')}</p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">{t('story.title')}</h2>
          <div className="text-gray-600 space-y-4">
            <p>{t('story.content')}</p>
          </div>
        </div>

        {/* Team Section */}
        <div className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-medium text-gray-900 mb-4">{t('team.title')}</h2>
          <p className="text-sm text-gray-600 mb-6">{t('team.description')}</p>
        </div>

        {/* Contact Section */}
        <div className="py-8 border-t border-gray-100 text-center">
          <h2 className="text-2xl font-medium text-gray-900 mb-4">{t('contact.title')}</h2>
          <p className="text-sm text-gray-600 mb-6">
            {t('contact.description')}
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">{t('contact.email')}</h3>
              <a href="mailto:shop@sen.studio" className="text-sm text-gray-600 hover:text-gray-900">
                shop@sen.studio
              </a>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">{t('contact.hours')}</h3>
              <p className="text-sm text-gray-600">{t('contact.hoursValue')}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:shop@sen.studio" 
              className="bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {t('contact.email')}
            </a>
            <Link 
              href={`/${locale}/artworks`}
              className="bg-gray-100 text-gray-900 px-6 py-3 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Browse Artworks
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}