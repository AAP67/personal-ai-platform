export default function CodebaseChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 bg-zinc-950">
      <span className="text-5xl">⌘</span>
      <h2 className="text-xl font-semibold text-white">Codebase Chat</h2>
      <p className="text-zinc-400 text-sm text-center max-w-md">
        Chat with any GitHub repo using AI. Opens in a new tab because GitHub OAuth requires a direct browser window.
      </p>
      <a
        href="https://codebase-chat-sigma.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 bg-cyan-500 text-black font-medium rounded-lg hover:bg-cyan-400 transition-colors"
      >
        Open Codebase Chat →
      </a>
    </div>
  )
}