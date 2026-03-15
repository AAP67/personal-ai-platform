import { useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface InteractionLog {
  userId: string | null
  timestamp: string
  toolId: string
  actionType: string
  content: unknown
  sessionId: string
}

// Stable session ID for the lifetime of the tab
const SESSION_ID = crypto.randomUUID()

export function useLogInteraction(toolId: string) {
  const { user } = useAuth()
  // Ref so the callback identity stays stable across renders
  const toolIdRef = useRef(toolId)
  toolIdRef.current = toolId

  const logInteraction = useCallback(
    (actionType: string, content: unknown = null) => {
      const log: InteractionLog = {
        userId: user?.uid ?? null,
        timestamp: new Date().toISOString(),
        toolId: toolIdRef.current,
        actionType,
        content,
        sessionId: SESSION_ID,
      }
      // TODO: replace with Supabase insert
      console.log('[interaction]', log)
    },
    [user],
  )

  return logInteraction
}
