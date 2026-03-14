import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between border-b border-zinc-800">
        <span className="text-lg font-semibold tracking-tight">Personal AI</span>
        <Link
          to="/dashboard"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Dashboard →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">
            Personal AI Platform
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight">
            Your Tools Define{' '}
            <span className="text-indigo-400">Your AI</span>
          </h1>
          <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
            One platform. Your tools. Your data. Your personal AI — built from how you think.
          </p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-semibold px-8 py-4 rounded-xl text-lg"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Narrative */}
      <section className="bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-20 grid sm:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <span className="text-4xl">🧰</span>
            <h3 className="font-semibold text-white text-lg">Choose Your Tools</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Pick from a growing suite of AI-powered tools — from financial planning to personal
              writing — each one designed around the way real people think and decide.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <span className="text-4xl">🔄</span>
            <h3 className="font-semibold text-white text-lg">Use Them Naturally</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Just use the tools. Ask questions, explore scenarios, draft ideas. Every interaction
              is an honest signal of how you think — no forms to fill, no profiles to build.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <span className="text-4xl">🧠</span>
            <h3 className="font-semibold text-white text-lg">AI That Knows You</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Over time the platform builds a model of you — your goals, reasoning style, and
              values — creating an AI that genuinely understands you, not just your queries.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 text-center text-zinc-600 text-sm">
        Personal AI Platform &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
