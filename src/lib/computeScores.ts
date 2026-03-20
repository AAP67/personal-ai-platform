/**
 * src/lib/computeScores.ts
 *
 * Deterministic persona scoring from behavioral signals.
 * Shared between api/persona.ts (server) and Profile.tsx (client display).
 *
 * Two signal tiers:
 *   BASIC  (works now): tool_open / tool_close + duration
 *   RICH   (future):    francium_signal with granular in-tool actions
 */

// ── Types ───────────────────────────────────────────────────────

export interface Signal {
  toolId: string
  toolName: string
  actionType: 'tool_open' | 'tool_close' | 'session_start' | 'tool_signal'
  signal?: string
  signalData?: Record<string, unknown>
  duration?: number
  timestamp: { seconds: number } | null
}

export interface DimensionScore {
  name: string
  score: number
  confidence: 'low' | 'medium' | 'high'
  signalCount: number
  evidence: string
}

export interface PersonaScores {
  dimensions: DimensionScore[]
  totalSignals: number
  computedAt: string
}

// ── Config ──────────────────────────────────────────────────────

const RECENCY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const RECENCY_BOOST = 2.0

const RISK_TOOLS = ['robo-advisor', 'equity-research', 'deal-sourcing']
const STRATEGY_TOOLS = ['ai-chief-of-staff', 'ai-consultant']
const CAREER_TOOLS = ['arkanex', 'finance-tutor']
const BUILDER_TOOLS = ['robo-advisor', 'equity-research']

const RISK_SIGNAL_SCORES: Record<string, number> = {
  'risk_slider_set_conservative': 20,
  'risk_slider_set_moderate': 50,
  'risk_slider_set_aggressive': 85,
  'allocation_accepted': 60,
  'allocation_customized': 75,
  'ticker_searched_large_cap': 30,
  'ticker_searched_mid_cap': 50,
  'ticker_searched_small_cap': 70,
  'ticker_searched_crypto': 90,
  'sector_filter_defensive': 25,
  'sector_filter_growth': 75,
  'stage_filter_seed': 80,
  'stage_filter_series_a': 65,
  'stage_filter_series_b_plus': 40,
  'stage_filter_late': 20,
}

// ── Helpers ─────────────────────────────────────────────────────

function recencyWeight(signal: Signal): number {
  if (!signal.timestamp) return 1.0
  const age = Date.now() - signal.timestamp.seconds * 1000
  return age < RECENCY_WINDOW_MS ? RECENCY_BOOST : 1.0
}

function conf(count: number): 'low' | 'medium' | 'high' {
  if (count >= 8) return 'high'
  if (count >= 4) return 'medium'
  return 'low'
}

function clamp(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)))
}

function byTools(signals: Signal[], toolIds: string[]): Signal[] {
  return signals.filter(s => toolIds.includes(s.toolId))
}

function byAction(signals: Signal[], actionType: string): Signal[] {
  return signals.filter(s => s.actionType === actionType)
}

// ── Scorers ─────────────────────────────────────────────────────

function scoreRiskTolerance(signals: Signal[]): DimensionScore {
  const relevant = byTools(signals, RISK_TOOLS)
  const rich = relevant.filter(s => s.signal && s.signal in RISK_SIGNAL_SCORES)

  let score: number
  let evidence: string

  if (rich.length > 0) {
    const wSum = rich.reduce((sum, s) => sum + (RISK_SIGNAL_SCORES[s.signal!] ?? 50) * recencyWeight(s), 0)
    const wCount = rich.reduce((sum, s) => sum + recencyWeight(s), 0)
    score = clamp(wSum / wCount)
    evidence = `${rich.length} risk actions across ${new Set(rich.map(s => s.toolId)).size} tools`
  } else {
    const closes = byAction(relevant, 'tool_close')
    if (closes.length === 0) return { name: 'Risk tolerance', score: 50, confidence: 'low', signalCount: 0, evidence: 'No risk-related usage yet' }
    const wDur = closes.reduce((sum, s) => {
      const mul = s.toolId === 'deal-sourcing' ? 1.3 : s.toolId === 'equity-research' ? 1.1 : 0.8
      return sum + (s.duration ?? 0) * mul * recencyWeight(s)
    }, 0)
    score = clamp(20 + (wDur / 600) * 60)
    evidence = `${closes.length} sessions, ${closes.reduce((s, c) => s + (c.duration ?? 0), 0)}s in finance tools`
  }

  return { name: 'Risk tolerance', score, confidence: conf(relevant.length), signalCount: relevant.length, evidence }
}

