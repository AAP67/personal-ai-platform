import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
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

// ── Boosted card tints (registry values are too subtle at 0.05) ──
const CARD_TINTS: Record<string, { bg: string; border: string }> = {
  'Finance & Investment':   { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.18)' },
  'Strategy & Operations':  { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.18)' },
  'Career & Learning':      { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.18)' },
}

// ── Signal Counter ───────────────────────────────────────────────
function SignalCounter() {
  const [count, setCount] = useState<number | null>(null)
  const [lastSignal, setLastSignal] = useState<string | null>(null)
  const [displayCount, setDisplayCount] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    async function fetchStats() {
      try {
        const snap = await getDoc(doc(db, 'meta', 'platform_stats'))
        if (snap.exists()) {
          const data = snap.data()
          const total = data.totalSignals ?? 0
          setCount(total)

          if (data.lastSignalAt?.seconds) {
            const diff = Math.floor((Date.now() / 1000) - data.lastSignalAt.seconds)
            if (diff < 60) setLastSignal(`${diff}s ago`)
            else if (diff < 3600) setLastSignal(`${Math.floor(diff / 60)}m ago`)
            else if (diff < 86400) setLastSignal(`${Math.floor(diff / 3600)}h ago`)
            else setLastSignal(`${Math.floor(diff / 86400)}d ago`)
          }
        } else {
          // Doc doesn't exist yet — show 0
          setCount(0)
        }
      } catch (err) {
        console.warn('[SignalCounter] fetch failed:', err)
        setFailed(true)
      } finally {
        setLoaded(true)
      }
    }
    fetchStats()
  }, [])

  // Animate count up
  useEffect(() => {
    if (count === null || count === 0) return
    const duration = 1200
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayCount(Math.round(count! * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [count])

  // Don't render until loaded
  if (!loaded) return null
  // If rules blocked us, show nothing rather than broken UI
  if (failed) return null

  return (
    <div
      className="hero-animate rounded-lg border px-4 py-3.5 flex items-center gap-3"
      style={{
        background: 'rgba(99,102,241,0.05)',
        borderColor: 'rgba(99,102,241,0.15)',
        animationDelay: '1.3s',
      }}
    >
      {/* Pulsing dot */}
      <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
        <div
          className="absolute w-5 h-5 rounded-full"
          style={{ background: 'rgba(99,102,241,0.15)' }}
        />
        <div
          className="signal-dot absolute w-2.5 h-2.5 rounded-full"
          style={{ background: '#818cf8' }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-sm font-bold text-indigo-300">
            {count === 0 ? '0' : displayCount.toLocaleString()}
          </span>
          <span className="font-mono text-[10px] text-zinc-500">signals captured</span>
        </div>
        {lastSignal ? (
          <p className="font-mono text-[10px] text-zinc-600 mt-0.5">
            Last signal: {lastSignal}
          </p>
        ) : count === 0 ? (
          <p className="font-mono text-[10px] text-zinc-600 mt-0.5">
            Use any tool to begin
          </p>
        ) : null}
      </div>
    </div>
  )
}

// ── Row-style tool card ──────────────────────────────────────────
function ToolRow({ tool, category, accentBorder, accentBg, delay }: {
  tool: ToolConfig
  category: string
  accent: string
  accentBorder: string
  accentBg: string
  delay: number
}) {
  const tint = CARD_TINTS[category] || { bg: accentBg, border: accentBorder }

  return (
    <Link
      to={`/tools/${tool.route}`}
      className="tool-card-animate group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: tint.bg,
        borderColor: tint.border,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `0 0 0 1px ${accentBorder}, 0 0 32px ${accentBg}` }}
      />

      {/* Icon */}
      <div
        className="relative w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 transition-transform duration-300 group-hover:scale-110"
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
            className="live-badge text-[9px] font-bold px-1.5 py-0.5 rounded font-mono tracking-wider shrink-0"
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
        className="relative w-4 h-4 text-zinc-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-200 shrink-0"
        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

// ── How-it-works step ────────────────────────────────────────────
function Step({ num, title, desc, isLast, stepIndex }: {
  num: string
  title: string
  desc: string
  isLast?: boolean
  stepIndex: number
}) {
  const baseDelay = 600
  const circleDelay = baseDelay + stepIndex * 250
  const connectorDelay = circleDelay + 200

  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <div
          className="step-circle w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            animationDelay: `${circleDelay}ms`,
          }}
        >
          <span className="font-mono text-[10px] font-bold text-indigo-400">{num}</span>
        </div>
        {!isLast && (
          <div
            className="step-connector w-px flex-1 min-h-[20px] mt-1.5"
            style={{
              background: 'rgba(99,102,241,0.12)',
              animationDelay: `${connectorDelay}ms`,
            }}
          />
        )}
      </div>
      <div
        className="pb-5 hero-animate"
        style={{ animationDelay: `${circleDelay + 100}ms` }}
      >
        <p className="font-display text-[13px] font-semibold text-white leading-snug">{title}</p>
        <p className="font-body text-xs text-zinc-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ── Landing Page ─────────────────────────────────────────────────
export default function Landing() {
  const grouped = toolsByCategory()
  let toolIndex = 0

  return (
    <div className="h-screen flex flex-col font-body overflow-hidden relative grain" style={{ background: '#08080d' }}>

      {/* ── Top Bar ── */}
      <nav
        className="shrink-0 px-6 py-3.5 flex items-center justify-between border-b relative z-10"
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
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative z-10">

        {/* ── LEFT PANEL ── */}
        <aside
          className="lg:w-[340px] xl:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col p-6 lg:p-8 overflow-y-auto relative"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {/* Gradient orb */}
          <div
            className="gradient-orb absolute -bottom-16 left-1/2 w-64 h-64 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
              transform: 'translateX(-50%)',
            }}
          />

          {/* Thesis */}
          <div className="relative z-10 flex flex-col gap-5">
            <h1
              className="hero-animate font-display text-[26px] xl:text-[30px] font-extrabold text-white leading-[1.15] tracking-tight"
              style={{ animationDelay: '0.15s' }}
            >
              Your tools define{' '}
              <span className="gradient-text">your AI</span>
            </h1>

            <p
              className="hero-animate font-body text-sm text-zinc-500 leading-relaxed"
              style={{ animationDelay: '0.3s' }}
            >
              A platform where tool usage — not forms — builds a model of who you are.
              Every search, decision, and interaction is a signal.
            </p>

            {/* Thesis pill */}
            <div
              className="hero-animate thesis-pill flex items-center gap-2.5 px-4 py-2.5 rounded-lg border self-start"
              style={{
                background: 'rgba(99,102,241,0.06)',
                borderColor: 'rgba(99,102,241,0.18)',
                animationDelay: '0.45s',
              }}
            >
              <span className="font-mono text-xs text-indigo-300 font-semibold relative z-10">revealed preferences</span>
              <span className="text-indigo-500/60 font-mono text-xs font-bold relative z-10">&gt;</span>
              <span className="font-mono text-xs text-zinc-500 relative z-10">stated preferences</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px my-7" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* How it works */}
          <div className="relative z-10 flex flex-col">
            <span
              className="hero-animate font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-5"
              style={{ animationDelay: '0.55s' }}
            >
              How it works
            </span>

            <Step num="1" title="Use the tools" desc="Search, analyze, decide — naturally." stepIndex={0} />
            <Step num="2" title="Signals accumulate" desc="Every action reveals a behavioral preference." stepIndex={1} />
            <Step num="3" title="Persona emerges" desc="Portable to any AI. No forms, no questionnaires." stepIndex={2} isLast />

            <Link
              to="/profile"
              className="hero-animate text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors mt-2 flex items-center gap-1.5 group"
              style={{ animationDelay: '1.5s' }}
            >
              View your persona
              <svg
                className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200"
                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Divider */}
          <div className="w-full h-px my-6" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Signal Counter */}
          <div className="relative z-10">
            <SignalCounter />
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-4" />

          {/* Builder byline */}
          <div
            className="hero-animate relative z-10 flex flex-col gap-2.5 mt-6"
            style={{ animationDelay: '1.7s' }}
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

        {/* ── RIGHT PANEL ── */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative">
          {/* Amber orb behind finance section */}
          <div
            className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top right, rgba(245,158,11,0.06) 0%, transparent 65%)' }}
          />
          {/* Emerald orb behind career section */}
          <div
            className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at bottom left, rgba(16,185,129,0.05) 0%, transparent 65%)' }}
          />

          <div className="max-w-2xl relative z-10">
            <div className="flex flex-col gap-10">
              {categoryOrder.map((cat) => {
                const tools = grouped[cat]
                if (!tools || tools.length === 0) return null
                const meta = categoryMeta[cat]
                const categoryDelay = 300 + toolIndex * 80

                return (
                  <section key={cat}>
                    <div
                      className="hero-animate flex items-center gap-2.5 mb-3"
                      style={{ animationDelay: `${categoryDelay}ms` }}
                    >
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
                      <div
                        className="category-header-line flex-1 h-px"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          animationDelay: `${categoryDelay + 200}ms`,
                        }}
                      />
                      <span className="font-mono text-[10px] text-zinc-700">
                        {tools.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {tools.map((tool) => {
                        const delay = 400 + toolIndex * 80
                        toolIndex++
                        return (
                          <ToolRow
                            key={tool.id}
                            tool={tool}
                            category={cat}
                            accent={meta.accent}
                            accentBorder={meta.accentBorder}
                            accentBg={meta.accentBg}
                            delay={delay}
                          />
                        )
                      })}
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
