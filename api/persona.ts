import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'nodejs20.x' };

const PERSONA_PROMPT = `You are a behavioral analyst. Given the following tool usage signals from a platform where users interact with AI-powered tools, infer a structured persona.

Each signal represents a meaningful action the user took — not just opening a tool, but the actual decisions they made inside it.

Analyze the signals and output a JSON object with exactly this structure:

{
  "summary": "2-3 sentence overview of who this person is, based purely on their behavior",
  "dimensions": [
    {
      "name": "dimension name",
      "value": "the inferred trait or preference",
      "confidence": "low | medium | high",
      "evidence": "1 sentence explaining which signals led to this inference"
    }
  ],
  "system_prompt": "A ready-to-paste system prompt (100-200 words) that any AI assistant could use to personalize its responses for this user. Written in second person: 'You are assisting someone who...'"
}

The dimensions should cover whichever of these are supported by the data (skip any that lack evidence):
- Risk tolerance (conservative to aggressive)
- Domain focus (what fields/industries they care about)
- Decision-making style (analytical, intuitive, framework-driven)
- Learning approach (self-directed, structured, exploratory)
- Strategic orientation (growth vs. efficiency, speed vs. thoroughness)
- Career trajectory (what roles/skills they're building toward)
- Technical depth (surface-level user vs. deep builder)

Rules:
- Only infer what the data supports. Don't hallucinate traits.
- Confidence should reflect signal strength: 1-2 signals on a dimension = low, 3-4 = medium, 5+ = high.
- The system_prompt should be practical and specific, not generic.
- Return ONLY the JSON object. No markdown, no code fences, no commentary.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { signals } = req.body;

    if (!signals || !Array.isArray(signals) || signals.length === 0) {
      return res.status(400).json({ error: 'No signals provided' });
    }

    // Format signals for the prompt
    const signalText = signals.map((s, i) => {
      const toolId = s.toolId || 'unknown';
      const signal = s.signal || 'unknown';
      const data = s.signalData ? JSON.stringify(s.signalData) : '{}';
      return `Signal ${i + 1} [${toolId}] ${signal}: ${data}`;
    }).join('\n');

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${PERSONA_PROMPT}\n\nHere are the user's signals:\n\n${signalText}`
        }
      ]
    });

    const responseText = message.content[0].text.trim();

    // Parse the JSON response
    let persona;
    try {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      persona = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse persona response', raw: responseText });
    }

    return res.status(200).json({ persona });

  } catch (err) {
    console.error('Persona generation error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
