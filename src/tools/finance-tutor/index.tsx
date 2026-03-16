import { useState } from 'react'

export default function FinanceTutor() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <span className="text-zinc-500 animate-pulse text-sm">Loading Finance Tutor…</span>
        </div>
      )}
      <iframe
        src="https://finance-tutor-five.vercel.app/"
        title="Finance Tutor"
        onLoad={() => setLoaded(true)}
        className="w-full h-full border-0"
        allow="clipboard-write"
      />
    </div>
  )
}
