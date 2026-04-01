import { useParams, Link, Navigate } from 'react-router-dom'
import { lazy, Suspense, ReactNode, LazyExoticComponent, useEffect, useRef } from 'react'
import { getToolById, ToolConfig } from '../tools/registry'
import { useLogInteraction } from '../hooks/useLogInteraction'

/**
 * Add a lazy import here whenever you add a new tool folder.
 * The key must match the tool's `route` field in the registry.
 */
const toolComponents: Record<string, LazyExoticComponent<() => ReactNode>> = {
  'robo-advisor': lazy(() => import('../tools/robo-advisor/index')),
  'equity-research': lazy(() => import('../tools/equity-research/index')),
  'arkanex': lazy(() => import('../tools/arkanex/index')),
  'deal-sourcing': lazy(() => import('../tools/deal-sourcing/index')),
  'ai-chief-of-staff': lazy(() => import('../tools/ai-chief-of-staff/index')),
  'ai-consultant': lazy(() => import('../tools/ai-consultant/index')),
  'morning-brief': lazy(() => import('../tools/morning-brief/index')),
  'finance-tutor': lazy(() => import('../tools/finance-tutor/index')),
}

function StandardShell({ children }: { children: ReactNode }) {
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

function IframeShell({ tool, children }: { tool: ToolConfig; children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <nav className="shrink-0 px-8 py-4 flex items-center gap-4 border-b border-zinc-800">
        <Link to="/dashboard" className="text-zinc-400 hover:text-white transition-colors text-sm">
          ← Dashboard
        </Link>
        <span className="text-zinc-600 text-sm">|</span>
        <span className="text-sm text-zinc-300">{tool.icon} {tool.name}</span>
      </nav>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}

export default function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>()
  const tool = toolId ? getToolById(toolId) : undefined

  // Hooks must be called unconditionally — guard inside the effect
  const logInteraction = useLogInteraction(tool?.route ?? '', tool?.name ?? '')
  const logRef = useRef(logInteraction)
  logRef.current = logInteraction

  useEffect(() => {
    if (!tool) return
    const startTime = Date.now()
    logRef.current('tool_open')
    return () => {
      const duration = Math.round((Date.now() - startTime) / 1000)
      logRef.current('tool_close', duration)
    }
  }, [tool?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for signals from iframe tools via postMessage
  useEffect(() => {
    if (!tool) return

    function handleMessage(event: MessageEvent) {
      const msg = event.data
      if (!msg || msg.type !== 'francium_signal') return
      // Only accept signals from the current tool
      if (msg.toolId !== tool?.id) return

      console.log('[Francium] signal received:', msg.event, msg.data)
      logRef.current('tool_signal', msg.event, msg.data)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [tool?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!tool || !tool.enabled) {
    return <Navigate to="/dashboard" replace />
  }

  const ToolComponent = toolComponents[tool.route]

  if (!ToolComponent) {
    return (
      <StandardShell>
        <p className="text-zinc-400">Tool component not found. Add it to ToolPage.tsx.</p>
      </StandardShell>
    )
  }

  const fallback = (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="text-zinc-500 animate-pulse">Loading…</span>
    </div>
  )

  if (tool.url) {
    return (
      <IframeShell tool={tool}>
        <Suspense fallback={fallback}>
          <ToolComponent />
        </Suspense>
      </IframeShell>
    )
  }

  return (
    <StandardShell>
      <Suspense fallback={fallback}>
        <ToolComponent />
      </Suspense>
    </StandardShell>
  )
}