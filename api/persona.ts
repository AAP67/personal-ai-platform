import Anthropic from '@anthropic-ai/sdk'

export const config = { runtime: 'nodejs' }

// ── Scoring engine (inlined to avoid Vercel import issues) ──

interface Signal {
  toolId: string
  toolName: string
  actionType: string
  signal?: string
  signalData?: Record<string, unknown>
  duration?: number
  timestamp: { seconds: number } | null
}

interface DimensionScore {
  name: string
  score: number
  confidence: 'low' | 'medium' | 'high'
  signalCount: number
  evidence: string
}

interface PersonaScores {
  dimensions: DimensionScore[]
  totalSignals: number
  computedAt: string
}

const RECENCY_MS = 7 * 24 * 60 * 60 * 1000
const RISK_TOOLS = ['robo-advisor', 'equity-research', 'deal-sourcing']
const STRATEGY_TOOLS = ['ai-chief-of-staff', 'ai-consultant']
const CAREER_TOOLS = ['arkanex', 'finance-tutor']
const BUILDER_TOOLS = ['robo-advisor', 'equity-research']

const RISK_SCORES: Record<string, number> = {
  'risk_slider_set_conservative': 20, 'risk_slider_set_moderate': 50, 'risk_slider_set_aggressive': 85,
  'allocation_accepted': 60, 'allocation_customized': 75,
  'ticker_searched_large_cap': 30, 'ticker_searched_mid_cap': 50, 'ticker_searched_small_cap': 70, 'ticker_searched_crypto': 90,
  'sector_filter_defensive': 25, 'sector_filter_growth': 75,
  'stage_filter_seed': 80, 'stage_filter_series_a': 65, 'stage_filter_series_b_plus': 40, 'stage_filter_late': 20,
}

function rw(s: Signal): number { return s.timestamp && (Date.now() - s.timestamp.seconds * 1000) < RECENCY_MS ? 2.0 : 1.0 }
function conf(n: number): 'low' | 'medium' | 'high' { return n >= 8 ? 'high' : n >= 4 ? 'medium' : 'low' }
function clamp(n: number): number { return Math.round(Math.max(0, Math.min(100, n))) }
function byTools(s: Signal[], ids: string[]): Signal[] { return s.filter(x => ids.includes(x.toolId)) }
function byAction(s: Signal[], a: string): Signal[] { return s.filter(x => x.actionType === a) }

function scoreRisk(signals: Signal[]): DimensionScore {
  const rel = byTools(signals, RISK_TOOLS)
  const rich = rel.filter(s => s.signal && s.signal in RISK_SCORES)
  if (rich.length > 0) {
    const wS = rich.reduce((sum, s) => sum + (RISK_SCORES[s.signal!] ?? 50) * rw(s), 0)
    const wC = rich.reduce((sum, s) => sum + rw(s), 0)
    return { name: 'Risk tolerance', score: clamp(wS / wC), confidence: conf(rel.length), signalCount: rel.length, evidence: `${rich.length} risk actions` }
  }
  const cl = byAction(rel, 'tool_close')
  if (cl.length === 0) return { name: 'Risk tolerance', score: 50, confidence: 'low', signalCount: 0, evidence: 'No risk-related usage yet' }
  const wD = cl.reduce((sum, s) => sum + (s.duration ?? 0) * (s.toolId === 'deal-sourcing' ? 1.3 : s.toolId === 'equity-research' ? 1.1 : 0.8) * rw(s), 0)
  return { name: 'Risk tolerance', score: clamp(20 + (wD / 600) * 60), confidence: conf(rel.length), signalCount: rel.length, evidence: `${cl.length} finance sessions` }
}

function scoreDomain(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  const u = new Set(opens.map(s => s.toolId))
  const cats = new Set<string>()
  if ([...u].some(t => RISK_TOOLS.includes(t))) cats.add('f')
  if ([...u].some(t => STRATEGY_TOOLS.includes(t))) cats.add('s')
  if ([...u].some(t => CAREER_TOOLS.includes(t))) cats.add('c')
  return { name: 'Domain focus', score: clamp(Math.min(u.size / 7, 1) * 60 + (cats.size / 3) * 40), confidence: conf(opens.length), signalCount: opens.length, evidence: `${u.size} tools across ${cats.size} categories` }
}

