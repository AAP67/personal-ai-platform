# Francium

**Your tools define your AI.**

A platform where your tool usage — not forms or questionnaires — builds a model of who you are. 7 live AI tools across finance, strategy, and career. Every interaction is a signal.

## Live Demo
https://personal-ai-platform-one.vercel.app/

## Tools

### Finance & Investment
- **Robo Advisor** — Multi-agent LLM system (LangGraph + Claude) with Black-Litterman portfolio optimization
- **Equity Research** — AI-powered equity research with real-time analysis and Claude-driven insights
- **VC Deal Sourcing** — Automated deal pipeline — filters by industry, stage, and KPIs using AI-powered web research

### Strategy & Operations
- **AI Chief of Staff** — Strategic analysis tool for founders — frameworks, prioritization, and decision support
- **AI Consultant** — RAG-powered strategy and operations advisor with document-grounded insights

### Career & Learning
- **AI Interviewer** — AI-powered interview question generator for strategic roles
- **Finance Tutor** — Self-correcting tutor that routes by complexity, shows cost upfront, and learns from its mistakes

## How It Works
1. Choose from a suite of AI-powered tools
2. Use them naturally — search, explore, decide
3. The platform learns your interests, patterns, and thinking style from your interactions

## Thesis
Every personal AI product starts by asking users to describe themselves. But stated preferences are unreliable. Identity is not a form — it's a pattern. The personal AI doesn't get trained — it gets revealed through usage. Revealed preferences > stated preferences.

## Tech Stack
- React + TypeScript + Vite + Tailwind CSS
- Python + Claude API + LangGraph
- Firebase Auth + Cloud Firestore
- Supabase (persistent memory)
- Streamlit + Vercel (tool deployments)
- Modular tool registry (plugin architecture — adding a tool = one folder + one config entry)

## Architecture
Every tool interaction is logged to Firestore. The profile page reads this data to infer user interests — no onboarding forms, no questionnaires. The platform learns you from how you work.

## Built By
**Karan Rajpal** — [LinkedIn](https://www.linkedin.com/in/krajpal/) · [GitHub](https://github.com/AAP67)
