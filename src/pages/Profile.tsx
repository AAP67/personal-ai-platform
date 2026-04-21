import { Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import {
  collection, query, where, getDocs, addDoc,
  orderBy, limit, serverTimestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { type PersonaScores } from '../lib/computeScores'

/* ─── Types ────────────────────────────────────────────────── */

interface SignalDoc {
  toolId: string
  toolName: string
  signal: string
  signalData: Record<string, unknown>
  actionType: string
  duration?: number
  timestamp: { seconds: number } | null
}

interface Persona {
  summary: string
  dimensions: { name: string; score: number; value: string; confidence: string; evidence: string }[]
  drift_narrative: string | null
  system_prompt: string
}

interface Snapshot {
  scores: PersonaScores
  persona: Persona
  createdAt: { seconds: number }
}

const MIN_SIGNALS = 5
const MIN_TOOLS = 2

/* ─── Dimension labels for display ─────────────────────────── */

const DIM_META: Record<string, { low: string; high: string; color: string }> = {
  'Risk tolerance':        { low: 'Conservative',  high: 'Aggressive',  color: '#f59e0b' },
  'Domain breadth':        { low: 'Specialist',    high: 'Generalist',  color: '#6366f1' },
  'Decision style':        { low: 'Intuitive',     high: 'Analytical',  color: '#10b981' },
  'Learning approach':     { low: 'Structured',    high: 'Exploratory', color: '#ec4899' },
  'Strategic orientation': { low: 'Efficiency',    high: 'Growth',      color: '#8b5cf6' },
  'Technical depth':       { low: 'Surface',       high: 'Deep',        color: '#06b6d4' },
}

/* ─── Main Component ───────────────────────────────────────── */

export default function Profile() {
  const { user } = useAuth()
  const [signals, setSignals] = useState<SignalDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [scores, setScores] = useState<PersonaScores | null>(null)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeView, setActiveView] = useState<'radar' | 'timeline'>('radar')
  const radarCanvasRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)

  /* ── Fetch signals ──────────────────────────────────────── */
  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        // Fetch signals
        const sigQ = query(
          collection(db, 'interactions'),
          where('userId', '==', user!.uid),
        )
        const sigSnap = await getDocs(sigQ)
        const docs = sigSnap.docs.map(d => d.data() as SignalDoc)
        setSignals(docs)

        // Fetch past snapshots (last 10)
        const snapQ = query(
          collection(db, 'persona_snapshots'),
          where('userId', '==', user!.uid),
          orderBy('createdAt', 'desc'),
          limit(10),
        )
        const snapSnap = await getDocs(snapQ)
        const snaps = snapSnap.docs.map(d => d.data() as Snapshot).reverse()
        setSnapshots(snaps)

        // If we have snapshots, show the latest persona
        if (snaps.length > 0) {
          const latest = snaps[snaps.length - 1]
          setPersona(latest.persona)
          setScores(latest.scores)
        }
      } catch (err) {
        console.warn('[Profile] fetch failed', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  /* ── Compute thresholds ─────────────────────────────────── */
  const signalCount = signals.length
  const uniqueTools = new Set(signals.map(s => s.toolId)).size
  const meetsThreshold = signalCount >= MIN_SIGNALS && uniqueTools >= MIN_TOOLS
  const progress = Math.min(signalCount / MIN_SIGNALS, 1)

  /* ── Generate persona ───────────────────────────────────── */
  async function generatePersona() {
    if (!meetsThreshold || !user) return
    setGenerating(true)
    setError('')
    try {
      // Get previous scores for drift narrative
      const prevScores = snapshots.length > 0
        ? snapshots[snapshots.length - 1].scores.dimensions
        : undefined

      const res = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signals: signals.map(s => ({
            toolId: s.toolId,
            toolName: s.toolName,
            actionType: s.actionType,
            signal: s.signal,
            signalData: s.signalData,
            duration: s.duration,
            timestamp: s.timestamp,
          })),
          previous_scores: prevScores,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setPersona(data.persona)
        setScores(data.scores)

        // Save snapshot to Firestore
        await addDoc(collection(db, 'persona_snapshots'), {
          userId: user.uid,
          persona: data.persona,
          scores: data.scores,
          createdAt: serverTimestamp(),
        })

        setSnapshots(prev => [...prev, {
          scores: data.scores,
          persona: data.persona,
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
        }])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  /* ── Radar chart rendering ──────────────────────────────── */
  useEffect(() => {
    if (!scores || activeView !== 'radar' || !radarCanvasRef.current) return

    // Dynamic import Chart.js
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    script.onload = () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy()

      const Chart = (window as any).Chart
      const labels = scores.dimensions.map(d => d.name)
      const datasets: any[] = []

      // If we have past snapshots, show ghosted previous shapes
      if (snapshots.length > 1) {
        snapshots.slice(0, -1).forEach((snap, i) => {
          const opacity = 0.08 + (i / snapshots.length) * 0.15
          datasets.push({
            label: new Date(snap.createdAt.seconds * 1000).toLocaleDateString(),
            data: snap.scores.dimensions.map(d => d.score),
            backgroundColor: `rgba(99,102,241,${opacity})`,
            borderColor: `rgba(99,102,241,${opacity + 0.1})`,
            borderWidth: 1,
            pointRadius: 0,
          })
        })
      }

      // Current scores on top
      datasets.push({
        label: 'Current',
        data: scores.dimensions.map(d => d.score),
        backgroundColor: 'rgba(99,102,241,0.2)',
        borderColor: 'rgba(99,102,241,0.85)',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: 'rgba(99,102,241,1)',
      })

      chartInstanceRef.current = new Chart(radarCanvasRef.current, {
        type: 'radar',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            r: {
              min: 0, max: 100,
              ticks: { display: false, stepSize: 25 },
              grid: { color: 'rgba(255,255,255,0.15)' },
              angleLines: { color: 'rgba(255,255,255,0.15)' },
              pointLabels: { color: 'rgba(255,255,255,0.7)', font: { size: 12 } },
            }
          },
          animation: { duration: 600, easing: 'easeInOutCubic' },
        },
      })
    }
    document.head.appendChild(script)

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy()
    }
  }, [scores, activeView, snapshots])

  /* ── Copy / Export ──────────────────────────────────────── */
  async function copySystemPrompt() {
    if (!persona) return
    await navigator.clipboard.writeText(persona.system_prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadMarkdown() {
    if (!persona || !scores) return
    let md = `# My AI Persona\n\n> ${persona.summary}\n\n## Dimensions\n\n`
    scores.dimensions.forEach(d => {
      const meta = DIM_META[d.name]
      md += `### ${d.name}\n**${d.score}/100** (${d.confidence}) — ${meta?.low} → ${meta?.high}\n${d.evidence}\n\n`
    })
    if (persona.drift_narrative) md += `## What Changed\n${persona.drift_narrative}\n\n`
    md += `## System Prompt\n\n\`\`\`\n${persona.system_prompt}\n\`\`\`\n\n---\n*Generated by Francium — ${new Date().toLocaleDateString()}*\n`
    const blob = new Blob([md], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `francium-persona-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
  }

  /* ── Drift deltas (current vs previous) ─────────────────── */
  function getDelta(dimName: string): number | null {
    if (snapshots.length < 2 || !scores) return null
    const prev = snapshots[snapshots.length - 2].scores.dimensions.find(d => d.name === dimName)
    const curr = scores.dimensions.find(d => d.name === dimName)
    if (!prev || !curr) return null
    return curr.score - prev.score
  }

  /* ── Render ─────────────────────────────────────────────── */

  const confidenceColor: Record<string, string> = {
    low: '#f59e0b', medium: '#6366f1', high: '#10b981',
  }

  return (
    <div className="min-h-screen text-white font-body" style={{ background: '#08080d' }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between border-b backdrop-blur-md"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,8,13,0.85)' }}
      >
        <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Dashboard
        </Link>
        <span className="text-sm text-zinc-500">{user?.email}</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-12">
        {/* Header */}
        <header>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
            Your AI Persona
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            Built from how you use your tools. Not from what you tell us.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="text-zinc-600 animate-pulse text-sm">Loading signals…</span>
          </div>
        ) : !meetsThreshold ? (
          /* ── THRESHOLD NOT MET ─────────────────────────────── */
          <div className="flex flex-col gap-8">
            <div
              className="rounded-xl border p-6 flex flex-col gap-5"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                  Persona Progress
                </span>
                <span className="font-mono text-xs text-indigo-400">
                  {signalCount}/{MIN_SIGNALS} signals · {uniqueTools}/{MIN_TOOLS} tools
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, #6366f1, #a78bfa)' }}
                />
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {signalCount < MIN_SIGNALS && uniqueTools < MIN_TOOLS
                  ? `Use ${MIN_SIGNALS - signalCount} more actions across ${MIN_TOOLS - uniqueTools} more tools to unlock.`
                  : signalCount < MIN_SIGNALS
                  ? `${MIN_SIGNALS - signalCount} more actions needed.`
                  : `Try at least ${MIN_TOOLS} different tools.`
                }
              </p>
            </div>
          </div>
        ) : (
          /* ── MAIN PERSONA VIEW ─────────────────────────────── */
          <div className="flex flex-col gap-8">

            {/* Generate / Regenerate button */}
            {!persona && !generating && (
              <div
                className="rounded-xl border p-6 flex flex-col items-center gap-4 text-center"
                style={{ background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.15)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-emerald-400">✓ {signalCount} signals</span>
                  <span className="text-zinc-700">·</span>
                  <span className="font-mono text-xs text-emerald-400">✓ {uniqueTools} tools</span>
                </div>
                <button onClick={generatePersona} className="px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                  Generate My Persona
                </button>
              </div>
            )}

            {generating && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="w-8 h-8 rounded-full border-2 border-t-indigo-400 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#818cf8' }} />
                <p className="text-sm text-zinc-500">Computing scores + generating narrative…</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}

            {persona && scores && (
              <>
                {/* ── Summary ──────────────────────────────────── */}
                <div className="rounded-xl border p-6" style={{ background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.15)' }}>
                  <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider block mb-3">Summary</span>
                  <p className="text-base text-zinc-300 leading-relaxed">{persona.summary}</p>
                </div>

                {/* ── Drift narrative (if available) ────────────── */}
                {persona.drift_narrative && (
                  <div className="rounded-xl border p-6" style={{ background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.15)' }}>
                    <span className="font-mono text-[10px] text-amber-400 uppercase tracking-wider block mb-3">What changed</span>
                    <p className="text-sm text-zinc-300 leading-relaxed">{persona.drift_narrative}</p>
                  </div>
                )}

                {/* ── View toggle: Radar / Timeline ────────────── */}
                <div className="flex gap-2">
                  {(['radar', 'timeline'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setActiveView(v)}
                      className="px-4 py-2 rounded-lg text-xs font-medium transition-all border"
                      style={{
                        background: activeView === v ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                        borderColor: activeView === v ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
                        color: activeView === v ? '#818cf8' : '#71717a',
                      }}
                    >
                      {v === 'radar' ? 'Radar' : 'Timeline'}
                    </button>
                  ))}
                  {snapshots.length > 0 && (
                    <span className="font-mono text-[10px] text-zinc-600 self-center ml-auto">
                      {snapshots.length} snapshot{snapshots.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* ── Radar view ───────────────────────────────── */}
                {activeView === 'radar' && (
                  <div className="rounded-xl border p-6" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ position: 'relative', width: '100%', height: '320px' }}>
                      <canvas ref={radarCanvasRef} />
                    </div>
                    {snapshots.length > 1 && (
                      <div className="flex gap-4 justify-center mt-4 text-[10px] text-zinc-600">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(99,102,241,0.15)' }} />
                          Earlier
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(99,102,241,0.85)' }} />
                          Current
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Timeline view ─────────────────────────────── */}
                {activeView === 'timeline' && (
                  <div className="flex flex-col gap-3">
                    {scores.dimensions.map(dim => {
                      const meta = DIM_META[dim.name]
                      const delta = getDelta(dim.name)
                      return (
                        <div
                          key={dim.name}
                          className="rounded-lg border p-4 flex items-center gap-4"
                          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                          {/* Label */}
                          <div className="w-32 shrink-0">
                            <div className="text-sm font-medium text-white">{dim.name}</div>
                            <div className="text-[10px] text-zinc-600">{meta?.low} → {meta?.high}</div>
                          </div>

                          {/* Bar */}
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${dim.score}%`, background: meta?.color || '#6366f1' }}
                              />
                            </div>
                            <span className="font-mono text-xs text-zinc-300 w-8 text-right">{dim.score}</span>
                          </div>

                          {/* Delta */}
                          <div className="w-14 text-right">
                            {delta !== null ? (
                              <span
                                className="font-mono text-xs"
                                style={{ color: delta > 3 ? '#10b981' : delta < -3 ? '#f59e0b' : '#52525b' }}
                              >
                                {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {delta > 0 ? '+' : ''}{delta}
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] text-zinc-700">—</span>
                            )}
                          </div>

                          {/* Confidence dot */}
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: confidenceColor[dim.confidence] }}
                            title={`${dim.confidence} confidence`}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── System Prompt ─────────────────────────────── */}
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                    Portable persona — paste into any AI
                  </span>
                  <div className="rounded-lg border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="font-mono text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                      {persona.system_prompt}
                    </p>
                  </div>
                </div>

                {/* ── Actions ──────────────────────────────────── */}
                <div className="flex gap-3">
                  <button
                    onClick={copySystemPrompt}
                    className="flex-1 px-4 py-3 rounded-lg text-sm font-medium border transition-all"
                    style={{
                      background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                      borderColor: copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)',
                      color: copied ? '#34d399' : '#a1a1aa',
                    }}
                  >
                    {copied ? '✓ Copied!' : 'Copy System Prompt'}
                  </button>
                  <button
                    onClick={downloadMarkdown}
                    className="flex-1 px-4 py-3 rounded-lg text-sm font-medium border transition-all"
                    style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)', color: '#818cf8' }}
                  >
                    Download .md
                  </button>
                </div>

                <button
                  onClick={generatePersona}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors self-center"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Regenerate persona
                </button>

                {/* Footer */}
                <div
                  className="rounded-lg border px-4 py-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <span className="font-mono text-[10px] text-zinc-600">
                    {scores.totalSignals} signals · {snapshots.length} snapshots · {new Date().toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}