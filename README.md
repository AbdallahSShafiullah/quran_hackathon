<div align="center">

# هُدى — Huda

**A voice-first Quran companion**

*Say "Hey Huda" to navigate, translate, and understand the Quran — hands-free.*

[![Quran Foundation Hackathon](https://img.shields.io/badge/Quran%20Foundation-Hackathon%202026-C9952A?style=flat-square)](https://quran.com)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-1E3A28?style=flat-square)](https://quran-hackathon-seven.vercel.app/)

</div>

---

## What is Huda?

1.9 billion Muslims engage with the Quran. 85% are non-Arabic speakers who read or hear words they don't fully understand. Fewer than 5% of digital Quran sessions ever reach tafsir or translation — not because people don't care, but because navigating menus mid-recitation creates enough friction that most never bother.

Huda removes that friction entirely. Open the app, enable the microphone, and interact with the complete Quran through natural speech. No tapping. No scrolling. No interruption.

---

## Demo

> 📹 **[Watch the 2-minute demo video](https://www.loom.com/share/0e8f6d5ebc7742d7bddc131318af4c32)**

Or try it live: **[quran-hackathon.onrender.com](https://quran-hackathon-seven.vercel.app/)**

---

## Voice Commands

| Say this | What happens |
|---|---|
| `"Hey Huda, translate this verse"` | English translation read aloud (Saheeh International) |
| `"Hey Huda, explain this verse"` | Ibn Kathir tafsir read aloud |
| `"Hey Huda, translate the previous verse"` | Translates the verse before current |
| `"Hey Huda, play chapter 2"` | Navigates to Al-Baqarah |
| `"Hey Huda, go to verse 255"` | Jumps to Ayat al-Kursi |
| `"Hey Huda, next / previous"` | Move between verses |
| `"Hey Huda, pause / resume"` | Playback control |
| `"Hey Huda, repeat"` | Replays the current verse |

---

## How It Works

```
User speaks → Wake word detected → Command captured
→ Intent classified → Quran Foundation API called
→ Response spoken aloud → Recitation resumes
```

The entire voice pipeline runs in-browser using the Web Speech API — no paid speech service, zero latency, zero cost.

---

## Quran Foundation API Usage

| API | How Huda uses it |
|---|---|
| **Chapters API** | Loads all 114 surahs on startup with Arabic names, verse counts, and revelation metadata |
| **Audio Recitations API** | Streams verse-by-verse audio (Alafasy, reciter ID 7); auto-advances through verses and chapters |
| **Translations API** | Fetches English translation on voice command (Saheeh International, ID 131) |
| **Tafsirs API** | Fetches Ibn Kathir English commentary on voice command (ID 169) |
| **Streak Tracking API** | Displays the user's active Quran reading streak in the app header |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Zustand |
| Voice recognition | Web Speech API (browser-native) |
| Text-to-speech | Web Speech Synthesis API (browser-native) |
| Waveform visualizer | Web Audio API + Canvas |
| Backend | Python, FastAPI |
| Intent classification | HuggingFace Whisper + NLP |
| Content | Quran Foundation APIs |

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- HuggingFace account (free) — for speech-to-text

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/huda.git
cd huda
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Add your HF_TOKEN and Quran API credentials to .env

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_BACKEND_URL to your running backend URL

npm install
npm run dev
```

### 4. Open

Visit `http://localhost:5173` — allow microphone access when prompted, then say **"Hey Huda"** to begin.

---

## Roadmap

- [ ] **Bookmark by voice** — "Hey Huda, bookmark this verse" saves to your Quran.com bookmarks via the Bookmarks API
- [ ] **Multilingual commands** — Arabic, Urdu, Bahasa Indonesia wake-word support
- [ ] **Memorisation mode** — Huda pauses mid-verse and waits for you to complete the ayah
- [ ] **Offline mode** — cached audio and on-device speech recognition
- [ ] **Quran.com embed** — Huda as a voice overlay directly inside Quran.com

---

## Credits

- Quran content — [Quran Foundation API](https://api-docs.quran.foundation)
- Speech-to-text — HuggingFace Whisper (free tier)
- Text-to-speech — Browser-native `window.speechSynthesis`
- Arabic typography — [Amiri font](https://www.amirifont.org)

---

<div align="center">

*Built with respect for the Quran and care for those who recite it.*

**الحمد لله**

</div>
