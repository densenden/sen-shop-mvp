import BaseSlide from './BaseSlide'

interface SolutionSlideProps {
  title: string
  subtitle: string
  content: {
    approach: string
    benefits: string[]
    key_features: string[]
  }
}

export default function SolutionSlide({ title, subtitle, content }: SolutionSlideProps) {
  return (
    <BaseSlide>
      <div className="animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-normal text-black mb-4">{title}</h1>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-12">
            <h4 className="text-base font-semibold text-blue-800 mb-4 text-center">
              My Approach
            </h4>
            <p className="text-lg text-blue-700 text-center leading-relaxed">
              {content.approach}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center">
                Business Benefits
              </h4>
              <ul className="space-y-3">
                {content.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center">
                Key Features
              </h4>
              <ul className="space-y-3">
                {content.key_features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-3 mt-1">●</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </BaseSlide>
  )
}