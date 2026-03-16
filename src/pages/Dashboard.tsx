import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ToolConfig, toolsByCategory, categoryOrder, categoryMeta } from '../tools/registry'
import { useAuth } from '../contexts/AuthContext'
import { useLogInteraction } from '../hooks/useLogInteraction'

function ToolCard({ tool }: { tool: ToolConfig }) {
  return (
    <Link
      to={`/tools/${tool.route}`}
      className="group relative bg-zinc-900/60 border border-zinc-800/80 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-950/30 hover:-translate-y-0.5"
    >
      <span className="text-3xl">{tool.icon}</span>
      <div>
        <h3 className="text-white font-semibold text-base group-hover:text-indigo-400 transition-colors">
          {tool.name}
        </h3>
        <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">{tool.description}</p>
      </div>
      <span className="text-xs text-zinc-600 mt-auto group-hover:text-indigo-400 transition-colors flex items-center gap-1">
        Open
        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
      </span>
    </Link>
  )
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const grouped = toolsByCategory()
  const logInteraction = useLogInteraction('dashboard', 'Dashboard')

  useEffect(() => {
    logInteraction('session_start')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0a0f' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between border-b backdrop-blur-md" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,10,15,0.85)' }}>
        <Link to="/" className="text-base font-semibold tracking-tight hover:text-indigo-400 transition-colors">
          Personal AI
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-zinc-500">{user.email}</span>
              <Link to="/profile" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Profile
              </Link>
              <button onClick={handleSignOut} className="text-sm text-zinc-400 hover:text-white transition-colors">
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/auth" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-14">
        <header className="mb-12">
          <h1 className="text-3xl font-bold">Your Tools</h1>
          <p className="text-zinc-500 mt-2">7 AI tools across finance, strategy, and career.</p>
        </header>

        <div className="flex flex-col gap-14">
          {categoryOrder.map((cat) => {
            const tools = grouped[cat]
            if (!tools || tools.length === 0) return null
            const meta = categoryMeta[cat]
            return (
              <section key={cat}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{meta.emoji}</span>
                  <h2 className="text-lg font-semibold text-white">{cat}</h2>
                </div>
                <p className="text-zinc-600 text-sm mb-5">{meta.tagline}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}
