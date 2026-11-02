# Aawaz (आवाज़) — Bolo. Hum likh denge.

> A voice-first & typed AI productivity workspace for Indian-language speakers. Turn speech or problem descriptions in any Indian language or Hinglish into structured meeting notes and formal letters in seconds.

---

## 🌟 What's New in This Release

- **Minimalist Modern Redesign**: Inspired by Linear, Vercel, and Notion with lots of whitespace, crisp 1px borders, HSL-tailored light/dark themes, and single orange `#F97316` accent.
- **Account & Authentication**: User accounts with email/password auth and session protection powered by **Supabase Auth** (with resilient local demo fallback).
- **Studio Creation Workspace**:
  - **Speak | Type Toggle**: Seamlessly switch between speaking with the microphone and typing directly into an auto-growing textarea without losing context.
  - **Scenario Chips**: One-click scenario templates (Security deposit demand, Sick leave, Broadband complaint, Sprint notes).
  - **Editable Inline Letter Preview**: Paper-like preview in serif font with highlighted `[placeholders]` and inline edit mode.
  - **Auto-Save**: Every generated result is automatically saved to the database.
- **Personalized Dashboard**:
  - Time-aware greeting ("Good morning, {name}")
  - 4 Key Stat Cards (Total documents, Notes, Letters, This week)
  - Quick Action cards with "Type instead" links
  - Searchable, filterable activity history with instant search and pagination
- **Settings Page**: Customize display name, default input/output language, default tone, and theme appearance.

---

## 📸 Screenshots & UI Preview

| Landing Page | Studio Workspace |
| :---: | :---: |
| *Clean Linear-style hero & how-it-works* | *Dual Speak/Type interface with live timer* |

| Dashboard & Stats | Formal Letter Preview |
| :---: | :---: |
| *Metrics, quick actions & document list* | *Paper-like card with placeholder chips* |

---

## 🏗️ Architecture

```text
+---------------------------------------------------------------------------------+
|                                Browser Client                                   |
|   Next.js App Router (TypeScript + Tailwind CSS + Lucide + next-themes + Sonner)|
+-----------------------+----------------------------------+----------------------+
                        |                                  |
              Auth & DB | (Supabase SSR)       API Calls   | (Route Handlers)
                        v                                  v
+------------------------------------+  +-----------------------------------------+
|        Supabase Platform           |  |          Next.js Route Handlers         |
|  - Auth (email/password, Google)   |  |  (Node.js runtime, maxDuration: 60s)    |
|  - Profiles table + RLS            |  |                                         |
|  - Documents table + RLS           |  |  /api/transcribe      /api/process      |
|  - Auto-create user trigger        |  |  /api/speak           /api/translate    |
+------------------------------------+  |  /api/documents       /api/documents/:id|
                                        +--------------------+--------------------+
                                                             |
                                                             v
                                        +-----------------------------------------+
                                        |             Sarvam AI Cloud             |
                                        |  - Saaras:v4 (Indic STT)                |
                                        |  - Sarvam-105b-conversations (LLM)      |
                                        |  - Bulbul:v4-flash (Indic TTS)          |
                                        |  - Sarvam-translate:v1 (Translation)   |
                                        +-----------------------------------------+
```

---

## 🇮🇳 Sarvam Capabilities Used

| Capability | Model | Endpoint | Purpose |
|------------|-------|----------|---------|
| **Speech-to-Text (Saaras)** | `saaras:v4` | `POST /speech-to-text` | High-accuracy transcription of Indic speech & code-mixed Hinglish. |
| **LLM Reasoning & JSON** | `sarvam-105b-conversations` | `POST /v1/chat/completions` | Zero-shot structured notes & formal letter generation with JSON repair. |
| **Text-to-Speech (Bulbul)** | `bulbul:v4-flash` (`meera`) | `POST /text-to-speech` | Authentic Indian voice playback with sentence-boundary chunking. |
| **Machine Translation** | `sarvam-translate:v1` | `POST /translate` | Cross-language translation across 11+ official Indian languages. |

---

## 🗄️ Supabase Database Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
4. Retrieve your **Project URL** and **Anon Key** from *Project Settings > API*.

> **Note**: If Supabase environment variables are omitted, Aawaz automatically runs in **Demo Mode** using browser `localStorage` and a guest profile so the entire app can still be previewed and tested without configuration.

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|:---:|---|
| `SARVAM_API_KEY` | **Yes** | Your Sarvam subscription key from [dashboard.sarvam.ai](https://dashboard.sarvam.ai) |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Your Supabase Project URL (e.g. `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Your Supabase public Anon key |
| `NEXT_PUBLIC_ENABLE_GOOGLE` | Optional | Set to `true` to display "Continue with Google" button |
| `SARVAM_STT_MODEL` | No | Defaults to `saaras:v4` |
| `SARVAM_LLM_MODEL` | No | Defaults to `sarvam-105b-conversations` |
| `SARVAM_TTS_MODEL` | No | Defaults to `bulbul:v4-flash` |
| `SARVAM_TTS_SPEAKER` | No | Defaults to `meera` |
| `SARVAM_TRANSLATE_MODEL` | No | Defaults to `sarvam-translate:v1` |

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup env file
cp .env.example .env
# Edit .env with your SARVAM_API_KEY and Supabase keys

# 3. Start development server
npm run dev
```


---

## 🚢 Vercel Deployment Instructions

1. Push your latest code to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete redesign with auth, dashboard, and typed input"
   git push origin main
   ```
2. In the [Vercel Dashboard](https://vercel.com):
   - Navigate to your **aawaz** project.
   - Go to **Settings > Environment Variables**.
   - Add/verify:
     - `SARVAM_API_KEY`
     - `NEXT_PUBLIC_SUPABASE_URL` *(if using Supabase)*
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` *(if using Supabase)*
3. Trigger a redeploy:
   - Go to the **Deployments** tab.
   - Click the three dots `...` on the latest deployment and select **Redeploy**.
