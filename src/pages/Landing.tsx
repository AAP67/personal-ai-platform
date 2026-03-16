import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { toolsByCategory, categoryOrder, categoryMeta, ToolConfig } from '../tools/registry'

// ── SVG Icons ────────────────────────────────────────────────────
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  )
}

// ── Tool Card ────────────────────────────────────────────────────
function ToolCard({ tool, delay }: { tool: ToolConfig; delay: number }) {
  return (
    <Link
      to={`/tools/${tool.route}`}
      className="reveal group relative flex flex-col gap-4 p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.07)',
        transitionDelay: `${delay * 0.06}s`,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: '0 0 0 1px rgba(99,102,241,0.35), 0 0 30px rgba(99,102,241,0.06)' }}
      />

      <div className="flex items-start justify-between">
        <span className="text-2xl">{tool.icon}</span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border font-mono tracking-wide"
          style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399', borderColor: 'rgba(16,185,129,0.2)' }}
        >
          LIVE
        </span>
      </div>

      <div className="flex flex-col gap-1.5 flex-1">
        <h3 className="font-display font-semibold text-white text-[15px] group-hover:text-indigo-300 transition-colors">
          {tool.name}
        </h3>
        <p className="font-body text-zinc-500 text-sm leading-relaxed">
          {tool.description}
        </p>
      </div>

      <span className="text-xs text-zinc-600 group-hover:text-indigo-400 transition-colors flex items-center gap-1 font-body">
        Open
        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </span>
    </Link>
  )
}