function scoreDomainFocus(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  const unique = new Set(opens.map(s => s.toolId))
  const cats = new Set<string>()
  if ([...unique].some(t => RISK_TOOLS.includes(t))) cats.add('finance')
  if ([...unique].some(t => STRATEGY_TOOLS.includes(t))) cats.add('strategy')
  if ([...unique].some(t => CAREER_TOOLS.includes(t))) cats.add('career')

  const score = clamp(Math.min(unique.size / 7, 1) * 60 + (cats.size / 3) * 40)
  return { name: 'Domain focus', score, confidence: conf(opens.length), signalCount: opens.length, evidence: `${unique.size} tools across ${cats.size} categories` }
}

function scoreDecisionStyle(signals: Signal[]): DimensionScore {
  const closes = byAction(signals, 'tool_close')
  if (closes.length === 0) return { name: 'Decision style', score: 50, confidence: 'low', signalCount: 0, evidence: 'No session data yet' }

  const avgDur = closes.reduce((s, c) => s + (c.duration ?? 0), 0) / closes.length
  const fwRatio = byTools(closes, STRATEGY_TOOLS).length / closes.length
  const score = clamp(Math.min(avgDur / 300, 1) * 50 + fwRatio * 50)
  return { name: 'Decision style', score, confidence: conf(closes.length), signalCount: closes.length, evidence: `Avg ${Math.round(avgDur)}s sessions, ${Math.round(fwRatio * 100)}% framework tools` }
}

function scoreLearningApproach(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  if (opens.length === 0) return { name: 'Learning approach', score: 50, confidence: 'low', signalCount: 0, evidence: 'No usage data yet' }

  const unique = new Set(opens.map(s => s.toolId)).size
  const tutorRatio = opens.filter(s => CAREER_TOOLS.includes(s.toolId)).length / opens.length
  const score = clamp((unique / Math.max(opens.length, 1)) * 70 + (1 - tutorRatio) * 30)
  return { name: 'Learning approach', score, confidence: conf(opens.length), signalCount: opens.length, evidence: `${unique} tools across ${opens.length} sessions` }
}

function scoreStrategicOrientation(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  const closes = byAction(signals, 'tool_close')
  const growthN = byTools(opens, ['deal-sourcing', 'equity-research']).length
  const effN = byTools(opens, STRATEGY_TOOLS).length
  const total = growthN + effN
  if (total === 0) return { name: 'Strategic orientation', score: 50, confidence: 'low', signalCount: 0, evidence: 'No strategy usage yet' }

  const stratCloses = byTools(closes, STRATEGY_TOOLS)
  const avgSD = stratCloses.length > 0 ? stratCloses.reduce((s, c) => s + (c.duration ?? 0), 0) / stratCloses.length : 0
  const score = clamp((growthN / total) * 80 + 20 - Math.min(avgSD / 600, 1) * 20)
  return { name: 'Strategic orientation', score, confidence: conf(total), signalCount: total, evidence: `${growthN} growth vs ${effN} efficiency sessions` }
}

function scoreTechnicalDepth(signals: Signal[]): DimensionScore {
  const closes = byAction(signals, 'tool_close')
  if (closes.length === 0) return { name: 'Technical depth', score: 50, confidence: 'low', signalCount: 0, evidence: 'No session data yet' }

  const bc = byTools(closes, BUILDER_TOOLS)
  const avgBD = bc.length > 0 ? bc.reduce((s, c) => s + (c.duration ?? 0), 0) / bc.length : 0
  const custom = signals.filter(s => s.signal && ['allocation_customized', 'parameter_overridden', 'advanced_mode_enabled'].includes(s.signal))
  const score = clamp(Math.min(avgBD / 480, 1) * 40 + (bc.length / closes.length) * 40 + Math.min(custom.length * 5, 20))
  return { name: 'Technical depth', score, confidence: conf(closes.length), signalCount: closes.length + custom.length, evidence: `${bc.length} complex sessions, avg ${Math.round(avgBD)}s` }
}

// ── Entry Point ─────────────────────────────────────────────────

export function computePersonaScores(signals: Signal[]): PersonaScores {
  return {
    dimensions: [
      scoreRiskTolerance(signals),
      scoreDomainFocus(signals),
      scoreDecisionStyle(signals),
      scoreLearningApproach(signals),
      scoreStrategicOrientation(signals),
      scoreTechnicalDepth(signals),
    ],
    totalSignals: signals.length,
    computedAt: new Date().toISOString(),
  }
}