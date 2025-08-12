import BaseSlide from './BaseSlide'

interface TechStackSlideProps {
  title: string
  subtitle: string
  content: {
    backend_technologies?: Array<{
      name: string
      role: string
      reason: string
    }>
    frontend_technologies?: Array<{
      name: string
      role: string
      reason: string
    }>
    infrastructure?: Array<{
      name: string
      role: string
      reason: string
    }>
  }
}

export default function TechStackSlide({ title, subtitle, content }: TechStackSlideProps) {
  return (
    <BaseSlide>
      <div className="animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-normal text-black mb-4">{title}</h1>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* First Row: Backend and Infrastructure */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Backend Technologies */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center">
                Backend
              </h4>
              <div className="space-y-3">
                {content.backend_technologies?.map((tech, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-gray-800 text-sm">{tech.name}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {tech.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{tech.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Infrastructure */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center">
                Infrastructure
              </h4>
              <div className="space-y-3">
                {content.infrastructure?.map((service, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-gray-800 text-sm">{service.name}</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        {service.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{service.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Second Row: Frontend Applications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Storefront (FE1) */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center">
                Storefront (FE1)
              </h4>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-800 text-sm">React 18</h4>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      UI Library
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Component-based interfaces</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-800 text-sm">Tailwind CSS</h4>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      Styling
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Utility-first CSS</p>
                </div>
              </div>
            </div>

            {/* Admin UI (FE2) */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center">
                Admin UI (FE2)
              </h4>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-800 text-sm">Vite Admin</h4>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      Dashboard
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Fast admin interface</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-800 text-sm">React Components</h4>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      UI
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Medusa admin components</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseSlide>
  )
}