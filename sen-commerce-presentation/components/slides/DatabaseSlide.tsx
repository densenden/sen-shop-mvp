import BaseSlide from './BaseSlide'

interface DatabaseSlideProps {
  title: string
  subtitle: string
  content: {
    core_tables: string[]
    custom_tables: string[]
    key_relationships: string[]
    optimizations: string[]
  }
}

export default function DatabaseSlide({ title, subtitle, content }: DatabaseSlideProps) {
  return (
    <BaseSlide>
      <div className="animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-normal text-black mb-4">{title}</h1>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-base font-semibold text-blue-800 mb-4 text-center border-b border-blue-100 pb-2">
                Core Medusa Tables
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {content.core_tables.map((table, index) => (
                  <div key={index} className="bg-blue-50 p-3 rounded text-center text-sm font-mono border border-blue-100">
                    {table}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-base font-semibold text-green-800 mb-4 text-center border-b border-green-100 pb-2">
                Custom Module Tables
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {content.custom_tables.map((table, index) => (
                  <div key={index} className="bg-green-50 p-3 rounded text-center text-sm font-mono border border-green-100">
                    {table}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center border-b border-gray-100 pb-2">
                Key Relationships
              </h4>
              <div className="space-y-3">
                {content.key_relationships.map((relationship, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded font-mono text-sm border border-gray-100">
                    {relationship}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-base font-semibold text-gray-800 mb-4 text-center border-b border-gray-100 pb-2">
                Optimizations
              </h4>
              <ul className="space-y-3">
                {content.optimizations.map((optimization, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-3 mt-1 text-lg">●</span>
                    <span className="text-gray-700 leading-relaxed">{optimization}</span>
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