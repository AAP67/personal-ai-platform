export type DimensionKey = 'risk' | 'strategy' | 'growth' | 'learning' | 'technical'

export interface ToolDimensions {
  risk: number       // 0-1: how strongly usage signals risk tolerance
  strategy: number   // 0-1: how strongly usage signals framework/analytical thinking
  growth: number     // 0-1: how strongly usage signals growth orientation
  learning: number   // 0-1: how strongly this is a guided/tutored tool
  technical: number  // 0-1: how strongly usage signals hands-on builder depth
}

export interface ToolConfig {
  id: string
  name: string
  description: string
  icon: string
  route: string
  enabled: boolean
  url?: string
  category: 'Finance & Investment' | 'Strategy & Operations' | 'Career & Learning' | 'Developer Tools'
  dimensions: ToolDimensions
}

export const toolRegistry: ToolConfig[] = [
  // ── Finance & Investment ──────────────────────────────────────
  {
    id: 'robo-advisor',
    name: 'Robo Advisor',
    description: 'Multi-agent LLM system (LangGraph + Claude) with Black-Litterman portfolio optimization.',
    icon: '📈',
    route: 'robo-advisor',
    enabled: true,
    url: 'https://robo-advisor-ai-umber.vercel.app/',
    category: 'Finance & Investment',
    dimensions: { risk: 0.9, strategy: 0.4, growth: 0.4, learning: 0.2, technical: 0.4 },
  },
  {
    id: 'equity-research',
    name: 'Equity Research',
    description: 'AI-powered equity research with real-time analysis, financials, and Claude-driven insights.',
    icon: '🌐',
    route: 'equity-research',
    enabled: true,
    url: 'https://equity-research-ai-francium77.streamlit.app/?embed=true',
    category: 'Finance & Investment',
    dimensions: { risk: 0.8, strategy: 0.3, growth: 0.8, learning: 0.3, technical: 0.3 },
  },
  {
    id: 'deal-sourcing',
    name: 'VC Deal Sourcing',
    description: 'Automated deal pipeline — filters by industry, stage, and KPIs using AI-powered web research.',
    icon: '🔍',
    route: 'deal-sourcing',
    enabled: true,
    url: 'https://deal-sourcing-francium77.streamlit.app/?embed=true',
    category: 'Finance & Investment',
    dimensions: { risk: 0.9, strategy: 0.3, growth: 0.9, learning: 0.2, technical: 0.2 },
  },

  // ── Strategy & Operations ─────────────────────────────────────
  {
    id: 'ai-chief-of-staff',
    name: 'AI Chief of Staff',
    description: 'Strategic analysis tool for founders — frameworks, prioritization, and decision support.',
    icon: '🎯',
    route: 'ai-chief-of-staff',
    enabled: true,
    url: 'https://arkanecos.streamlit.app/?embed=true',
    category: 'Strategy & Operations',
    dimensions: { risk: 0.1, strategy: 1.0, growth: 0.2, learning: 0.3, technical: 0.1 },
  },
  {
    id: 'morning-brief',
    name: 'Morning Brief',
    description: 'Multi-model AI morning brief — Groq extracts, Gemini scores, Claude synthesizes.',
    icon: '☀️',
    route: 'morning-brief',
    enabled: true,
    url: 'https://morning-brief-sandy.vercel.app/',
    category: 'Strategy & Operations',
    dimensions: { risk: 0.1, strategy: 0.7, growth: 0.3, learning: 0.5, technical: 0.2 },
  },
  {
    id: 'ai-consultant',
    name: 'AI Consultant',
    description: 'RAG-powered strategy and operations advisor with document-grounded insights.',
    icon: '🧠',
    route: 'ai-consultant',
    enabled: true,
    url: 'https://arkanexconsultant.streamlit.app/?embed=true',
    category: 'Strategy & Operations',
    dimensions: { risk: 0.2, strategy: 0.9, growth: 0.2, learning: 0.4, technical: 0.2 },
  },
  {
    id: 'trend-reader',
    name: 'TrendReader',
    description: 'Upload Excel/CSV, state your objective, get AI-driven trends, anomalies, charts, and web-enriched market context.',
    icon: '📊',
    route: 'trend-reader',
    enabled: true,
    url: 'https://trend-reader.vercel.app/',
    category: 'Strategy & Operations',
    dimensions: { risk: 0.3, strategy: 0.5, growth: 0.4, learning: 0.3, technical: 0.7 },
  },

  // ── Career & Learning ─────────────────────────────────────────
  {
    id: 'arkanex',
    name: 'AI Interviewer',
    description: 'AI-powered interview question generator for strategic roles. Tailored practice for your target position.',
    icon: '💼',
    route: 'arkanex',
    enabled: true,
    url: 'https://arkanex-ai-interviewer.streamlit.app/?embed=true',
    category: 'Career & Learning',
    dimensions: { risk: 0.1, strategy: 0.4, growth: 0.2, learning: 0.8, technical: 0.1 },
  },
  {
    id: 'finance-tutor',
    name: 'Finance Tutor',
    description: 'Self-correcting tutor that routes by complexity, shows cost upfront, and learns from its mistakes.',
    icon: '📚',
    route: 'finance-tutor',
    enabled: true,
    url: 'https://finance-tutor-five.vercel.app/',
    category: 'Career & Learning',
    dimensions: { risk: 0.3, strategy: 0.3, growth: 0.2, learning: 1.0, technical: 0.2 },
  },

  // ── Developer Tools ───────────────────────────────────────────
  {
    id: 'codebase-chat',
    name: 'Codebase Chat',
    description: 'Chat with any GitHub repo using AI — OAuth login, codebase ingestion, and Claude-powered analysis.',
    icon: '⌘',
    route: 'codebase-chat',
    enabled: true,
    url: 'https://codebase-chat-sigma.vercel.app/',
    category: 'Developer Tools',
    dimensions: { risk: 0.1, strategy: 0.2, growth: 0.2, learning: 0.4, technical: 1.0 },
  },
]

