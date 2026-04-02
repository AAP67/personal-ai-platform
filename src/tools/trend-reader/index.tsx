import { useState } from 'react'

export default function TrendReader() {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <span className="text-zinc-500 animate-pulse text-sm">Loading TrendReader…</span>
        </div>
      )}
      <iframe
        src="https://trend-reader.vercel.app/"
        title="TrendReader"
        onLoad={() => setLoaded(true)}
        className="w-full h-full border-0"
        allow="clipboard-write"
      />
    </div>
  )
}