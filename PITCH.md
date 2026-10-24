# 🚀 Foldex — Product Pitch & Presentation Guide

> **"What if your notes weren't just static text, but an intelligent, local-first workspace that visualizes complex concepts with 3Blue1Brown-style animations on demand?"**

---

## 🎯 Executive Summary (The 30-Second Elevator Pitch)

Students, developers, and researchers face a painful dilemma: cloud note apps lock up private thoughts and charge steep subscriptions for throttled AI wrappers, while visual intuition requires juggling multiple platforms like YouTube and ChatGPT. 

**Foldex is a free, local-first desktop learning environment.** Your notes live privately in an on-device SQLite database, your API keys stay encrypted in a hardware-backed Stronghold vault with zero markups, and when you hit a difficult concept, Foldex doesn’t just output bullet points—it synthesizes narrated, mathematical animations using Manim to turn abstract ideas into intuitive visual understanding.

---

## 🚨 The Problem: The 3 Broken Pillars of Learning Tools

### 1. The "AI Wrapper" Subscription Trap
- Platforms like Notion AI, Mem, or specialized study tools charge **\$20–\$30/month** on top of existing student costs.
- Behind the scenes, they heavily throttle requests, enforce token limits, and mark up raw model costs by 500%–1000%.
- Users are locked into whatever model the platform chooses, unable to switch to faster or specialized models (Claude 3.5 Sonnet, Gemini 1.5 Pro, DeepSeek, or local models).

### 2. Privacy Invasion & Zero Local Ownership
- Traditional cloud note apps store personal journals, study notes, and intellectual property on external servers.
- If the internet goes down, you lose access to your study workspace. If the company changes pricing or shuts down, your knowledge graph is hostage.

### 3. Text Alone Fails to Teach Hard Concepts
- Reading a wall of AI-generated text is passive and inefficient for STEM, physics, algorithms, and math.
- True intuitive understanding requires visual dynamics (like 3Blue1Brown animations), yet generating animations currently requires hours of Python coding or searching through unrelated videos.

---

## 💡 The Solution: Foldex

Foldex bridges the gap between structured documentation, uncompromised privacy, and high-impact visual education.

```
┌─────────────────────────────────────────────────────────────┐
│                      FOLDEX DESKTOP                         │
│                                                             │
│   ┌─────────────────────┐       ┌──────────────────────┐    │
│   │  Local-First Core   │       │  Bring Your Own AI   │    │
│   │  • SQLite On-Device │       │  • Encrypted Vault   │    │
│   │  • BlockNote Editor │       │  • Direct Streaming  │    │
│   │  • Offline-Ready    │       │  • Zero Markups      │    │
│   └─────────────────────┘       └──────────────────────┘    │
│                             ▲                               │
│                             │                               │
│                   ┌─────────┴─────────┐                     │
│                   │   Visual Engine   │                     │
│                   │   • Manim Python  │                     │
│                   │   • Voiceover     │                     │
│                   │   • Video Vault   │                     │
│                   └───────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Core Features That Set Foldex Apart

1. **Local-First by Architecture, Not An Afterthought**
   - Built on **Tauri v2 + Rust**, data is persisted in a local **SQLite database**. 
   - No login required to study; instant startup, zero latency, and 100% offline functionality.

2. **Bring Your Own Keys (BYOK)**
   - Enter your own API keys for **OpenAI, Anthropic Claude, Google Gemini, DeepSeek, xAI Grok, or Moonshot Kimi**.
   - Keys are encrypted with **Tauri Stronghold** (AES-256 GCM) on-device. Requests stream directly from your machine to the AI provider—our servers never see your keys or your notes.

3. **Autonomous Video Generation (The Manim Engine)**
   - Ask Foldex to explain Fourier Transforms, Gradient Descent, or Binary Search Trees.
   - The backend dispatches a job to a Python **Manim** engine on Cloud Run, generates procedural animations, adds neural voiceover narration, and embeds the playable MP4 directly inside your block-based note.

4. **Multi-Modal Study Blocks**
   - Interactive BlockNote canvas featuring:
     - 📐 **Mermaid diagrams** & **LaTeX equations**
     - 🃏 **AI Flashcard Decks** (auto-generated from notes)
     - 📝 **Interactive Quizzes** for active recall testing
     - 🎥 **Inline Video Explainer Cards**

---

## 🎭 The 3-Minute Live Demo Script

| Timing | What to Show | What to Say |
|---|---|---|
| **0:00 - 0:30** | Launch Foldex instantly. Open a note with LaTeX and code blocks. | *"This is Foldex. Notice there's no loading spinner or login wall. It opens in 100 milliseconds because my notes live locally on my hard drive in SQLite."* |
| **0:30 - 1:15** | Open Settings → API Keys. Show multi-provider picker. | *"Unlike tools charging \$25/month for capped GPT-4o mini, Foldex is Bring-Your-Own-Key. My Claude and Gemini keys are sealed in an encrypted Rust Stronghold vault. Calls stream directly from my machine. 100% privacy, zero markups."* |
| **1:15 - 2:15** | Trigger AI to generate a Manim video: *"Explain how QuickSort works visually."* | *"Now watch this. Instead of a boring paragraph of text, Foldex writes Manim Python code behind the scenes and renders a clean mathematical animation with audio voiceover."* |
| **2:15 - 2:45** | Play the generated animation embedded right in the note canvas. | *"In under 60 seconds, an abstract algorithmic concept becomes a 3Blue1Brown-quality video right inside my study notebook."* |
| **2:45 - 3:00** | Conclusion & GitHub / Download CTA. | *"Foldex is free, open source, and built to empower self-directed learners everywhere. Take back control of your knowledge."* |

---

## 🏗️ Technical Architecture Highlights (For Judges & Tech Audiences)

- **Frontend & Desktop Shell:** Tauri v2, Rust, React 19, Vite, TanStack Router & Query, Tailwind CSS, BlockNote.
- **Security:** Tauri Stronghold plugin using cryptographic password-derived keys for local zero-knowledge storage of LLM secrets.
- **Backend Infrastructure:** Hono on Bun deployed via Dokploy, BullMQ job queues, Redis, PostgreSQL with Drizzle ORM.
- **Distributed Rendering Pipeline:** Event-driven worker architecture offloading heavy CPU/GPU rendering to auto-scaling Google Cloud Run instances running Python 3.12, Manim 0.19, and Google Cloud TTS, streaming output directly to Cloudflare R2 object storage.

---

## 💬 Anticipated Q&A / Objections

**Q: "Why would I use this instead of Notion or Obsidian?"**  
*A: Notion isn't local-first, charges for AI, and cannot generate programmatic videos. Obsidian requires installing dozens of fragile community plugins that constantly break. Foldex combines out-of-the-box local privacy, native multi-model AI, and automated video generation in a unified, zero-configuration desktop experience.*

**Q: "Is video generation expensive?"**  
*A: Cloud Run scales to zero when no renders are occurring. Manim animations take ~30–60 seconds of CPU time costing fractions of a cent per render, with files stored cheaply on Cloudflare R2.*
