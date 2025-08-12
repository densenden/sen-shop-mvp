import BaseSlide from './BaseSlide'

interface TitleSlideProps {
  title: string
  subtitle: string
  content: {
    project: string
    built_with: string
    timeline: string
    status: string
    presenter: string
    mentor: string
    audience: string
  }
}

export default function TitleSlide({ title, subtitle, content }: TitleSlideProps) {
  return (
    <BaseSlide>
      <div className="text-center animate-fade-in">
        <h1 className="text-5xl font-normal text-black mb-6">
          {title}
        </h1>
        <h2 className="text-2xl text-gray-600 mb-12 max-w-4xl mx-auto">
          {subtitle}
        </h2>
        
        <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-left space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Built With</span>
                <p className="text-lg text-black mt-1">{content.built_with}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Timeline</span>
                <p className="text-lg text-black mt-1">{content.timeline}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-left space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</span>
                <p className="text-lg text-black mt-1">{content.status}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Presenter</span>
                <p className="text-lg text-black mt-1">{content.presenter}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Mentor</span>
                <p className="text-lg text-black mt-1">{content.mentor}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Target Audience</span>
          <p className="text-xl text-black mt-2">{content.audience}</p>
        </div>
      </div>
    </BaseSlide>
  )
}