import Anthropic from '@anthropic-ai/sdk'

export const config = { runtime: 'nodejs' }

// ── Scoring engine (inlined to avoid Vercel import issues) ──
//
// v2: Tool-dimension weights are data-driven. If you add a tool to
// src/tools/registry.ts, mirror its id + category + dimensions here
// or scoring will treat it as having no behavioral signal.

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
  scoringVersion: number
}

interface ToolMeta {
  category: string
  risk: number
  strategy: number
  growth: number
  learning: number
  technical: number
}

const RECENCY_MS = 7 * 24 * 60 * 60 * 1000
const SCORING_VERSION = 2

const CATEGORIES = [
  'Finance & Investment',
  'Strategy & Operations',
  'Career & Learning',
  'Developer Tools',
] as const

// Mirror of src/tools/registry.ts dimensions. Keep in sync.
const TOOL_MAP: Record<string, ToolMeta> = {
  'robo-advisor':      { category: 'Finance & Investment',  risk: 0.9, strategy: 0.4, growth: 0.4, learning: 0.2, technical: 0.4 },
  'equity-research':   { category: 'Finance & Investment',  risk: 0.8, strategy: 0.3, growth: 0.8, learning: 0.3, technical: 0.3 },
  'deal-sourcing':     { category: 'Finance & Investment',  risk: 0.9, strategy: 0.3, growth: 0.9, learning: 0.2, technical: 0.2 },
  'ai-chief-of-staff': { category: 'Strategy & Operations', risk: 0.1, strategy: 1.0, growth: 0.2, learning: 0.3, technical: 0.1 },
  'morning-brief':     { category: 'Strategy & Operations', risk: 0.1, strategy: 0.7, growth: 0.3, learning: 0.5, technical: 0.2 },
  'ai-consultant':     { category: 'Strategy & Operations', risk: 0.2, strategy: 0.9, growth: 0.2, learning: 0.4, technical: 0.2 },
  'trend-reader':      { category: 'Strategy & Operations', risk: 0.3, strategy: 0.5, growth: 0.4, learning: 0.3, technical: 0.7 },
  'arkanex':           { category: 'Career & Learning',     risk: 0.1, strategy: 0.4, growth: 0.2, learning: 0.8, technical: 0.1 },
  'finance-tutor':     { category: 'Career & Learning',     risk: 0.3, strategy: 0.3, growth: 0.2, learning: 1.0, technical: 0.2 },
  'codebase-chat':     { category: 'Developer Tools',       risk: 0.1, strategy: 0.2, growth: 0.2, learning: 0.4, technical: 1.0 },
}

type DimKey = 'risk' | 'strategy' | 'growth' | 'learning' | 'technical'
function dim(toolId: string, k: DimKey): number {
  return TOOL_MAP[toolId]?.[k] ?? 0
}

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
function byAction(s: Signal[], a: string): Signal[] { return s.filter(x => x.actionType === a) }

function scoreRisk(signals: Signal[]): DimensionScore {
  const rich = signals.filter(s => s.signal && s.signal in RISK_SCORES)
  if (rich.length > 0) {
    const wS = rich.reduce((sum, s) => sum + (RISK_SCORES[s.signal!] ?? 50) * rw(s), 0)
    const wC = rich.reduce((sum, s) => sum + rw(s), 0)
    return { name: 'Risk tolerance', score: clamp(wS / wC), confidence: conf(rich.length), signalCount: rich.length, evidence: `${rich.length} risk actions captured` }
  }
  const cl = byAction(signals, 'tool_close').filter(s => dim(s.toolId, 'risk') > 0.2)
  if (cl.length === 0) return { name: 'Risk tolerance', score: 50, confidence: 'low', signalCount: 0, evidence: 'No risk-related usage yet' }
  const wD = cl.reduce((sum, s) => sum + (s.duration ?? 0) * dim(s.toolId, 'risk') * rw(s), 0)
  return { name: 'Risk tolerance', score: clamp(20 + (wD / 600) * 60), confidence: conf(cl.length), signalCount: cl.length, evidence: `${cl.length} sessions in risk-sensitive tools` }
}

