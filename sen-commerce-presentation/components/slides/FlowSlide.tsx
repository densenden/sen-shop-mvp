import BaseSlide from './BaseSlide'

interface FlowSlideProps {
  title: string
  subtitle: string
  content: {
    digital_product_flow: string[]
    print_on_demand_flow: string[]
    admin_workflow: string[]
  }
}

export default function FlowSlide({ title, subtitle, content }: FlowSlideProps) {
  const renderFlow = (title: string, steps: string[], color: string) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h4 className={`text-base font-semibold mb-4 text-center text-${color}-800`}>
        {title}
      </h4>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start">
            <div className={`bg-${color}-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-4 mt-1 flex-shrink-0`}>
              {index + 1}
            </div>
            <p className="text-gray-700 leading-relaxed">{step}</p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <BaseSlide>
      <div className="animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-normal text-black mb-4">{title}</h1>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Flow Diagram Screenshots Placeholder */}
          <div className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg mb-2">
                  <div className="text-center">
                    <div className="text-2xl text-gray-400 mb-1">💳</div>
                    <div className="text-xs text-gray-500">Digital Flow Screenshot</div>
                  </div>
                </div>
              </div>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg mb-2">
                  <div className="text-center">
                    <div className="text-2xl text-gray-400 mb-1">🖨️</div>
                    <div className="text-xs text-gray-500">Print Flow Screenshot</div>
                  </div>
                </div>
              </div>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg mb-2">
                  <div className="text-center">
                    <div className="text-2xl text-gray-400 mb-1">⚙️</div>
                    <div className="text-xs text-gray-500">Admin Dashboard</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {renderFlow("Digital Product Flow", content.digital_product_flow, "blue")}
            {renderFlow("Print-on-Demand Flow", content.print_on_demand_flow, "green")}
            {renderFlow("Admin Workflow", content.admin_workflow, "purple")}
          </div>
        </div>
      </div>
    </BaseSlide>
  )
}