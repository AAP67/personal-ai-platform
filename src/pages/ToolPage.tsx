import { useParams, Link, Navigate } from 'react-router-dom'
import { lazy, Suspense, ReactNode } from 'react'
import { getToolById } from '../tools/registry'

/**
 * Add a lazy import here whenever you add a new tool folder.
 * The key must match the tool's `route` field in the registry.
 */
const toolComponents: Record<string, React.LazyExoticComponent<() => ReactNode>> = {
  'robo-advisor': lazy(() => import('../tools/robo-advisor/index')),
}

function ToolShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="px-8 py-5 flex items-center gap-4 border-b border-zinc-800">
        <Link to="/dashboard" className="text-zinc-400 hover:text-white transition-colors text-sm">
          ← Dashboard
        </Link>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-14">{children}</main>
    </div>
  )
}

export default function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>()
  const tool = toolId ? getToolById(toolId) : undefined

  if (!tool || !tool.enabled) {
    return <Navigate to="/dashboard" replace />
  }

  const ToolComponent = toolComponents[tool.route]

  if (!ToolComponent) {
    return (
      <ToolShell>
        <p className="text-zinc-400">Tool component not found. Add it to ToolPage.tsx.</p>
      </ToolShell>
    )
  }

  return (
    <ToolShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <span className="text-zinc-500 animate-pulse">Loading...</span>
          </div>
        }
      >
        <ToolComponent />
      </Suspense>
    </ToolShell>
  )
}
