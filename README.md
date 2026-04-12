# Huda — هُدى

> Voice-first Quran companion. Say "Hey Huda" to navigate, translate, and understand the Quran — hands-free.

Built for the Quran Foundation Hackathon — Ramadan 2026.

## Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- A HuggingFace account (free) — for STT

### 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/huda.git
cd huda

### 2. Backend setup
cd backend
cp .env.example .env
# Edit .env and add your HF_TOKEN and Quran API credentials
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

### 3. Frontend setup
cd frontend
cp .env.example .env
# VITE_BACKEND_URL should point to your running backend
npm install
npm run dev

### 4. Open in browser
Visit http://localhost:5173
Allow microphone access when prompted.
Say "Hey Huda" to activate voice commands.

## Voice Commands

| Say | Action |
|---|---|
| "Hey Huda, play chapter 2" | Navigate to Al-Baqarah |
| "Hey Huda, go to verse 255" | Navigate to Ayat al-Kursi |
| "Hey Huda, explain this verse" | Read tafsir aloud |
| "Hey Huda, translate this" | Read English translation |
| "Hey Huda, translate the previous verse" | Translate the verse before current |
| "Hey Huda, pause" | Pause recitation |
| "Hey Huda, next verse" | Skip to next verse |
| "Hey Huda, repeat" | Replay current verse |

## Deploying to GitHub Pages

cd frontend
npm run build
# Push dist/ to gh-pages branch, or use GitHub Actions

## API Credits
- Quran content: [Quran Foundation API](https://api-docs.quran.foundation)
- STT: HuggingFace Whisper-small (free tier)
- TTS: Browser-native window.speechSynthesis
