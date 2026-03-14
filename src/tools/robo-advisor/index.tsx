import { useLogInteraction } from '../../hooks/useLogInteraction'
import { useEffect } from 'react'

export default function RoboAdvisor() {
  const log = useLogInteraction('robo-advisor')

  useEffect(() => {
    log('tool_view')
  }, [log])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <span className="text-6xl">📈</span>
      <h1 className="text-3xl font-bold text-white">Robo Advisor</h1>
      <p className="text-zinc-400 text-lg">Coming Soon</p>
      <p className="text-zinc-500 max-w-md">
        AI-powered investment guidance tailored to your financial goals. Check back soon.
      </p>
    </div>
  )
}
