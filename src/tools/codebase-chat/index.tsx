import { useState } from 'react'

export default function CodebaseChat() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <span className="text-zinc-500 animate-pulse text-sm">Loading Codebase Chat…</span>
        </div>
      )}
      <iframe
        src="https://codebase-chat-sigma.vercel.app/"
        title="Codebase Chat"
        onLoad={() => setLoaded(true)}
        className="w-full h-full border-0"
        allow="clipboard-write"
      />
    </div>
  )
}