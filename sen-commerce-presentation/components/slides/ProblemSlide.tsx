import BaseSlide from './BaseSlide'

interface ProblemSlideProps {
  title: string
  subtitle: string
  content: {
    problems: Array<{
      platform: string
      issues: string[]
    }>
    opportunity: string
  }
}

export default function ProblemSlide({ title, subtitle, content }: ProblemSlideProps) {
  return (
    <BaseSlide>
      <div className="animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-black mb-4">{title}</h1>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {content.problems.map((problem, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 className="text-base font-semibold text-red-800 mb-3 text-center">
                  {problem.platform}
                </h4>
                <ul className="space-y-3">
                  {problem.issues.map((issue, issueIndex) => (
                    <li key={issueIndex} className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">×</span>
                      <span className="text-red-700">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-lg text-green-700 text-center leading-relaxed">
              <span className="font-semibold">Opportunity:</span> {content.opportunity}
            </p>
          </div>
        </div>
      </div>
    </BaseSlide>
  )
}