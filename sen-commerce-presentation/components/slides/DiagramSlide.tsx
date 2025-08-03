import BaseSlide from './BaseSlide'

interface DiagramSlideProps {
  title: string
  subtitle: string
  content: {
    diagram: string
    description: string
    components: Array<{
      layer: string
      items: string[]
    }>
  }
}

export default function DiagramSlide({ title, subtitle, content }: DiagramSlideProps) {
  return (
    <BaseSlide>
      <div className="animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-black mb-4">{title}</h1>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <p className="text-lg text-center text-gray-700 mb-12">{content.description}</p>
          
          {/* Architecture Diagram */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-8">
            <div className="text-center font-bold text-lg mb-6 text-gray-800 border-b pb-4">
              SenShop MVP Architecture
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {content.components.map((component, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-6">
                  <div className="font-semibold text-lg mb-4 text-center text-gray-800">
                    {component.layer}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {component.items.map((item, itemIndex) => (
                      <div 
                        key={itemIndex}
                        className="bg-gray-50 p-3 rounded text-center text-sm text-gray-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BaseSlide>
  )
}