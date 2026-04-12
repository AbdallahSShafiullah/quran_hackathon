import React, { useEffect } from 'react'
import useHudaStore from './store/useHudaStore'
import Player from './components/Player'
import WakeWordListener from './components/WakeWordListener'
import ResponseDisplay from './components/ResponseDisplay'
import ChapterSelector from './components/ChapterSelector'
import StatusBar from './components/StatusBar'
import MicControl from './components/MicControl'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function App() {
  const { setChapters } = useHudaStore()

  useEffect(() => {
    // Load chapter list on mount
    fetch(`${BACKEND}/api/chapters`)
      .then(r => r.json())
      .then(data => setChapters(data.chapters))
      .catch(console.error)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 gap-6">
      {/* Header */}
      <div className="text-center mt-4">
        <h1 className="text-4xl font-bold text-huda-gold">هُدى</h1>
        <p className="text-huda-light opacity-70 text-sm mt-1">Huda — Voice Quran Companion</p>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Mic Control — toggle + waveform visualizer */}
      <MicControl />

      {/* Chapter Selector */}
      <ChapterSelector backend={BACKEND} />

      {/* Player */}
      <Player backend={BACKEND} />

      {/* Response Display (tafsir / translation) */}
      <ResponseDisplay />

      {/* Wake Word Listener — always mounted, invisible */}
      <WakeWordListener backend={BACKEND} />
    </div>
  )
}
