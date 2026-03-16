import { useState } from 'react'

export default function AIConsultant() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <span className="text-zinc-500 animate-pulse text-sm">Loading AI Consultant…</span>
        </div>
      )}
      <iframe
        src="https://arkanexconsultant.streamlit.app/?embed=true"
        title="AI Consultant"
        onLoad={() => setLoaded(true)}
        className="w-full h-full border-0"
        allow="clipboard-write"
      />
    </div>
  )
}
