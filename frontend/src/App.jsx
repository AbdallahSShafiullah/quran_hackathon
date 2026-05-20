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
        fetch(`${BACKEND}/api/chapters`)
            .then(r => r.json())
            .then(data => setChapters(data.chapters))
            .catch(console.error)
    }, [])

    return (
        <div className="app-shell">
            {/* ── Top bar ── */}
            <header className="topbar">
                <div className="brand">
                    <span className="brand-ar">هُدى</span>
                    <span className="brand-en">Voice Quran Companion</span>
                </div>
                <StatusBar />
            </header>

            <div className="geo-divider" />

            {/* ── Main two-column layout ── */}
            <main className="main-grid">

                {/* Left: controls */}
                <aside className="left-panel">
                    <ChapterSelector backend={BACKEND} />
                    <Player backend={BACKEND} />
                </aside>

                {/* Right: mic + response */}
                <section className="right-panel">
                    <MicControl />
                    <ResponseDisplay />
                </section>
            </main>

            {/* Invisible — always mounted */}
            <WakeWordListener backend={BACKEND} />
        </div>
    )
}