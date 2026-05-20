import React, { useEffect, useRef, useState } from 'react'
import useHudaStore from '../store/useHudaStore'

const PrevIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
    </svg>
)
const NextIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18l8.5-6L6 6v12zm2.5-8.5L12.77 12 8.5 15.5V9.5zM16 6h2v12h-2z"/>
    </svg>
)
const PlayIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
    </svg>
)
const PauseIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
)

export default function Player({ backend }) {
    const {
        currentChapter, currentVerse, reciterId,
        isPlaying, setIsPlaying, setAudioUrl,
        setCurrentVerse, setStatusMessage, chapterName, chapters,
        setChapterName,
    } = useHudaStore()

    const audioRef = useRef(null)
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)   // 0–100
    const [duration, setDuration] = useState(0)
    const [elapsed, setElapsed]   = useState(0)

    useEffect(() => { loadAndPlay() }, [currentChapter, currentVerse])

    const loadAndPlay = async () => {
        setLoading(true)
        setProgress(0)
        setStatusMessage(`Loading ${chapterName} — Verse ${currentVerse}...`)
        try {
            const res = await fetch(
                `${backend}/api/audio?chapter=${currentChapter}&verse=${currentVerse}&reciter=${reciterId}`
            )
            const data = await res.json()
            if (data.audio_url) {
                setAudioUrl(data.audio_url)
                if (audioRef.current) {
                    audioRef.current.src = data.audio_url
                    audioRef.current.load()
                    await audioRef.current.play()
                    setIsPlaying(true)
                    setStatusMessage(`Playing ${chapterName} — Verse ${currentVerse} | Say "Hey Huda" for commands`)
                }
            }
        } catch (err) {
            console.error('Error loading audio:', err)
            setStatusMessage('Error loading audio')
        } finally {
            setLoading(false)
        }
    }

    const handleTimeUpdate = () => {
        const audio = audioRef.current
        if (!audio || !audio.duration) return
        setElapsed(audio.currentTime)
        setProgress((audio.currentTime / audio.duration) * 100)
    }

    const handleLoadedMetadata = () => {
        setDuration(audioRef.current?.duration || 0)
    }

    const handleEnded = () => {
        const chapter = chapters.find(c => c.id === currentChapter)
        const maxVerse = chapter?.verses_count || 1
        if (currentVerse < maxVerse) {
            setCurrentVerse(currentChapter, currentVerse + 1)
        } else if (currentChapter < 114) {
            const nextChapter = chapters.find(c => c.id === currentChapter + 1)
            if (nextChapter) setChapterName(nextChapter.name_simple)
            setCurrentVerse(currentChapter + 1, 1)
        } else {
            setIsPlaying(false)
            setStatusMessage('Recitation complete. JazakAllah khair.')
        }
    }

    const togglePlayPause = () => {
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
            setStatusMessage('Paused')
        } else {
            audioRef.current.play()
            setIsPlaying(true)
            setStatusMessage(`Playing ${chapterName} — Verse ${currentVerse}`)
        }
    }

    const goNext = () => {
        const chapter = chapters.find(c => c.id === currentChapter)
        if (currentVerse < (chapter?.verses_count || 1))
            setCurrentVerse(currentChapter, currentVerse + 1)
    }

    const goPrevious = () => {
        if (currentVerse > 1) setCurrentVerse(currentChapter, currentVerse - 1)
    }

    const handleProgressClick = (e) => {
        const audio = audioRef.current
        if (!audio || !audio.duration) return
        const rect = e.currentTarget.getBoundingClientRect()
        const pct = (e.clientX - rect.left) / rect.width
        audio.currentTime = pct * audio.duration
    }

    const fmt = (s) => {
        const m = Math.floor(s / 60)
        const sec = Math.floor(s % 60)
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="section-label">Now playing</div>

            <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Verse info */}
                <div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--gold)' }}>
                        {chapterName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Verse {currentVerse}
                        {duration > 0 && ` · ${fmt(duration)}`}
                    </div>
                </div>

                {/* Progress bar */}
                <div>
                    <div
                        className="progress-track"
                        onClick={handleProgressClick}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px'
                    }}>
                        <span>{fmt(elapsed)}</span>
                        <span>{fmt(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <button className="ctrl-btn" onClick={goPrevious} title="Previous verse">
                        <PrevIcon />
                    </button>
                    <button
                        className="play-btn"
                        onClick={togglePlayPause}
                        disabled={loading}
                    >
                        {loading
                            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/></svg>
                            : isPlaying ? <PauseIcon /> : <PlayIcon />
                        }
                    </button>
                    <button className="ctrl-btn" onClick={goNext} title="Next verse">
                        <NextIcon />
                    </button>
                </div>
            </div>

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                onEnded={handleEnded}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
            />

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}