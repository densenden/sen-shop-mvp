import BaseSlide from './BaseSlide'

interface ProblemSlideProps {
  title: string
  subtitle: string
  content: {
    problems?: Array<{
      platform: string
      issues: string[]
    }>
    market_problems?: Array<{
      platform: string
      issues: string[]
    }>
    personal_motivation?: string
    learning_goals?: string
    opportunity: string
  }
}

export default function ProblemSlide({ title, subtitle, content }: ProblemSlideProps) {
  const problems = content.problems || content.market_problems || []
  
  return (
    <BaseSlide>
      <div className="animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-normal text-black mb-4">{title}</h1>
          <p className="text-xl text-gray-600">{subtitle}</p>
        </div>

        <div className="max-w-6xl mx-auto">
          {content.personal_motivation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <p className="text-lg text-blue-700 text-center leading-relaxed">
                {content.personal_motivation}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {problems.map((problem, index) => (
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