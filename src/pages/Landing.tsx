import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
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

// ── Row-style tool card ──────────────────────────────────────────
function ToolRow({ tool, accentBorder, accentBg }: {
  tool: ToolConfig
  accent: string
  accentBorder: string
  accentBg: string
}) {
  return (
    <Link
      to={`/tools/${tool.route}`}
      className="group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'rgba(255,255,255,0.015)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `0 0 0 1px ${accentBorder}, 0 0 28px ${accentBg}` }}
      />

      {/* Icon */}
      <div
        className="relative w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ background: accentBg, border: `1px solid ${accentBorder}` }}
      >
        {tool.icon}
      </div>

      {/* Text */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <h3 className="font-display font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors truncate">
            {tool.name}
          </h3>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono tracking-wider shrink-0"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}
          >
            LIVE
          </span>
        </div>
        <p className="font-body text-zinc-500 text-xs leading-relaxed mt-1 line-clamp-1">
          {tool.description}
        </p>
      </div>

      {/* Arrow */}
      <svg
        className="relative w-4 h-4 text-zinc-700 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

// ── How-it-works step ────────────────────────────────────────────
function Step({ num, title, desc, isLast }: {
  num: string
  title: string
  desc: string
  isLast?: boolean
}) {
  return (
    <div className="flex gap-3.5">
      {/* Vertical connector */}
      <div className="flex flex-col items-center">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          <span className="font-mono text-[10px] font-bold text-indigo-400">{num}</span>
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 min-h-[20px] mt-1.5"
            style={{ background: 'rgba(99,102,241,0.12)' }}
          />
        )}
      </div>

      {/* Text */}
      <div className="pb-5">
        <p className="font-display text-[13px] font-semibold text-white leading-snug">{title}</p>
        <p className="font-body text-xs text-zinc-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ── Landing Page ─────────────────────────────────────────────────
export default function Landing() {
  const grouped = toolsByCategory()
  const rightPanelRef = useRef<HTMLDivElement>(null)

  // Staggered reveal for tool cards
  useEffect(() => {
    const cards = rightPanelRef.current?.querySelectorAll('.tool-reveal')
    if (!cards) return

    cards.forEach((card, i) => {
      const el = card as HTMLElement
      el.style.opacity = '0'
      el.style.transform = 'translateY(16px)'
      el.style.transition = `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`

      requestAnimationFrame(() => {
        setTimeout(() => {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        }, 50)
      })
    })
  }, [])

  return (
    <div className="h-screen flex flex-col font-body overflow-hidden" style={{ background: '#08080d' }}>

      {/* ── Top Bar ── */}
      <nav
        className="shrink-0 px-6 py-3.5 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,8,13,0.95)' }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center border"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.12))',
              borderColor: 'rgba(99,102,241,0.3)',
            }}
          >
            <span className="font-display text-sm font-extrabold text-indigo-400">Fr</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-extrabold tracking-tight text-white">
              Francium
            </span>
            <span
              className="text-[10px] font-mono hidden sm:inline px-1.5 py-0.5 rounded"
              style={{ color: 'rgba(99,102,241,0.5)', background: 'rgba(99,102,241,0.08)' }}
            >
              element 87
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1">
            Sign In
          </Link>
          <Link
            to="/dashboard"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-md border border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-400 hover:bg-indigo-500/10 transition-all duration-200"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* ── Main Split ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">

        {/* ── LEFT PANEL: Thesis + How it works ── */}
        <aside
          className="lg:w-[340px] xl:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col p-6 lg:p-8 overflow-y-auto relative"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Gradient orb */}
          <div
            className="absolute -bottom-16 -left-10 w-52 h-52 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)' }}
          />

          {/* Thesis */}
          <div className="relative z-10 flex flex-col gap-5 hero-animate" style={{ animationDelay: '0.1s' }}>
            <h1 className="font-display text-[26px] xl:text-[30px] font-extrabold text-white leading-[1.15] tracking-tight">
              Your tools define{' '}
              <span className="gradient-text">your AI</span>
            </h1>

            <p className="font-body text-sm text-zinc-500 leading-relaxed">
              A platform where tool usage — not forms — builds a model of who you are.
              Every search, decision, and interaction is a signal.
            </p>

            {/* Thesis pill */}
            <div
              className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg border self-start overflow-hidden"
              style={{
                background: 'rgba(99,102,241,0.06)',
                borderColor: 'rgba(99,102,241,0.18)',
              }}
            >
              <span className="font-mono text-xs text-indigo-300 font-semibold relative">revealed preferences</span>
              <span className="text-indigo-500/60 font-mono text-xs font-bold relative">&gt;</span>
              <span className="font-mono text-xs text-zinc-500 relative">stated preferences</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px my-7" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* How it works — connected steps */}
          <div className="relative z-10 flex flex-col hero-animate" style={{ animationDelay: '0.3s' }}>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-5">
              How it works
            </span>

            <Step
              num="1"
              title="Use the tools"
              desc="Search, analyze, decide — naturally."
            />
            <Step
              num="2"
              title="Signals accumulate"
              desc="Every action reveals a behavioral preference."
            />
            <Step
              num="3"
              title="Persona emerges"
              desc="Portable to any AI. No forms, no questionnaires."
              isLast
            />

            <Link
              to="/profile"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors mt-2 flex items-center gap-1.5 group"
            >
              View your persona
              <svg
                className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-6" />

          {/* Builder byline */}
          <div
            className="relative z-10 flex flex-col gap-2.5 mt-6 hero-animate"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <p className="text-[11px] text-zinc-600 pt-1">
              Built by{' '}
              <span className="text-zinc-400 font-medium">Karan Rajpal</span>
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/AAP67"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-white transition-colors"
              >
                <GitHubIcon className="w-3 h-3" />
                <span>GitHub</span>
              </a>
              <div className="w-px h-3 bg-zinc-800" />
              <a
                href="https://www.linkedin.com/in/krajpal/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-white transition-colors"
              >
                <LinkedInIcon className="w-3 h-3" />
                <span>LinkedIn</span>
              </a>
              <div className="w-px h-3 bg-zinc-800" />
              <a
                href="mailto:krajpal0995@gmail.com"
                className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-white transition-colors"
              >
                <MailIcon className="w-3 h-3" />
                <span>Email</span>
              </a>
            </div>
            <span className="font-mono text-[10px] text-zinc-800">
              © 2026 Francium
            </span>
          </div>
        </aside>

        {/* ── RIGHT PANEL: Tools ── */}
        <main ref={rightPanelRef} className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-2xl">
            <div className="flex flex-col gap-10">
              {categoryOrder.map((cat) => {
                const tools = grouped[cat]
                if (!tools || tools.length === 0) return null
                const meta = categoryMeta[cat]

                return (
                  <section key={cat}>
                    {/* Category header */}
                    <div className="flex items-center gap-2.5 mb-3 tool-reveal">
                      <div
                        className="w-1 h-4 rounded-full"
                        style={{ background: meta.accent }}
                      />
                      <h2
                        className="font-display text-xs font-semibold uppercase tracking-wider"
                        style={{ color: meta.accent }}
                      >
                        {cat}
                      </h2>
                      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                      <span className="font-mono text-[10px] text-zinc-700">
                        {tools.length}
                      </span>
                    </div>

                    {/* Tool rows */}
                    <div className="flex flex-col gap-2.5">
                      {tools.map((tool) => (
                        <div key={tool.id} className="tool-reveal">
                          <ToolRow
                            tool={tool}
                            accent={meta.accent}
                            accentBorder={meta.accentBorder}
                            accentBg={meta.accentBg}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
