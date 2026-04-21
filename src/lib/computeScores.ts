/**
 * src/lib/computeScores.ts
 *
 * Deterministic persona scoring from behavioral signals.
 * Shared between api/persona.ts (server) and Profile.tsx (client display).
 *
 * v2: Tool-dimension weights are data-driven from registry.ts (no more
 * hardcoded tool lists). Domain Breadth uses Shannon entropy across
 * categories.
 *
 * Two signal tiers:
 *   BASIC  (works now): tool_open / tool_close + duration
 *   RICH   (future):    francium_signal with granular in-tool actions
 */

import {
  categoryOrder,
  getToolById,
  getToolDimension,
  toolRegistry,
} from '../tools/registry'

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
  scoringVersion: number
}

// ── Config ──────────────────────────────────────────────────────

const RECENCY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const RECENCY_BOOST = 2.0
const SCORING_VERSION = 2

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

function byAction(signals: Signal[], actionType: string): Signal[] {
  return signals.filter(s => s.actionType === actionType)
}

// ── Scorers ─────────────────────────────────────────────────────

function scoreRiskTolerance(signals: Signal[]): DimensionScore {
  const rich = signals.filter(s => s.signal && s.signal in RISK_SIGNAL_SCORES)

  // Path A: rich signals override everything (explicit, high-precision)
  if (rich.length > 0) {
    const wSum = rich.reduce((sum, s) => sum + (RISK_SIGNAL_SCORES[s.signal!] ?? 50) * recencyWeight(s), 0)
    const wCount = rich.reduce((sum, s) => sum + recencyWeight(s), 0)
    return {
      name: 'Risk tolerance',
      score: clamp(wSum / wCount),
      confidence: conf(rich.length),
      signalCount: rich.length,
      evidence: `${rich.length} risk actions captured`,
    }
  }

  // Path B: fall back to session duration weighted by each tool's risk dimension
  const closes = byAction(signals, 'tool_close')
  const riskCloses = closes.filter(s => getToolDimension(s.toolId, 'risk') > 0.2)
  if (riskCloses.length === 0) {
    return { name: 'Risk tolerance', score: 50, confidence: 'low', signalCount: 0, evidence: 'No risk-related usage yet' }
  }

  const wDur = riskCloses.reduce((sum, s) => {
    const w = getToolDimension(s.toolId, 'risk')
    return sum + (s.duration ?? 0) * w * recencyWeight(s)
  }, 0)
  const score = clamp(20 + (wDur / 600) * 60)
  const totalSec = riskCloses.reduce((s, c) => s + (c.duration ?? 0), 0)
  return {
    name: 'Risk tolerance',
    score,
    confidence: conf(riskCloses.length),
    signalCount: riskCloses.length,
    evidence: `${riskCloses.length} sessions, ${totalSec}s in risk-sensitive tools`,
  }
}

// Shannon entropy across category usage. 0 = pure specialist, 100 = pure generalist.
function scoreDomainBreadth(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  if (opens.length === 0) {
    return { name: 'Domain breadth', score: 0, confidence: 'low', signalCount: 0, evidence: 'No usage yet' }
  }

  const catCounts: Record<string, number> = {}
  for (const s of opens) {
    const tool = getToolById(s.toolId)
    if (!tool) continue
    catCounts[tool.category] = (catCounts[tool.category] ?? 0) + 1
  }

  const totalCounted = Object.values(catCounts).reduce((a, b) => a + b, 0)
  const numCats = Object.keys(catCounts).length
  if (totalCounted === 0) {
    return { name: 'Domain breadth', score: 0, confidence: 'low', signalCount: 0, evidence: 'No categorized tools used' }
  }

  // Shannon entropy
  let entropy = 0
  for (const count of Object.values(catCounts)) {
    const p = count / totalCounted
    if (p > 0) entropy -= p * Math.log(p)
  }

  // Normalize against max possible entropy = log(total categories)
  const maxEntropy = Math.log(categoryOrder.length)
  const score = clamp((entropy / maxEntropy) * 100)

  return {
    name: 'Domain breadth',
    score,
    confidence: conf(opens.length),
    signalCount: opens.length,
    evidence: `Usage distributed across ${numCats} of ${categoryOrder.length} categories`,
  }
}

