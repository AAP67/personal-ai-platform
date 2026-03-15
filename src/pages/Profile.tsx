import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

interface Interaction {
  toolId: string
  toolName: string
  actionType: string
  sessionId: string
  timestamp: { seconds: number } | null
}

interface Stats {
  totalSessions: number
  uniqueTools: number
  mostUsedTool: string | null
  lastActive: Date | null
  toolOpenCounts: Record<string, { name: string; count: number }>
}

const TOOL_INSIGHTS: Record<string, string[]> = {
  'robo-advisor': ['Investment Strategy', 'Portfolio Optimization', 'Risk Analysis'],
  'equity-research': ['Equity Research', 'Market Analysis', 'Financial Modeling'],
  'arkanex': ['Career Development', 'Interview Prep', 'Strategic Roles'],
}

function computeStats(interactions: Interaction[]): Stats {
  const opens = interactions.filter((i) => i.actionType === 'tool_open' && i.toolId !== 'dashboard')
  const sessions = interactions.filter((i) => i.actionType === 'session_start')

  const toolOpenCounts: Record<string, { name: string; count: number }> = {}
  for (const i of opens) {
    if (!toolOpenCounts[i.toolId]) {
      toolOpenCounts[i.toolId] = { name: i.toolName, count: 0 }
    }
    toolOpenCounts[i.toolId].count++
  }

  const uniqueTools = Object.keys(toolOpenCounts).length

  let mostUsedTool: string | null = null
  let maxCount = 0
  for (const [id, { count }] of Object.entries(toolOpenCounts)) {
    if (count > maxCount) { maxCount = count; mostUsedTool = id }
  }

  const allTimestamps = interactions
    .filter((i) => i.timestamp)
    .map((i) => new Date((i.timestamp!.seconds) * 1000))
  const lastActive = allTimestamps.length > 0
    ? new Date(Math.max(...allTimestamps.map((d) => d.getTime())))
    : null

  return { totalSessions: sessions.length, uniqueTools, mostUsedTool, lastActive, toolOpenCounts }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="flex flex-col gap-1 p-5 rounded-xl border"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchInteractions() {
      try {
        const q = query(
          collection(db, 'interactions'),
          where('userId', '==', user!.uid),
        )
        const snap = await getDocs(q)
        const docs = snap.docs.map((d) => d.data() as Interaction)
        setStats(computeStats(docs))
      } catch (err) {
        console.warn('[Profile] fetch failed', err)
        setStats(computeStats([]))
      } finally {
        setLoading(false)
      }
    }
    fetchInteractions()
  }, [user])

  // Derive insight tags from the top tools by open count
  const insightTags: string[] = []
  if (stats) {
    const sorted = Object.entries(stats.toolOpenCounts).sort((a, b) => b[1].count - a[1].count)
    for (const [toolId] of sorted) {
      const tags = TOOL_INSIGHTS[toolId] ?? []
      for (const tag of tags) {
        if (!insightTags.includes(tag)) insightTags.push(tag)
      }
    }
  }

  const maxCount = stats
    ? Math.max(...Object.values(stats.toolOpenCounts).map((t) => t.count), 1)
    : 1

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0a0f' }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between border-b backdrop-blur-md"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,10,15,0.85)' }}
      >
        <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Dashboard
        </Link>
        <span className="text-sm text-zinc-500">{user?.email}</span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 flex flex-col gap-16">

        {/* Header */}
        <header className="hero-animate flex flex-col gap-2" style={{ animationDelay: '0s' }}>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Your AI Profile</h1>
          <p className="text-zinc-500 text-base">Built from how you use your tools.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="text-zinc-600 animate-pulse text-sm">Loading your profile…</span>
          </div>
        ) : (
          <>
            {/* Section 1 — Activity Summary */}
            <section className="hero-animate flex flex-col gap-6" style={{ animationDelay: '0.08s' }}>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-white">Activity Summary</h2>
                <p className="text-zinc-600 text-sm">Your usage at a glance.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Sessions" value={stats?.totalSessions ?? 0} />
                <StatCard label="Tools Used" value={stats?.uniqueTools ?? 0} />
                <StatCard
                  label="Top Tool"
                  value={
                    stats?.mostUsedTool
                      ? (stats.toolOpenCounts[stats.mostUsedTool]?.name ?? '—')
                      : '—'
                  }
                />
                <StatCard
                  label="Last Active"
                  value={stats?.lastActive ? formatDate(stats.lastActive) : '—'}
                />
              </div>
            </section>

            {/* Section 2 — Tool Usage */}
            <section className="hero-animate flex flex-col gap-6" style={{ animationDelay: '0.14s' }}>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-white">Tool Usage</h2>
                <p className="text-zinc-600 text-sm">How often you've opened each tool.</p>
              </div>

              {Object.keys(stats?.toolOpenCounts ?? {}).length === 0 ? (
                <p className="text-zinc-600 text-sm">No tool opens recorded yet. Start using a tool to see data here.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(stats!.toolOpenCounts)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([toolId, { name, count }]) => (
                      <div key={toolId} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-300 font-medium">{name}</span>
                          <span className="text-zinc-500 tabular-nums">{count} {count === 1 ? 'open' : 'opens'}</span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(count / maxCount) * 100}%`,
                              background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>

            {/* Section 3 — What We Know */}
            <section className="hero-animate flex flex-col gap-6" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-white">What We Know</h2>
                <p className="text-zinc-600 text-sm">Interests inferred from your tool usage.</p>
              </div>

              {insightTags.length === 0 ? (
                <p className="text-zinc-600 text-sm">Use a few tools to start building your interest profile.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {insightTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm font-medium px-3 py-1.5 rounded-full border text-indigo-300"
                      style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Section 4 — Footer note */}
            <section
              className="hero-animate rounded-xl border p-6 text-sm text-zinc-500 leading-relaxed"
              style={{
                animationDelay: '0.26s',
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              This profile is built entirely from your tool usage — no forms, no questionnaires.
              As you use more tools, your AI gets smarter.
            </section>
          </>
        )}
      </main>
    </div>
  )
}
