# Aawaz (आवाज़) — Bolo. Hum likh denge.

> A voice-first AI tool for Indian-language speakers. Turn speech or uploaded audio in any Indian language or Hinglish into structured meeting notes or formal, ready-to-send letters and applications.

---

## 🌟 Key Features

- **🎙️ Voice-First Input**: Speak in 11+ Indian languages (Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Odia, English) or code-mixed Hinglish.
- **⏱️ 30s Safe Recording & Multi-Clip Transcribe**: Built-in 30s countdown to respect Saaras STT REST limits, automatically accumulating speech into a single transcript.
- **📁 File Upload**: Upload pre-recorded `.mp3`, `.wav`, `.m4a`, or `.webm` files directly.
- **MODE A — Aawaz Notes**:
  - Clean structured notes with title, executive summary, bulleted key points, decisions, checklist action items (task, owner, due date), and open questions.
- **MODE B — Bol Ke Likho**:
  - Generates formal letters & applications (complaint, request, official application, refund/deposit demand, resignation, leave application, other).
  - Configurable tone (Formal, Polite, Firm) and output language.
  - Highlights bracketed `[placeholders]` for details not spoken so you can fill them easily.
- **🔊 Text-to-Speech (Bulbul)**: Read the generated notes or letters aloud in authentic Indian voices with sentence-boundary chunking.
- **🌐 Instant Translation**: Seamlessly translate generated results into other Indian languages using Sarvam Translate.
- **💾 Local History Drawer**: Stores up to 10 past items safely in browser `localStorage`.
- **🚀 Demo Mode**: Works out-of-the-box even without an API key or with `?demo=1` in the URL.
- **📋 Export Options**: Quick Copy to clipboard, or Download as `.txt` and `.md`.

---

## 🏗️ Architecture

```text
+-------------------------------------------------------------------------+
|                              Browser UI                                 |
|  (Next.js App Router + TypeScript + Tailwind CSS + MediaRecorder API)   |
+-------------------+--------------------+-------------------+------------+
                    |                    |                   |
           1. Audio |           2. Text  |          3. Text  | 4. Text
              Blob  |          Transcript|            Chunks |
                    v                    v                   v
+-------------------+--------------------+-------------------+------------+
|             Next.js Route Handlers (Node.js runtime, maxDuration: 60s)  |
|                                                                         |
|   /api/transcribe      /api/process           /api/speak    /api/translate
+---------+--------------------+---------------------+--------------+-----+
          |                    |                     |              |
          | multipart          | JSON                | JSON         | JSON
          v                    v                     v              v
+---------+--------------------+---------------------+--------------+-----+
|                               Sarvam AI Cloud                           |
|                                                                         |
|  [Saaras:v4]       [sarvam-105b-     [Bulbul:v4-flash]  [sarvam-        |
|  Speech-to-Text     conversations]    Text-to-Speech     translate:v1]  |
|                     LLM (JSON mode)                                     |
+-------------------------------------------------------------------------+
```

---

## 🇮🇳 Sarvam Capabilities Used

| Capability | Model | Endpoint | Purpose |
|------------|-------|----------|---------|
| **Speech-to-Text (Saaras)** | `saaras:v4` | `POST /speech-to-text` | High-accuracy transcription of Indic languages & Hinglish audio. |
| **LLM Reasoning & Formatting** | `sarvam-105b-conversations` | `POST /v1/chat/completions` | Generates structured JSON notes & formal letters without hallucinations. |
| **Text-to-Speech (Bulbul)** | `bulbul:v4-flash` (`meera`) | `POST /text-to-speech` | Natural Indic audio speech playback with sentence-boundary chunking. |
| **Machine Translation** | `sarvam-translate:v1` | `POST /translate` | Cross-language translation across 11+ official Indian languages. |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Validation**: [Zod](https://zod.dev/)
- **Persistence**: Browser `localStorage` (No external database required)
- **Runtime**: Node.js (`export const runtime = "nodejs"`)

---

## 🚀 Local Setup

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd SARWAM_Buildathon
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and insert your Sarvam subscription key:
```env
SARVAM_API_KEY=your_sarvam_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Tip**: You can test demo mode at any time without consuming credits by appending `?demo=1` to the URL.

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SARVAM_API_KEY` | **Yes** | — | Your Sarvam AI API subscription key from [dashboard.sarvam.ai](https://dashboard.sarvam.ai). |
| `SARVAM_STT_MODEL` | No | `saaras:v4` | Sarvam STT model. |
| `SARVAM_LLM_MODEL` | No | `sarvam-105b-conversations` | Sarvam chat completions LLM model. |
| `SARVAM_TTS_MODEL` | No | `bulbul:v4-flash` | Sarvam TTS model. |
| `SARVAM_TTS_SPEAKER` | No | `meera` | Voice persona for TTS (`meera`, `arvind`, etc.). |
| `SARVAM_TRANSLATE_MODEL`| No | `sarvam-translate:v1` | Sarvam translation model. |

---

## 🚢 Vercel Deployment Instructions

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: Aawaz voice-first AI app for Indian languages"
   gh repo create aawaz --public --source=. --push
   ```
2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your `aawaz` repository.
   - Leave Framework Preset as **Next.js**.
3. **Add Environment Variables**:
   - Under **Environment Variables**, add:
     - Name: `SARVAM_API_KEY`
     - Value: `your_actual_sarvam_key`
4. **Deploy**:
   - Click **Deploy**.
   - Your application will be live in ~1-2 minutes!
   - *Note*: If you update or add environment variables later, trigger a Redeploy under **Deployments > Redeploy** for them to take effect.
