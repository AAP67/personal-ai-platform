# Personal AI Platform

**Your tools define your AI.**

A platform where your tool usage — not forms or questionnaires — builds a model of who you are.

## Live Demo
https://personal-ai-platform-one.vercel.app/

## How It Works
1. Choose from a suite of AI-powered tools
2. Use them naturally — search, explore, decide
3. The platform learns your interests, patterns, and thinking style from your interactions

## Tools
- **Robo Advisor** — Multi-agent LLM system (LangGraph + Claude) with Black-Litterman portfolio optimization
- **Markets Tool** — AI-powered equity research with real-time analysis
- **Career Tool** — Interview question generator for strategic roles

## Tech Stack
- React + TypeScript + Vite + Tailwind CSS
- Firebase Auth + Cloud Firestore
- Modular tool registry (plugin architecture — adding a tool = one folder + one config entry)
- Interaction logging with usage-based profile generation

## Architecture
Every tool interaction is logged to Firestore. The profile page reads this data to infer user interests — no onboarding forms, no questionnaires. The platform learns you from how you work.

## Built By
**Karan Rajpal** — [LinkedIn](https://www.linkedin.com/in/krajpal/) · [GitHub](https://github.com/AAP67)
