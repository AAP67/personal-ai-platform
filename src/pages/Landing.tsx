import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function Landing() {
  // Scroll-reveal via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col scroll-smooth">

      {/* Nav */}
      <nav className="sticky top-0 z-50 px-8 py-5 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <span className="text-lg font-semibold tracking-tight">Personal AI</span>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/dashboard"
            className="text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-semibold px-4 py-2 rounded-lg"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-36 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <span
            className="hero-animate text-xs font-semibold tracking-widest text-indigo-400 uppercase"
            style={{ animationDelay: '0s' }}
          >
            Personal AI Platform
          </span>
          <h1
            className="hero-animate text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight"
            style={{ animationDelay: '0.1s' }}
          >
            Your Tools Define{' '}
            <span className="gradient-text">Your AI</span>
          </h1>
          <p
            className="hero-animate text-xl text-zinc-400 leading-relaxed max-w-2xl"
            style={{ animationDelay: '0.2s' }}
          >
            Most AI assistants wait for instructions. Ours learns from how you use your tools —
            your searches, your decisions, your patterns. No forms. No prompts. Just use.
          </p>
          <Link
            to="/dashboard"
            className="hero-animate mt-2 inline-block bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-semibold px-8 py-4 rounded-xl text-lg shadow-lg shadow-indigo-950"
            style={{ animationDelay: '0.3s' }}
          >
            Explore Dashboard
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-28">
          <div className="reveal text-center mb-16">
            <h2 className="text-3xl font-bold text-white">How It Works</h2>
            <p className="text-zinc-400 mt-3 text-lg">Three steps. No configuration required.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center">

            {/* Step 1 */}
            <div className="reveal flex-1 flex flex-col items-center text-center gap-4 px-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl">
                🧰
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">Step 1</span>
                <h3 className="font-semibold text-white text-lg">Choose Your Tools</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Pick from a growing suite of AI-powered tools. Each one is purpose-built for a domain that matters to you.
              </p>
            </div>

            {/* Connector */}
            <div className="flex-shrink-0 text-zinc-700 text-xl my-6 sm:my-0 self-center rotate-90 sm:rotate-0">
              ──→
            </div>

            {/* Step 2 */}
            <div className="reveal flex-1 flex flex-col items-center text-center gap-4 px-4" style={{ transitionDelay: '0.12s' }}>
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl">
                🔄
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">Step 2</span>
                <h3 className="font-semibold text-white text-lg">Use Them Naturally</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Just use the tools. No forms to fill, no profiles to build. Every search, every decision is a signal.
              </p>
            </div>

            {/* Connector */}
            <div className="flex-shrink-0 text-zinc-700 text-xl my-6 sm:my-0 self-center rotate-90 sm:rotate-0">
              ──→
            </div>

            {/* Step 3 */}
            <div className="reveal flex-1 flex flex-col items-center text-center gap-4 px-4" style={{ transitionDelay: '0.24s' }}>
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl">
                🧠
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">Step 3</span>
                <h3 className="font-semibold text-white text-lg">AI That Knows You</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                The platform builds a model of you — your goals, reasoning style, values — so it helps you the way you actually think.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Tools Showcase */}
      <section className="border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-28">
          <div className="reveal text-center mb-16">
            <h2 className="text-3xl font-bold text-white">The Tools</h2>
            <p className="text-zinc-400 mt-3 text-lg">Built to make AI personal, one domain at a time.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">

            {/* Robo Advisor — Live */}
            <Link
              to="/tools/robo-advisor"
              className="reveal group bg-zinc-900 border border-zinc-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/50"
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl">📈</span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Live
                </span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg group-hover:text-indigo-400 transition-colors">
                  Robo Advisor
                </h3>
                <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                  AI-powered investment guidance tailored to your financial goals and risk profile.
                </p>
              </div>
              <span className="text-xs text-zinc-500 mt-auto group-hover:text-indigo-400 transition-colors">
                Open →
              </span>
            </Link>

            {/* Career Tool — Coming Soon */}
            <div
              className="reveal bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4"
              style={{ transitionDelay: '0.1s' }}
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl grayscale opacity-50">💼</span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-800 text-zinc-500 border border-zinc-700/50 rounded-full">
                  Coming Soon
                </span>
              </div>
              <div>
                <h3 className="text-zinc-500 font-semibold text-lg">Career Tool</h3>
                <p className="text-zinc-600 text-sm mt-1 leading-relaxed">
                  Resume coaching, interview prep, and career path planning powered by AI.
                </p>
              </div>
            </div>

            {/* Markets Tool — Coming Soon */}
            <div
              className="reveal bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4"
              style={{ transitionDelay: '0.2s' }}
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl grayscale opacity-50">🌐</span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-800 text-zinc-500 border border-zinc-700/50 rounded-full">
                  Coming Soon
                </span>
              </div>
              <div>
                <h3 className="text-zinc-500 font-semibold text-lg">Markets Tool</h3>
                <p className="text-zinc-600 text-sm mt-1 leading-relaxed">
                  Real-time market intelligence with AI-driven summaries and trend analysis.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-zinc-600 text-sm">
            Personal AI Platform &copy; {new Date().getFullYear()}
          </span>
          <div className="flex items-center gap-1 text-sm text-zinc-400">
            <span>Built by</span>
            <span className="font-semibold text-white ml-1">Karan Rajpal</span>
            <span className="text-zinc-700 mx-2">·</span>
            <a
              href="https://github.com/AAP67"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <span className="text-zinc-700 mx-2">·</span>
            <a
              href="https://linkedin.com/in/karanrajpal"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
