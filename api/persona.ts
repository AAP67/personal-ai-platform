import Anthropic from '@anthropic-ai/sdk'
import { computePersonaScores, type Signal } from '../src/lib/computeScores.js'
export const config = { runtime: 'nodejs' }

const PERSONA_PROMPT = `You are a behavioral analyst. You are given:
1. DETERMINISTIC SCORES (0-100) already computed from tool usage signals
2. The raw signals themselves for context

Write qualitative analysis AROUND the scores. Do NOT generate or change scores.

Output a JSON object:

{
  "summary": "2-3 sentence behavioral overview",
  "dimensions": [
    {
      "name": "dimension name (must match score name exactly)",
      "score": <EXACT SCORE PROVIDED — DO NOT CHANGE>,
      "value": "qualitative description of what this score means",
      "confidence": "<EXACT CONFIDENCE PROVIDED>",
      "evidence": "1 sentence linking signals to this score"
    }
  ],
  "drift_narrative": "If previous_scores provided, 2-3 sentences on what changed and why. Otherwise null.",
  "system_prompt": "100-200 word system prompt for any AI. Second person: 'You are assisting someone who...'"
}

Rules:
- NEVER change numeric scores or confidence — they are computed facts.
- Your job: make numbers human-readable and write the narrative.
- Return ONLY the JSON. No markdown, no fences.`

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const { signals, previous_scores } = req.body

    if (!signals || !Array.isArray(signals) || signals.length === 0) {
      return res.status(400).json({ error: 'No signals provided' })
    }

    // ── Step 1: Deterministic scores ────────────────────────
    const scores = computePersonaScores(signals as Signal[])

    // ── Step 2: Format for Claude ───────────────────────────
    const scoreText = scores.dimensions
      .map(d => `${d.name}: ${d.score}/100 (${d.confidence}, ${d.signalCount} signals) — ${d.evidence}`)
      .join('\n')

    const signalText = signals.slice(0, 50).map((s: any, i: number) => {
      const data = s.signalData ? JSON.stringify(s.signalData) : '{}'
      return `Signal ${i + 1} [${s.toolId}] ${s.signal || s.actionType}: ${data}`
    }).join('\n')

    const prevText = previous_scores
      ? '\n\nPREVIOUS SCORES (for drift narrative):\n' +
        previous_scores.map((d: any) => `${d.name}: ${d.score}/100`).join('\n')
      : ''

    // ── Step 3: Claude → narrative only ─────────────────────
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `${PERSONA_PROMPT}\n\nDETERMINISTIC SCORES:\n${scoreText}\n\nRAW SIGNALS:\n${signalText}${prevText}`
      }]
    })

    const raw = (message.content[0] as any).text.trim()

    let persona
    try {
      persona = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
    } catch {
      return res.status(500).json({ error: 'Failed to parse persona', raw })
    }

    // ── Step 4: Return both ─────────────────────────────────
    return res.status(200).json({
      persona,
      scores,  // ← drift chart reads this
    })

  } catch (err: any) {
    console.error('Persona error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}