import { useState } from 'react'

export default function EquityResearch() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <span className="text-zinc-500 animate-pulse text-sm">Loading Markets Tool…</span>
        </div>
      )}
      <iframe
        src="https://equity-research-ai-francium77.streamlit.app/?embed=true"
        title="Markets Tool"
        onLoad={() => setLoaded(true)}
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  )
}
