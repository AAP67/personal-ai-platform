import { Link, useNavigate } from 'react-router-dom'
import { enabledTools, ToolConfig } from '../tools/registry'
import { useAuth } from '../contexts/AuthContext'

function ToolCard({ tool }: { tool: ToolConfig }) {
  return (
    <Link
      to={`/tools/${tool.route}`}
      className="group bg-zinc-900 border border-zinc-800 hover:border-indigo-500 rounded-2xl p-6 flex flex-col gap-4 transition-all hover:shadow-lg hover:shadow-indigo-950"
    >
      <span className="text-4xl">{tool.icon}</span>
      <div>
        <h2 className="text-white font-semibold text-lg group-hover:text-indigo-400 transition-colors">
          {tool.name}
        </h2>
        <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{tool.description}</p>
      </div>
      <span className="text-xs text-zinc-500 mt-auto group-hover:text-indigo-400 transition-colors">
        Open →
      </span>
    </Link>
  )
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const tools = enabledTools()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between border-b border-zinc-800">
        <Link to="/" className="text-lg font-semibold tracking-tight hover:text-indigo-400 transition-colors">
          Personal AI
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-zinc-500">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
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
        <header className="mb-10">
          <h1 className="text-3xl font-bold">Your Tools</h1>
          <p className="text-zinc-400 mt-2">Select a tool to get started.</p>
        </header>

        {tools.length === 0 ? (
          <p className="text-zinc-500">No tools enabled yet. Add one to the registry to get started.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
