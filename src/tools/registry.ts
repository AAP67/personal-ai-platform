export interface ToolConfig {
  id: string
  name: string
  description: string
  icon: string        // emoji or icon name — swap for a component library later
  route: string       // relative path under /tools/
  enabled: boolean
  url?: string        // if set, the tool renders as a full-height iframe
}

/**
 * Central tool registry.
 * To add a new tool:
 *  1. Create src/tools/<tool-id>/index.tsx
 *  2. Add an entry here
 *  3. Register the lazy import in src/pages/ToolPage.tsx
 */
export const toolRegistry: ToolConfig[] = [
  {
    id: 'robo-advisor',
    name: 'Robo Advisor',
    description: 'AI-powered investment guidance tailored to your financial goals.',
    icon: '📈',
    route: 'robo-advisor',
    enabled: true,
    url: 'https://robo-advisor-ai-umber.vercel.app/',
  },
  {
    id: 'equity-research',
    name: 'Markets Tool',
    description: 'AI-powered equity research with real-time analysis, financials, and Claude-driven insights.',
    icon: '🌐',
    route: 'equity-research',
    enabled: true,
    url: 'https://equity-research-ai-francium77.streamlit.app/',
  },
  {
    id: 'arkanex',
    name: 'Career Tool',
    description: 'AI-powered interview question generator for strategic roles. Practice with tailored questions for your target position.',
    icon: '💼',
    route: 'arkanex',
    enabled: true,
    url: 'https://arkanex-ai-interviewer.streamlit.app/',
  },
]

export function getToolById(id: string): ToolConfig | undefined {
  return toolRegistry.find((t) => t.id === id)
}

export function enabledTools(): ToolConfig[] {
  return toolRegistry.filter((t) => t.enabled)
}