// ── Landing Page ─────────────────────────────────────────────────
export default function Landing() {
  const grouped = toolsByCategory()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible')
        })
      },
      { threshold: 0.1 },
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  let globalToolIndex = 0

  return (
    <div className="min-h-screen text-white flex flex-col font-body" style={{ background: '#08080d' }}>

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 px-6 sm:px-10 py-4 flex items-center justify-between border-b backdrop-blur-md"
        style={{ background: 'rgba(8,8,13,0.88)', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <span className="font-display text-sm font-bold tracking-tight text-white">
          Personal AI
        </span>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-sm text-zinc-500 hover:text-white transition-colors px-3 py-1.5">
            Sign In
          </Link>
          <Link
            to="/dashboard"
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-400 hover:bg-indigo-500/10 transition-all duration-200"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden grain">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(ellipse, #6366f1 0%, transparent 70%)', filter: 'blur(80px)' }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto flex flex-col items-center gap-7 z-10">
          {/* Tool count chip */}
          <div
            className="hero-animate count-badge flex items-center gap-2 px-4 py-1.5 rounded-full border"
            style={{
              animationDelay: '0s',
              background: 'rgba(99,102,241,0.06)',
              borderColor: 'rgba(99,102,241,0.2)',
            }}
          >
            <span className="font-mono text-xs font-medium text-indigo-400">7 tools</span>
            <span className="text-zinc-700">·</span>
            <span className="font-mono text-xs font-medium text-indigo-400">3 domains</span>
            <span className="text-zinc-700">·</span>
            <span className="font-mono text-xs font-medium text-emerald-400">all live</span>
          </div>

          <h1
            className="hero-animate font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight"
            style={{ animationDelay: '0.1s' }}
          >
            Your Tools Define{' '}
            <span className="gradient-text">Your AI</span>
          </h1>

          <p
            className="hero-animate text-lg text-zinc-500 max-w-xl leading-relaxed"
            style={{ animationDelay: '0.2s' }}
          >
            A platform where your tool usage — not forms or questionnaires — builds a model of who you are.
          </p>

          <p
            className="hero-animate text-sm text-zinc-600"
            style={{ animationDelay: '0.25s' }}
          >
            Built by <span className="text-zinc-300 font-medium">Karan Rajpal</span>
          </p>

          <Link
            to="/dashboard"
            className="hero-animate mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-xl text-sm transition-all duration-200 shadow-2xl shadow-indigo-950/60 hover:shadow-indigo-900/50 hover:-translate-y-0.5"
            style={{ animationDelay: '0.35s' }}
          >
            Explore the Tools
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Scroll hint */}
        <div
          className="hero-animate absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-700"
          style={{ animationDelay: '0.9s' }}
        >
          <span className="text-[10px] tracking-[0.25em] uppercase font-mono">Scroll</span>
          <svg className="w-3.5 h-3.5 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          THE TOOLS — proof first
      ══════════════════════════════════════════════════════════ */}
      <section className="relative px-6 py-28 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto">

          <div className="reveal text-center mb-20">
            <span className="font-mono text-xs font-medium tracking-[0.2em] uppercase text-indigo-400">
              Suite
            </span>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl font-bold text-white">
              The Tools
            </h2>
            <p className="text-zinc-600 mt-3 text-base max-w-md mx-auto">
              Each one solves a real problem. Together, they reveal how you think.
            </p>
          </div>

          <div className="flex flex-col gap-16">
            {categoryOrder.map((cat) => {
              const tools = grouped[cat]
              if (!tools || tools.length === 0) return null
              const meta = categoryMeta[cat]

              return (
                <div key={cat}>
                  {/* Category header */}
                  <div className="reveal flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{meta.emoji}</span>
                      <h3 className="font-display text-base font-semibold text-white">
                        {cat}
                      </h3>
                    </div>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <span className="font-mono text-xs text-zinc-600">
                      {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
                    </span>
                  </div>

                  {/* Tool grid */}
                  <div className={`grid gap-4 ${tools.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                    {tools.map((tool) => {
                      const idx = globalToolIndex++
                      return <ToolCard key={tool.id} tool={tool} delay={idx} />
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          THE THESIS
      ══════════════════════════════════════════════════════════ */}
      <section
        className="relative flex flex-col items-center justify-center min-h-[65vh] px-6 py-28 text-center border-t"
        style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.012)' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-px" style={{ background: 'linear-gradient(90deg, transparent, #6366f1, transparent)' }} />

        <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">
          <span className="reveal font-mono text-xs font-medium tracking-[0.2em] uppercase text-indigo-400">
            Thesis
          </span>
          <h2 className="reveal font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
            Identity Is a Pattern,<br />Not a Profile
          </h2>
          <p className="reveal text-lg text-zinc-500 leading-relaxed" style={{ transitionDelay: '0.08s' }}>
            Every AI product asks users to describe themselves — fill out a form, set preferences, answer questions.
            But stated preferences are unreliable. What you actually reach for, how you reason through decisions,
            which risks you take — that's the real signal.
          </p>
          <p className="reveal text-lg text-zinc-500 leading-relaxed" style={{ transitionDelay: '0.14s' }}>
            This platform learns you by working alongside you.
            No onboarding. No questionnaires. Just tools — and the patterns that emerge from using them.
          </p>

          <div
            className="reveal flex items-center gap-3 mt-4 px-5 py-3 rounded-lg border"
            style={{
              transitionDelay: '0.2s',
              background: 'rgba(99,102,241,0.04)',
              borderColor: 'rgba(99,102,241,0.15)',
            }}
          >
            <span className="font-mono text-sm text-indigo-400 font-medium">Revealed preferences</span>
            <span className="text-zinc-600 font-mono text-sm">&gt;</span>
            <span className="font-mono text-sm text-zinc-500">stated preferences</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center px-6 py-28 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto w-full">

          <div className="reveal text-center mb-16">
            <span className="font-mono text-xs font-medium tracking-[0.2em] uppercase text-indigo-400">Process</span>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl font-bold text-white">How It Works</h2>
            <p className="text-zinc-600 mt-3 text-base">Three steps. No configuration.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-0">

            {/* Step 1 */}
            <div className="reveal flex-1 flex flex-col items-center text-center gap-4 px-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border"
                style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.15)' }}
              >
                <span className="font-mono text-indigo-400 font-bold text-lg">01</span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-white text-base">Choose Your Tools</h3>
                <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
                  Pick from 7 AI tools across finance, strategy, and career — each built for a domain that matters.
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="flex-shrink-0 self-center my-6 sm:my-0">
              <div className="hidden sm:block w-12 h-px" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.2), rgba(99,102,241,0.4), rgba(99,102,241,0.2))' }} />
              <div className="sm:hidden w-px h-8 mx-auto" style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.2), rgba(99,102,241,0.4))' }} />
            </div>

            {/* Step 2 */}
            <div className="reveal flex-1 flex flex-col items-center text-center gap-4 px-6" style={{ transitionDelay: '0.1s' }}>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border"
                style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.15)' }}
              >
                <span className="font-mono text-indigo-400 font-bold text-lg">02</span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-white text-base">Use Them Naturally</h3>
                <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
                  No forms. No profiles. Every search, decision, and interaction is logged as a signal.
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="flex-shrink-0 self-center my-6 sm:my-0">
              <div className="hidden sm:block w-12 h-px" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.2), rgba(99,102,241,0.4), rgba(99,102,241,0.2))' }} />
              <div className="sm:hidden w-px h-8 mx-auto" style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.2), rgba(99,102,241,0.4))' }} />
            </div>

            {/* Step 3 */}
            <div className="reveal flex-1 flex flex-col items-center text-center gap-4 px-6" style={{ transitionDelay: '0.2s' }}>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border"
                style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.15)' }}
              >
                <span className="font-mono text-indigo-400 font-bold text-lg">03</span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-white text-base">AI That Knows You</h3>
                <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
                  The platform infers your interests, reasoning style, and priorities — so it helps the way you think.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          ARCHITECTURE
      ══════════════════════════════════════════════════════════ */}
      <section
        className="relative flex flex-col items-center justify-center px-6 py-24 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.012)' }}
      >
        <div className="max-w-3xl mx-auto w-full">
          <div className="reveal text-center mb-12">
            <span className="font-mono text-xs font-medium tracking-[0.2em] uppercase text-indigo-400">
              Under the Hood
            </span>
            <h2 className="font-display mt-3 text-2xl sm:text-3xl font-bold text-white">
              Tech Stack
            </h2>
          </div>

          <div className="reveal flex flex-wrap justify-center gap-2.5">
            {[
              'React', 'TypeScript', 'Python', 'Claude API', 'LangGraph',
              'Firebase', 'Supabase', 'Streamlit', 'Vercel', 'Tailwind CSS',
            ].map((tech) => (
              <span
                key={tech}
                className="font-mono text-xs px-3 py-1.5 rounded-md border text-zinc-400"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          WHO BUILT THIS
      ══════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center min-h-[70vh] px-6 py-28 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[250px] opacity-8"
            style={{ background: 'radial-gradient(ellipse, #818cf8 0%, transparent 70%)', filter: 'blur(50px)' }}
          />
        </div>

        <div className="relative max-w-2xl mx-auto flex flex-col items-center gap-8 z-10">

          <div className="reveal flex flex-col items-center gap-2">
            <span className="font-mono text-xs font-medium tracking-[0.2em] uppercase text-indigo-400">Builder</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">Who Built This</h2>
          </div>

          <div className="reveal font-display text-4xl sm:text-5xl font-extrabold tracking-tight" style={{ transitionDelay: '0.05s' }}>
            <span className="gradient-text">Karan Rajpal</span>
          </div>

          {/* Credential chips */}
          <div className="reveal flex flex-wrap items-center justify-center gap-2" style={{ transitionDelay: '0.1s' }}>
            {[
              'Berkeley Haas MBA',
              'Borderless Capital',
              'KAUST Investment Management',
              'Handshake AI',
            ].map((chip) => (
              <span
                key={chip}
                className="text-xs font-medium px-3 py-1.5 rounded-full border text-zinc-400"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                {chip}
              </span>
            ))}
          </div>

          <p className="reveal text-base text-zinc-500 max-w-md" style={{ transitionDelay: '0.15s' }}>
            I build at the intersection of finance, operations, and AI.
          </p>

          {/* Social links */}
          <div className="reveal flex items-center gap-5" style={{ transitionDelay: '0.2s' }}>
            <a
              href="https://github.com/AAP67"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors duration-200"
              aria-label="GitHub"
            >
              <GitHubIcon className="w-4.5 h-4.5 group-hover:scale-110 transition-transform duration-200" />
              <span>GitHub</span>
            </a>
            <div className="w-px h-4 bg-zinc-800" />
            <a
              href="https://www.linkedin.com/in/krajpal/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors duration-200"
              aria-label="LinkedIn"
            >
              <LinkedInIcon className="w-4.5 h-4.5 group-hover:scale-110 transition-transform duration-200" />
              <span>LinkedIn</span>
            </a>
            <div className="w-px h-4 bg-zinc-800" />
            <a
              href="mailto:krajpal0995@gmail.com"
              className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors duration-200"
              aria-label="Email"
            >
              <MailIcon className="w-4.5 h-4.5 group-hover:scale-110 transition-transform duration-200" />
              <span>Email</span>
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="border-t py-8 px-6 sm:px-10" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-zinc-700">
            Personal AI Platform &copy; 2026
          </span>
          <div className="flex items-center gap-4 text-sm text-zinc-600">
            <span>
              Built by <span className="text-zinc-400 font-medium">Karan Rajpal</span>
            </span>
            <a href="https://github.com/AAP67" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors" aria-label="GitHub">
              <GitHubIcon className="w-4 h-4" />
            </a>
            <a href="https://www.linkedin.com/in/krajpal/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors" aria-label="LinkedIn">
              <LinkedInIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
