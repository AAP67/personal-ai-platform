import { useCallback } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

export type ActionType = 'tool_open' | 'tool_close' | 'session_start'

// Stable session ID for the lifetime of the tab
const SESSION_ID = crypto.randomUUID()

export interface InteractionPayload {
  userId: string
  userEmail: string | null
  toolId: string
  toolName: string
  actionType: ActionType
  sessionId: string
  duration?: number // seconds, only for tool_close
}

export async function writeInteraction(payload: InteractionPayload): Promise<void> {
  try {
    await addDoc(collection(db, 'interactions'), {
      ...payload,
      timestamp: serverTimestamp(),
    })
  } catch (err) {
    // Never crash the UI over a logging failure
    console.warn('[logInteraction] write failed', err)
  }
}

export function useLogInteraction(toolId: string, toolName: string) {
  const { user } = useAuth()

  // Keep a ref so the effect cleanup always sees the latest version
  // without adding it to useEffect dependency arrays
  const logInteraction = useCallback(
    (actionType: ActionType, duration?: number) => {
      if (!user) return
      writeInteraction({
        userId: user.uid,
        userEmail: user.email ?? null,
        toolId,
        toolName,
        actionType,
        sessionId: SESSION_ID,
        ...(duration !== undefined ? { duration } : {}),
      })
    },
    [user, toolId, toolName],
  )

  return logInteraction
}
