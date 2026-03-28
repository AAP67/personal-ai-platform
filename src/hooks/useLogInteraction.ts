import { useCallback } from 'react'
import { addDoc, collection, doc, setDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

export type ActionType = 'tool_open' | 'tool_close' | 'session_start' | 'tool_signal'

// Stable session ID for the lifetime of the tab
const SESSION_ID = crypto.randomUUID()

export { SESSION_ID }

export interface InteractionPayload {
  userId: string
  userEmail: string | null
  toolId: string
  toolName: string
  actionType: ActionType
  sessionId: string
  duration?: number // seconds, only for tool_close
  signal?: string // signal event name, only for tool_signal
  signalData?: Record<string, unknown> // structured data from the tool
}

export async function writeInteraction(payload: InteractionPayload): Promise<void> {
  try {
    await addDoc(collection(db, 'interactions'), {
      ...payload,
      timestamp: serverTimestamp(),
    })

    // Increment platform-wide signal counter (best-effort, non-blocking)
    setDoc(doc(db, 'meta', 'platform_stats'), {
      totalSignals: increment(1),
      lastSignalAt: serverTimestamp(),
    }, { merge: true }).catch(() => {})
  } catch (err) {
    // Never crash the UI over a logging failure
    console.warn('[logInteraction] write failed', err)
  }
}

export function useLogInteraction(toolId: string, toolName: string) {
  const { user } = useAuth()

  const logInteraction = useCallback(
    (actionType: ActionType, durationOrSignal?: number | string, signalData?: Record<string, unknown>) => {
      if (!user) return
      writeInteraction({
        userId: user.uid,
        userEmail: user.email ?? null,
        toolId,
        toolName,
        actionType,
        sessionId: SESSION_ID,
        ...(typeof durationOrSignal === 'number' ? { duration: durationOrSignal } : {}),
        ...(typeof durationOrSignal === 'string' ? { signal: durationOrSignal } : {}),
        ...(signalData ? { signalData } : {}),
      })
    },
    [user, toolId, toolName],
  )

  return logInteraction
}
