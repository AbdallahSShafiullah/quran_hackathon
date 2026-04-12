import React, { useEffect, useRef, useState } from 'react'
import useHudaStore from '../store/useHudaStore'

export default function Player({ backend }) {
  const {
    currentChapter, currentVerse, reciterId,
    isPlaying, setIsPlaying, setAudioUrl,
    setCurrentVerse, setStatusMessage, chapterName, chapters,
    setChapterName,
  } = useHudaStore()

  const audioRef = useRef(null)
  const [loading, setLoading] = useState(false)

  // Fetch and play audio whenever chapter/verse changes
  useEffect(() => {
    loadAndPlay()
  }, [currentChapter, currentVerse])

  const loadAndPlay = async () => {
    setLoading(true)
    setStatusMessage(`Loading ${chapterName} — Verse ${currentVerse}...`)
    try {
      const res = await fetch(`${backend}/api/audio?chapter=${currentChapter}&verse=${currentVerse}&reciter=${reciterId}`)
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

  const handleEnded = () => {
    // Auto-advance to next verse
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
    const maxVerse = chapter?.verses_count || 1
    if (currentVerse < maxVerse) setCurrentVerse(currentChapter, currentVerse + 1)
  }

  const goPrevious = () => {
    if (currentVerse > 1) setCurrentVerse(currentChapter, currentVerse - 1)
  }

  return (
    <div className="flex flex-col items-center gap-4 bg-huda-dark border border-huda-green rounded-2xl p-6 w-full max-w-md">
      {/* Verse info */}
      <div className="text-center">
        <p className="text-huda-gold text-lg font-semibold">{chapterName}</p>
        <p className="text-huda-light opacity-60 text-sm">Verse {currentVerse}</p>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={handleEnded} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} />

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button onClick={goPrevious} className="text-huda-light hover:text-huda-gold transition text-2xl">⏮</button>
        <button
          onClick={togglePlayPause}
          disabled={loading}
          className="bg-huda-green hover:bg-green-700 text-white rounded-full w-14 h-14 flex items-center justify-center text-2xl transition"
        >
          {loading ? '⏳' : isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={goNext} className="text-huda-light hover:text-huda-gold transition text-2xl">⏭</button>
      </div>
    </div>
  )
}