// Shannon entropy across category usage. 0 = specialist, 100 = generalist.
function scoreDomainBreadth(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  if (opens.length === 0) return { name: 'Domain breadth', score: 0, confidence: 'low', signalCount: 0, evidence: 'No usage yet' }

  const catCounts: Record<string, number> = {}
  for (const s of opens) {
    const cat = TOOL_MAP[s.toolId]?.category
    if (!cat) continue
    catCounts[cat] = (catCounts[cat] ?? 0) + 1
  }
  const total = Object.values(catCounts).reduce((a, b) => a + b, 0)
  const numCats = Object.keys(catCounts).length
  if (total === 0) return { name: 'Domain breadth', score: 0, confidence: 'low', signalCount: 0, evidence: 'No categorized tools used' }

  let entropy = 0
  for (const count of Object.values(catCounts)) {
    const p = count / total
    if (p > 0) entropy -= p * Math.log(p)
  }
  const maxEntropy = Math.log(CATEGORIES.length)
  return {
    name: 'Domain breadth',
    score: clamp((entropy / maxEntropy) * 100),
    confidence: conf(opens.length),
    signalCount: opens.length,
    evidence: `Usage distributed across ${numCats} of ${CATEGORIES.length} categories`,
  }
}

function scoreDecision(signals: Signal[]): DimensionScore {
  const cl = byAction(signals, 'tool_close')
  if (cl.length === 0) return { name: 'Decision style', score: 50, confidence: 'low', signalCount: 0, evidence: 'No session data yet' }
  const avg = cl.reduce((s, c) => s + (c.duration ?? 0), 0) / cl.length
  const fw = cl.reduce((sum, s) => sum + dim(s.toolId, 'strategy'), 0) / cl.length
  return { name: 'Decision style', score: clamp(Math.min(avg / 300, 1) * 50 + fw * 50), confidence: conf(cl.length), signalCount: cl.length, evidence: `Avg ${Math.round(avg)}s, ${Math.round(fw * 100)}% framework orientation` }
}

function scoreLearning(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  if (opens.length === 0) return { name: 'Learning approach', score: 50, confidence: 'low', signalCount: 0, evidence: 'No usage data yet' }
  const u = new Set(opens.map(s => s.toolId)).size
  const tr = opens.reduce((sum, s) => sum + dim(s.toolId, 'learning'), 0) / opens.length
  return { name: 'Learning approach', score: clamp((u / Math.max(opens.length, 1)) * 70 + (1 - tr) * 30), confidence: conf(opens.length), signalCount: opens.length, evidence: `${u} tools across ${opens.length} sessions` }
}

function scoreStrategy(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  if (opens.length === 0) return { name: 'Strategic orientation', score: 50, confidence: 'low', signalCount: 0, evidence: 'No strategy usage yet' }
  const gS = opens.reduce((sum, s) => sum + dim(s.toolId, 'growth'), 0)
  const eS = opens.reduce((sum, s) => sum + dim(s.toolId, 'strategy'), 0)
  const t = gS + eS
  if (t === 0) return { name: 'Strategic orientation', score: 50, confidence: 'low', signalCount: opens.length, evidence: 'No growth/efficiency signal yet' }
  const gR = gS / t
  return { name: 'Strategic orientation', score: clamp(gR * 100), confidence: conf(opens.length), signalCount: opens.length, evidence: `${Math.round(gR * 100)}% growth vs ${Math.round((1 - gR) * 100)}% efficiency` }
}

function scoreTech(signals: Signal[]): DimensionScore {
  const cl = byAction(signals, 'tool_close')
  if (cl.length === 0) return { name: 'Technical depth', score: 50, confidence: 'low', signalCount: 0, evidence: 'No session data yet' }
  const bc = cl.filter(s => dim(s.toolId, 'technical') > 0.3)
  const avgB = bc.length > 0 ? bc.reduce((s, c) => s + (c.duration ?? 0), 0) / bc.length : 0
  const tR = cl.reduce((sum, s) => sum + dim(s.toolId, 'technical'), 0) / cl.length
  const cust = signals.filter(s => s.signal && ['allocation_customized', 'parameter_overridden', 'advanced_mode_enabled'].includes(s.signal))
  return { name: 'Technical depth', score: clamp(Math.min(avgB / 480, 1) * 40 + tR * 40 + Math.min(cust.length * 5, 20)), confidence: conf(cl.length), signalCount: cl.length + cust.length, evidence: `${bc.length} deep-tool sessions, ${Math.round(tR * 100)}% technical-weighted` }
}

function computeScores(signals: Signal[]): PersonaScores {
  return {
    dimensions: [scoreRisk(signals), scoreDomainBreadth(signals), scoreDecision(signals), scoreLearning(signals), scoreStrategy(signals), scoreTech(signals)],
    totalSignals: signals.length,
    computedAt: new Date().toISOString(),
    scoringVersion: SCORING_VERSION,
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
- Note: "Domain breadth" is 0 for specialists, 100 for generalists (even distribution across categories).
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