export function getToolById(id: string): ToolConfig | undefined {
  return toolRegistry.find((t) => t.id === id)
}

export function enabledTools(): ToolConfig[] {
  return toolRegistry.filter((t) => t.enabled)
}

export function toolsByCategory(): Record<string, ToolConfig[]> {
  const categories: Record<string, ToolConfig[]> = {}
  for (const tool of enabledTools()) {
    if (!categories[tool.category]) {
      categories[tool.category] = []
    }
    categories[tool.category].push(tool)
  }
  return categories
}

// Look up a dimension weight for a given tool. Returns 0 if tool unknown.
export function getToolDimension(toolId: string, dim: DimensionKey): number {
  return getToolById(toolId)?.dimensions[dim] ?? 0
}

export const categoryOrder: string[] = [
  'Finance & Investment',
  'Strategy & Operations',
  'Career & Learning',
  'Developer Tools',
]

export const categoryMeta: Record<string, { emoji: string; tagline: string; accent: string; accentBorder: string; accentBg: string }> = {
  'Finance & Investment': {
    emoji: '💰',
    tagline: 'Portfolio optimization, equity research, and deal flow',
    accent: '#f59e0b',
    accentBorder: 'rgba(245,158,11,0.2)',
    accentBg: 'rgba(245,158,11,0.05)',
  },
  'Strategy & Operations': {
    emoji: '⚙️',
    tagline: 'Decision frameworks and strategic analysis',
    accent: '#6366f1',
    accentBorder: 'rgba(99,102,241,0.2)',
    accentBg: 'rgba(99,102,241,0.05)',
  },
  'Career & Learning': {
    emoji: '🚀',
    tagline: 'Interview prep and AI-powered tutoring',
    accent: '#10b981',
    accentBorder: 'rgba(16,185,129,0.2)',
    accentBg: 'rgba(16,185,129,0.05)',
  },
  'Developer Tools': {
    emoji: '🛠️',
    tagline: 'AI-powered tools for developers and builders',
    accent: '#06b6d4',
    accentBorder: 'rgba(6,182,212,0.2)',
    accentBg: 'rgba(6,182,212,0.05)',
  },
}