function scoreDecision(signals: Signal[]): DimensionScore {
  const cl = byAction(signals, 'tool_close')
  if (cl.length === 0) return { name: 'Decision style', score: 50, confidence: 'low', signalCount: 0, evidence: 'No session data yet' }
  const avg = cl.reduce((s, c) => s + (c.duration ?? 0), 0) / cl.length
  const fw = byTools(cl, STRATEGY_TOOLS).length / cl.length
  return { name: 'Decision style', score: clamp(Math.min(avg / 300, 1) * 50 + fw * 50), confidence: conf(cl.length), signalCount: cl.length, evidence: `Avg ${Math.round(avg)}s, ${Math.round(fw * 100)}% framework tools` }
}

function scoreLearning(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  if (opens.length === 0) return { name: 'Learning approach', score: 50, confidence: 'low', signalCount: 0, evidence: 'No usage data yet' }
  const u = new Set(opens.map(s => s.toolId)).size
  const tr = opens.filter(s => CAREER_TOOLS.includes(s.toolId)).length / opens.length
  return { name: 'Learning approach', score: clamp((u / Math.max(opens.length, 1)) * 70 + (1 - tr) * 30), confidence: conf(opens.length), signalCount: opens.length, evidence: `${u} tools across ${opens.length} sessions` }
}

function scoreStrategy(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  const cl = byAction(signals, 'tool_close')
  const gN = byTools(opens, ['deal-sourcing', 'equity-research']).length
  const eN = byTools(opens, STRATEGY_TOOLS).length
  const t = gN + eN
  if (t === 0) return { name: 'Strategic orientation', score: 50, confidence: 'low', signalCount: 0, evidence: 'No strategy usage yet' }
  const sc = byTools(cl, STRATEGY_TOOLS)
  const avgS = sc.length > 0 ? sc.reduce((s, c) => s + (c.duration ?? 0), 0) / sc.length : 0
  return { name: 'Strategic orientation', score: clamp((gN / t) * 80 + 20 - Math.min(avgS / 600, 1) * 20), confidence: conf(t), signalCount: t, evidence: `${gN} growth vs ${eN} efficiency sessions` }
}

function scoreTech(signals: Signal[]): DimensionScore {
  const cl = byAction(signals, 'tool_close')
  if (cl.length === 0) return { name: 'Technical depth', score: 50, confidence: 'low', signalCount: 0, evidence: 'No session data yet' }
  const bc = byTools(cl, BUILDER_TOOLS)
  const avgB = bc.length > 0 ? bc.reduce((s, c) => s + (c.duration ?? 0), 0) / bc.length : 0
  const cust = signals.filter(s => s.signal && ['allocation_customized', 'parameter_overridden', 'advanced_mode_enabled'].includes(s.signal))
  return { name: 'Technical depth', score: clamp(Math.min(avgB / 480, 1) * 40 + (bc.length / cl.length) * 40 + Math.min(cust.length * 5, 20)), confidence: conf(cl.length), signalCount: cl.length + cust.length, evidence: `${bc.length} complex sessions, avg ${Math.round(avgB)}s` }
}

function computeScores(signals: Signal[]): PersonaScores {
  return {
    dimensions: [scoreRisk(signals), scoreDomain(signals), scoreDecision(signals), scoreLearning(signals), scoreStrategy(signals), scoreTech(signals)],
    totalSignals: signals.length,
    computedAt: new Date().toISOString(),
  }
}

// ── Claude prompt ───────────────────────────────────────────

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

// ── Handler ─────────────────────────────────────────────────

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

    const scores = computeScores(signals as Signal[])

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

    return res.status(200).json({ persona, scores })

  } catch (err: any) {
    console.error('Persona error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}