import BaseSlide from './BaseSlide'

interface RoadmapSlideProps {
  title: string
  subtitle: string
  content: {
    // Legacy format
    phase_1?: {
      title: string
      timeline: string
      items: string[]
    }
    phase_2?: {
      title: string
      timeline: string
      items: string[]
    }
    phase_3?: {
      title: string
      timeline: string
      items: string[]
    }
    immediate_priorities?: string[]
    // New format
    development_timeline?: {
      completed: string
      current_status: string
    }
    next_4_weeks?: {
      title: string
      items: string[]
    }
    advanced_features?: {
      title: string
      items: string[]
    }
    business_scaling?: {
      title: string
      items: string[]
    }
  }
}

export default function RoadmapSlide({ title, subtitle, content }: RoadmapSlideProps) {
  // Check if using new format or legacy format
  const isNewFormat = content.development_timeline || content.next_4_weeks || content.advanced_features || content.business_scaling
  
  const colors = ['blue', 'green', 'purple']

  if (isNewFormat) {
    // New format layout
    return (
      <BaseSlide>
        <div className="animate-fade-in">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-normal text-black mb-4">{title}</h1>
            <p className="text-xl text-gray-600">{subtitle}</p>
          </div>

          <div className="max-w-7xl mx-auto">
            {/* Development Timeline Summary */}
            {content.development_timeline && (
              <div className="mb-12">
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
                  <div className="text-center">
                    <div className="text-4xl text-gray-400 mb-4">🚀</div>
                    <div className="text-gray-800 font-semibold text-xl mb-2">{content.development_timeline.completed}</div>
                    <div className="text-gray-600">{content.development_timeline.current_status}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Next 4 Weeks */}
              {content.next_4_weeks && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="text-center mb-6">
                    <h4 className="text-base font-semibold text-blue-800 mb-3 border-b border-blue-100 pb-2">
                      {content.next_4_weeks.title}
                    </h4>
                    <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                      Next 4 weeks
                    </span>
                  </div>
                  <ul className="space-y-4">
                    {content.next_4_weeks.items.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-3 mt-1 text-lg">●</span>
                        <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advanced Features */}
              {content.advanced_features && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="text-center mb-6">
                    <h4 className="text-base font-semibold text-green-800 mb-3 border-b border-green-100 pb-2">
                      {content.advanced_features.title}
                    </h4>
                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                      Advanced
                    </span>
                  </div>
                  <ul className="space-y-4">
                    {content.advanced_features.items.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1 text-lg">●</span>
                        <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Business Scaling */}
              {content.business_scaling && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="text-center mb-6">
                    <h4 className="text-base font-semibold text-purple-800 mb-3 border-b border-purple-100 pb-2">
                      {content.business_scaling.title}
                    </h4>
                    <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                      Scaling
                    </span>
                  </div>
                  <ul className="space-y-4">
                    {content.business_scaling.items.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-500 mr-3 mt-1 text-lg">●</span>
                        <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseSlide>
    )
  }

  // Legacy format layout
  const phases = [content.phase_1, content.phase_2, content.phase_3].filter(Boolean)
  
  return (
    <BaseSlide>
      <div className="animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-normal text-black mb-4">{title}</h1>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg mb-4">
                <div className="text-center">
                  <div className="text-4xl text-gray-400 mb-2">📅</div>
                  <div className="text-gray-500 font-medium">Project Timeline</div>
                  <div className="text-sm text-gray-400">Looking forward to v2 - make it great!</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {phases.map((phase, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="text-center mb-6">
                  <h4 className={`text-base font-semibold text-${colors[index]}-800 mb-3 border-b border-${colors[index]}-100 pb-2`}>
                    {phase?.title}
                  </h4>
                  <span className={`bg-${colors[index]}-100 text-${colors[index]}-800 px-4 py-2 rounded-full text-sm font-medium`}>
                    {phase?.timeline}
                  </span>
                </div>
                <ul className="space-y-4">
                  {phase?.items?.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <span className={`text-${colors[index]}-500 mr-3 mt-1 text-lg`}>●</span>
                      <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {content.immediate_priorities && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 shadow-sm">
              <h4 className="text-base font-semibold text-yellow-800 mb-6 text-center border-b border-yellow-200 pb-3">
                Immediate Priorities
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {content.immediate_priorities.map((priority, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg border border-yellow-200 shadow-sm">
                    <span className="text-gray-700 text-sm leading-relaxed">{priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseSlide>
  )
}