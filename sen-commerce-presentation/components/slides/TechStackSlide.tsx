import BaseSlide from './BaseSlide'

interface TechStackSlideProps {
  title: string
  subtitle: string
  content: {
    core_technologies: Array<{
      name: string
      role: string
      reason: string
    }>
    infrastructure: Array<{
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
          <h1 className="text-5xl font-bold text-black mb-4">{title}</h1>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center">
                Core Technologies
              </h4>
              <div className="space-y-4">
                {content.core_technologies.map((tech, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{tech.name}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {tech.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{tech.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center">
                Infrastructure & Services
              </h4>
              <div className="space-y-4">
                {content.infrastructure.map((service, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{service.name}</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {service.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{service.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseSlide>
  )
}