function scoreDecisionStyle(signals: Signal[]): DimensionScore {
  const closes = byAction(signals, 'tool_close')
  if (closes.length === 0) {
    return { name: 'Decision style', score: 50, confidence: 'low', signalCount: 0, evidence: 'No session data yet' }
  }

  const avgDur = closes.reduce((s, c) => s + (c.duration ?? 0), 0) / closes.length
  // Framework ratio: weighted average of strategy dimension across sessions
  const fwRatio = closes.reduce((sum, s) => sum + getToolDimension(s.toolId, 'strategy'), 0) / closes.length

  const score = clamp(Math.min(avgDur / 300, 1) * 50 + fwRatio * 50)
  return {
    name: 'Decision style',
    score,
    confidence: conf(closes.length),
    signalCount: closes.length,
    evidence: `Avg ${Math.round(avgDur)}s sessions, ${Math.round(fwRatio * 100)}% framework orientation`,
  }
}

function scoreLearningApproach(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  if (opens.length === 0) {
    return { name: 'Learning approach', score: 50, confidence: 'low', signalCount: 0, evidence: 'No usage data yet' }
  }

  const unique = new Set(opens.map(s => s.toolId)).size
  // Tutor ratio: weighted average of learning dimension
  const tutorRatio = opens.reduce((sum, s) => sum + getToolDimension(s.toolId, 'learning'), 0) / opens.length

  // High score = exploratory (high tool diversity, low tutor reliance)
  const score = clamp((unique / Math.max(opens.length, 1)) * 70 + (1 - tutorRatio) * 30)
  return {
    name: 'Learning approach',
    score,
    confidence: conf(opens.length),
    signalCount: opens.length,
    evidence: `${unique} tools across ${opens.length} sessions`,
  }
}

function scoreStrategicOrientation(signals: Signal[]): DimensionScore {
  const opens = byAction(signals, 'tool_open')
  if (opens.length === 0) {
    return { name: 'Strategic orientation', score: 50, confidence: 'low', signalCount: 0, evidence: 'No strategy usage yet' }
  }

  // Growth vs efficiency (strategy) weighted sums
  const growthSum = opens.reduce((sum, s) => sum + getToolDimension(s.toolId, 'growth'), 0)
  const efficiencySum = opens.reduce((sum, s) => sum + getToolDimension(s.toolId, 'strategy'), 0)
  const total = growthSum + efficiencySum
  if (total === 0) {
    return { name: 'Strategic orientation', score: 50, confidence: 'low', signalCount: opens.length, evidence: 'No growth/efficiency signal yet' }
  }

  const growthRatio = growthSum / total
  // Growth heavy → 100, efficiency heavy → 0
  const score = clamp(growthRatio * 100)
  return {
    name: 'Strategic orientation',
    score,
    confidence: conf(opens.length),
    signalCount: opens.length,
    evidence: `${Math.round(growthRatio * 100)}% growth-weighted vs ${Math.round((1 - growthRatio) * 100)}% efficiency-weighted`,
  }
}

function scoreTechnicalDepth(signals: Signal[]): DimensionScore {
  const closes = byAction(signals, 'tool_close')
  if (closes.length === 0) {
    return { name: 'Technical depth', score: 50, confidence: 'low', signalCount: 0, evidence: 'No session data yet' }
  }

  // Sessions in builder-heavy tools (technical > 0.3)
  const builderCloses = closes.filter(s => getToolDimension(s.toolId, 'technical') > 0.3)
  const avgBuilderDur = builderCloses.length > 0
    ? builderCloses.reduce((s, c) => s + (c.duration ?? 0), 0) / builderCloses.length
    : 0

  // Overall weighted technical ratio
  const techRatio = closes.reduce((sum, s) => sum + getToolDimension(s.toolId, 'technical'), 0) / closes.length
  const custom = signals.filter(s => s.signal && ['allocation_customized', 'parameter_overridden', 'advanced_mode_enabled'].includes(s.signal))

  const score = clamp(
    Math.min(avgBuilderDur / 480, 1) * 40 +
    techRatio * 40 +
    Math.min(custom.length * 5, 20)
  )
  return {
    name: 'Technical depth',
    score,
    confidence: conf(closes.length),
    signalCount: closes.length + custom.length,
    evidence: `${builderCloses.length} deep-tool sessions, ${Math.round(techRatio * 100)}% technical-weighted`,
  }
}

// ── Entry Point ─────────────────────────────────────────────────

export function computePersonaScores(signals: Signal[]): PersonaScores {
  // Silence lint if toolRegistry is unused in future refactors
  void toolRegistry
  return {
    dimensions: [
      scoreRiskTolerance(signals),
      scoreDomainBreadth(signals),
      scoreDecisionStyle(signals),
      scoreLearningApproach(signals),
      scoreStrategicOrientation(signals),
      scoreTechnicalDepth(signals),
    ],
    totalSignals: signals.length,
    computedAt: new Date().toISOString(),
    scoringVersion: SCORING_VERSION,
  }
}