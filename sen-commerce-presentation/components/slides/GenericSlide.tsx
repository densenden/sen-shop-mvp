import BaseSlide from './BaseSlide'

interface GenericSlideProps {
  title: string
  subtitle: string
  content: any
  type: string
}

export default function GenericSlide({ title, subtitle, content, type }: GenericSlideProps) {
  const renderContent = () => {
    switch (type) {
      case 'professional-overview':
        return (
          <div className="max-w-6xl mx-auto">
            {content.image && (
              <div className="mb-12 text-center">
                <img 
                  src={content.image} 
                  alt={title}
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {content.sections?.map((section: any, index: number) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {section.image ? (
                    <div className="h-48 w-full">
                      <img 
                        src={section.image} 
                        alt={section.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center text-4xl">{section.icon}</div>
                  )}
                  <div className="p-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{section.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{section.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'technical-journey-layout':
        return (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left side - Portrait image */}
              <div className="flex justify-center lg:justify-start">
                <img 
                  src={content.image} 
                  alt={title}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '500px' }}
                />
              </div>
              
              {/* Right side - Content stack */}
              <div className="space-y-6">
                {content.sections?.map((section: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{section.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{section.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'tech-overview':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
              <p className="text-lg text-gray-700 text-center leading-relaxed mb-8">
                {content.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-800 mb-4">Key Features</h4>
                <ul className="space-y-3">
                  {content.key_features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-green-800 mb-4">Why Chosen</h4>
                <ul className="space-y-3">
                  {content.why_chosen?.map((reason: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">✓</span>
                      <span className="text-gray-700">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )

      case 'concept-explanation':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
              <p className="text-lg text-gray-700 text-center leading-relaxed">
                {content.module_concept}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-800 mb-4">Core Benefits</h4>
                <ul className="space-y-3">
                  {content.core_benefits?.map((benefit: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-purple-800 mb-4">Why Custom Modules?</h4>
                <div className="space-y-3">
                  <p className="text-gray-700 font-medium">{content.why_custom_modules?.problem}</p>
                  <p className="text-gray-700">{content.why_custom_modules?.solution}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Examples</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {content.why_custom_modules?.examples?.map((example: string, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700">{example}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'modules':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-base font-semibold text-gray-800 mb-6 text-center">
                  Core Medusa Modules
                </h4>
                <div className="space-y-3">
                  {content.core_modules?.map((module: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-800">{module.name}</h4>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-base font-semibold text-gray-800 mb-6 text-center">
                  Custom Modules
                </h4>
                <div className="space-y-3">
                  {content.custom_modules?.map((module: any, index: number) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-gray-800">{module.name}</h4>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'features':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(content).map(([category, items]: [string, any]) => (
                <div key={category} className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-base font-semibold text-gray-800 mb-6 text-center capitalize">
                    {category.replace('_', ' ')}
                  </h4>
                  <div className="space-y-3">
                    {items?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-700">{item.feature}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'complete' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'business':
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Analytics Screenshots Placeholder */}
            <div className="mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg mb-4">
                    <div className="text-center">
                      <div className="text-3xl text-gray-400 mb-2">📊</div>
                      <div className="text-gray-500 font-medium">Revenue Analytics</div>
                      <div className="text-sm text-gray-400">Business metrics screenshot</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg mb-4">
                    <div className="text-center">
                      <div className="text-3xl text-gray-400 mb-2">⚡</div>
                      <div className="text-gray-500 font-medium">Performance Metrics</div>
                      <div className="text-sm text-gray-400">System performance data</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <h4 className="text-base font-semibold text-gray-800 mb-6 text-center border-b border-gray-100 pb-3">
                Revenue Streams
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {content.revenue_streams?.map((stream: any, index: number) => (
                  <div key={index} className="text-center p-6 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3 text-lg">{stream.stream}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{stream.benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                <h4 className="text-base font-semibold text-gray-800 mb-6 text-center border-b border-gray-100 pb-3">
                  Operational Efficiency
                </h4>
                <div className="space-y-4">
                  {content.operational_efficiency?.map((item: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-800">{item.metric}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.improvement}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                <h4 className="text-base font-semibold text-gray-800 mb-6 text-center border-b border-gray-100 pb-3">
                  Scalability Features
                </h4>
                <ul className="space-y-3">
                  {content.scalability_features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start bg-gray-50 p-3 rounded-lg">
                      <span className="text-blue-500 mr-3 mt-1 text-lg">●</span>
                      <span className="text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )

      case 'demo':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Demo URLs */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-4 text-center">
                  Demo Access
                </h4>
                <div className="space-y-3">
                  {content.demo_urls?.map((demo: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <h4 className="font-semibold text-gray-800 text-sm">{demo.name}</h4>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded block mt-1">{demo.url}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Demo Scenarios */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-4 text-center">
                  Demo Flow
                </h4>
                <div className="space-y-2">
                  {content.demo_scenarios?.slice(0, 3).map((scenario: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <h4 className="font-semibold text-gray-800 text-sm">{scenario.scenario}</h4>
                      <p className="text-xs text-gray-600 mt-1">{scenario.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Points */}
            <div className="bg-gray-50 rounded-lg p-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 text-center">
                Key Features to Demonstrate
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {content.key_demo_points?.map((point: string, index: number) => (
                  <div key={index} className="flex items-center bg-white p-2 rounded text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700 text-xs">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'deep-dive':
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Custom Modules Screenshot Placeholder */}
            <div className="mb-12">
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg mb-4">
                  <div className="text-center">
                    <div className="text-4xl text-gray-400 mb-2">🔧</div>
                    <div className="text-gray-500 font-medium text-lg">Custom Modules Architecture</div>
                    <div className="text-sm text-gray-400">Technical implementation diagram</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {Object.entries(content).filter(([key]) => key.endsWith('_module')).map(([key, module]: [string, any]) => (
                <div key={key} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-gray-800 mb-4 text-center border-b border-gray-100 pb-3">
                    {module.purpose}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Features:</h4>
                      <ul className="space-y-1">
                        {module.features?.map((feature: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2 mt-1 text-sm">●</span>
                            <span className="text-sm text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Tables:</h4>
                      <div className="flex flex-wrap gap-1">
                        {module.tables?.map((table: string, index: number) => (
                          <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                            {table}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'api':
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* API Documentation Screenshot Placeholder */}
            <div className="mb-12">
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg mb-4">
                  <div className="text-center">
                    <div className="text-4xl text-gray-400 mb-2">📡</div>
                    <div className="text-gray-500 font-medium text-lg">API Documentation</div>
                    <div className="text-sm text-gray-400">Postman/Swagger screenshot</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {Object.entries(content.endpoint_structure || {}).map(([key, structure]: [string, any]) => (
                <div key={key} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 text-center border-b border-gray-100 pb-2 capitalize">
                    {key}
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <code className="text-sm font-mono text-gray-700">{structure.path}</code>
                    </div>
                    <p className="text-sm text-gray-600">{structure.description}</p>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Endpoints:</h4>
                      <ul className="space-y-1">
                        {structure.endpoints?.map((endpoint: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <span className="text-green-500 mr-2">●</span>
                            <span className="text-sm text-gray-600">{endpoint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h4 className="text-base font-semibold text-gray-800 mb-4 text-center border-b border-gray-100 pb-2">
                  Authentication
                </h4>
                <div className="space-y-3">
                  {Object.entries(content.authentication || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded">
                      <h4 className="font-semibold text-gray-700 capitalize">{key}:</h4>
                      <p className="text-sm text-gray-600">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h4 className="text-base font-semibold text-gray-800 mb-4 text-center border-b border-gray-100 pb-2">
                  Security Features
                </h4>
                <ul className="space-y-3">
                  {content.security_features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start bg-gray-50 p-3 rounded">
                      <span className="text-red-500 mr-3 mt-1">🔒</span>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Email System */}
              {content.email_system && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-gray-800 mb-4 text-center border-b border-gray-100 pb-2">
                    Email System ({content.email_system.provider})
                  </h4>
                  <ul className="space-y-3">
                    {content.email_system.features?.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start bg-gray-50 p-3 rounded">
                        <span className="text-blue-500 mr-3 mt-1">📧</span>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )

      case 'admin':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {content.dashboard_modules?.slice(0, 6).map((module: any, index: number) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 mb-2">
                    {module.name}
                  </h4>
                  <div className="text-xs text-gray-600 mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">{module.url}</code>
                  </div>
                  <ul className="space-y-1">
                    {module.features?.slice(0, 2).map((feature: string, fIndex: number) => (
                      <li key={fIndex} className="flex items-start">
                        <span className="text-blue-500 mr-1 mt-0.5 text-xs">●</span>
                        <span className="text-xs text-gray-600 leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center">
                Management Capabilities
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {content.key_capabilities?.map((capability: string, index: number) => (
                  <div key={index} className="flex items-center bg-white p-3 rounded-lg">
                    <span className="text-green-500 mr-2 text-sm">✓</span>
                    <span className="text-sm text-gray-700">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'achievements':
        return (
          <div className="max-w-6xl mx-auto">
            {/* Featured Achievement */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h4 className="text-base font-semibold text-blue-800 mb-3">
                🏆 Key Achievement: Medusa Service Method Discovery
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Challenge:</h4>
                  <p className="text-sm text-gray-600">
                    Medusa service methods weren't working as documented - 
                    calling `artworkService.list()` was failing with undefined errors
                  </p>
                </div>
                <div className="bg-white p-4 rounded">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Solution:</h4>
                  <p className="text-sm text-gray-600">
                    Discovered MedusaService base class auto-pluralizes method names - 
                    use `artworkService.listArtworks()` instead
                  </p>
                </div>
              </div>
            </div>

            {/* Skills Cloud */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-4 text-center">
                Technical Skills & Learnings
              </h4>
              <div className="flex flex-wrap justify-center gap-3">
                {content.skills_developed?.map((skill: any, index: number) => (
                  <div key={index} className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                  </div>
                ))}
                {content.problem_solving?.slice(1).map((problem: any, index: number) => (
                  <div key={`p-${index}`} className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                    <span className="text-sm text-gray-600">
                      {problem.solution.split(' ').slice(0, 4).join(' ')}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'fullscreen-image':
        return (
          <div className="w-full max-w-7xl mx-auto px-8">
            {content.image ? (
              <div className="text-center">
                <img 
                  src={content.image} 
                  alt={content.description || 'Screenshot'}
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg mb-6"
                  style={{ maxHeight: '70vh' }}
                />
                <p className="text-lg text-gray-700 leading-relaxed mb-2">
                  {content.description}
                </p>
                {content.note && (
                  <p className="text-sm text-gray-500 italic">
                    {content.note}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  {content.description || 'Screenshot'}
                </p>
                {content.note && (
                  <p className="text-sm text-gray-500 italic">
                    {content.note}
                  </p>
                )}
              </div>
            )}
          </div>
        )

      case 'feature-showcase':
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Large Screenshot Placeholder */}
            <div className="mb-8">
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    {content.screenshot_type === 'storefront' && (
                      <>
                        <div className="text-5xl text-gray-400 mb-4">🛍️</div>
                        <div className="text-gray-500 font-medium text-2xl mb-2">Storefront Screenshot</div>
                        <div className="text-gray-400">Customer shopping experience</div>
                      </>
                    )}
                    {content.screenshot_type === 'digital-pod' && (
                      <>
                        <div className="text-5xl text-gray-400 mb-4">📦</div>
                        <div className="text-gray-500 font-medium text-2xl mb-2">Digital & POD Features</div>
                        <div className="text-gray-400">Advanced fulfillment systems</div>
                      </>
                    )}
                    {content.screenshot_type === 'admin' && (
                      <>
                        <div className="text-5xl text-gray-400 mb-4">⚙️</div>
                        <div className="text-gray-500 font-medium text-2xl mb-2">Admin Dashboard</div>
                        <div className="text-gray-400">Management interface</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Features List */}
            {content.features && (
              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                <h4 className="text-base font-semibold text-gray-800 mb-6 text-center border-b border-gray-100 pb-3">
                  Key Features
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {content.features.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-700 font-medium">{item.feature}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'complete' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split Features for Digital/POD slide */}
            {content.digital_features && content.pod_features && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                  <h4 className="text-base font-semibold text-gray-800 mb-6 text-center border-b border-blue-100 pb-3">
                    Digital Products
                  </h4>
                  <div className="space-y-4">
                    {content.digital_features.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                        <span className="text-gray-700">{item.feature}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                  <h4 className="text-base font-semibold text-gray-800 mb-6 text-center border-b border-green-100 pb-3">
                    Print-on-Demand
                  </h4>
                  <div className="space-y-4">
                    {content.pod_features.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                        <span className="text-gray-700">{item.feature}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'migration-story':
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                <h4 className="text-base font-semibold text-gray-800 mb-6 text-center border-b border-gray-100 pb-3">
                  The Challenge
                </h4>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-gray-700 font-medium mb-2">{content.challenge}</p>
                    <p className="text-sm text-gray-600">{content.approach}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Learning Outcome:</h4>
                    <p className="text-sm text-gray-600">{content.learning}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                <h4 className="text-base font-semibold text-gray-800 mb-6 text-center border-b border-gray-100 pb-3">
                  Technical Details
                </h4>
                <div className="space-y-3">
                  {content.tech_details?.map((detail: string, index: number) => (
                    <div key={index} className="flex items-center bg-gray-50 p-3 rounded-lg">
                      <span className="text-blue-500 mr-3 text-lg">⚙️</span>
                      <span className="text-gray-700">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <h4 className="text-base font-semibold text-gray-800 mb-6 text-center border-b border-gray-100 pb-3">
                Migration Process
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.steps?.map((step: string, index: number) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-1 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 text-sm leading-relaxed">{step}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <h4 className="font-semibold text-green-800 mb-2">Result:</h4>
                <p className="text-green-700">{content.outcome}</p>
              </div>
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <p className="text-lg text-gray-700 leading-relaxed">
                {content.project_summary}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
              {content.key_metrics?.map((metric: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-black">{metric.value}</div>
                  <div className="text-sm text-gray-600">{metric.metric}</div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8">
              <h4 className="text-base font-semibold text-gray-800 mb-8 text-center">
                Project Access
              </h4>
              <div className="flex flex-col space-y-4">
                {content.demo_access?.map((demo: any, index: number) => (
                  <a 
                    key={index} 
                    href={demo.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      demo.type === 'primary' 
                        ? 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {demo.type === 'primary' && <span className="mr-2">🔗</span>}
                    {demo.name}
                    <span className="ml-2">→</span>
                  </a>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  {Object.entries(content.contact_info || {}).filter(([key]) => ['presenter', 'mentor', 'email'].includes(key)).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-white p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide capitalize">{key}</div>
                      <div className="text-gray-800 mt-1">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-8">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(content, null, 2)}
              </pre>
            </div>
          </div>
        )
    }
  }

  return (
    <BaseSlide>
      <div className="animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-normal text-black mb-4">{title}</h1>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>
        {renderContent()}
      </div>
    </BaseSlide>
  )
}