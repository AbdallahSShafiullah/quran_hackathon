import React, { useEffect, useRef } from 'react'
import useHudaStore from '../store/useHudaStore'
import { speak } from '../utils/tts'

// State machine: idle -> wake_detected -> processing -> idle
// Recognition is created once on mount but only STARTED when micEnabled = true.

export default function WakeWordListener({ backend }) {
  const {
    setIsListening,
    setWakeWordDetected,
    setIsProcessingVoice,
    setStatusMessage,
    setInterimTranscript,
    setCurrentVerse,
    setDisplayText,
    setChapterName,
  } = useHudaStore()

  const micEnabled = useHudaStore(state => state.micEnabled)

  const recognitionRef = useRef(null)
  const stateRef = useRef('idle')
  const wasPlayingRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const micEnabledRef = useRef(false) // mirror of store value, safe to read in callbacks

  // ── Speak with mic muted to prevent TTS feedback loop ──────────────────────
  const speakSafe = async (text) => {
    isSpeakingRef.current = true
    await speak(text)
    await new Promise(r => setTimeout(r, 400))
    isSpeakingRef.current = false
  }

  // ── Create recognition object once on mount ─────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setStatusMessage('Speech recognition not supported — please use Chrome or Edge')
      return
    }

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec

    rec.onstart = () => {
      setIsListening(true)
      if (stateRef.current === 'idle') {
        setStatusMessage('Listening... Say "Hey Huda" to activate')
      }
    }

    rec.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
      // Only auto-restart when mic is still enabled
      if (micEnabledRef.current) {
        setTimeout(() => {
          try { rec.start() } catch (e) {}
        }, 300)
      }
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return
      if (e.error === 'not-allowed') {
        setStatusMessage('Mic access denied — check browser permissions')
        return
      }
      console.warn('SpeechRecognition error:', e.error)
    }

    rec.onresult = (event) => {
      if (isSpeakingRef.current) return // mute during TTS

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript.toLowerCase().trim()

        if (!result.isFinal) {
          setInterimTranscript(transcript)
          continue
        }

        setInterimTranscript('')

        if (stateRef.current === 'idle') {
          if (isWakeWord(transcript)) {
            handleWakeWord(transcript)
          }
        } else if (stateRef.current === 'wake_detected') {
          stateRef.current = 'processing'
          handleCommand(transcript)
        }
        // 'processing': ignore all results
      }
    }

    return () => {
      micEnabledRef.current = false
      try { rec.stop() } catch (e) {}
    }
  }, [])

  // ── Start / stop recognition when mic is toggled ────────────────────────────
  useEffect(() => {
    micEnabledRef.current = micEnabled

    if (!recognitionRef.current) return

    if (micEnabled) {
      try { recognitionRef.current.start() } catch (e) {}
    } else {
      try { recognitionRef.current.stop() } catch (e) {}
      // Pause any playing audio
      const audioEl = document.querySelector('audio')
      if (audioEl && !audioEl.paused) audioEl.pause()
      resetToIdle()
      setStatusMessage('Mic off — click "Enable Mic" to start')
    }
  }, [micEnabled])

  // Phonetic variants Chrome produces for "Huda" — includes Indian-accent
  // misrecognitions like "hotel", "holder", "hooter", etc.
  const WAKE_VARIANTS = [
    'huda', 'hoda', 'houda', 'hudah', 'hoodah', 'hooda',
    'who da', 'who dah', 'hewda', 'hooduh', 'hudda',
    // Indian accent variants
    'hotel', 'holder', 'hoodie', 'hooter', 'hooder', 'huddle',
    'hooda', 'hoodoo', 'hoodar', 'hudar', 'houdar',
  ]

  // Regex fallback: "hey" or "ya" followed (within a few words) by any
  // word starting with h + vowel. Catches novel misrecognitions we haven't
  // listed without creating false positives in normal speech.
  const WAKE_PATTERN = /\b(hey|ya)\b.{0,15}\bh[aeiou]\w*/i

  const isWakeWord = (t) =>
    WAKE_VARIANTS.some(v => t.includes(v)) || WAKE_PATTERN.test(t)

  // Strip all wake word variants to isolate the command portion of the utterance
  const stripWakeWord = (t) => {
    let s = t
    for (const v of WAKE_VARIANTS) {
      // also strip "hey <variant>" and "ya <variant>"
      s = s.replace(new RegExp(`(hey\\s+|ya\\s+)?${v}`, 'gi'), '')
    }
    return s.trim()
  }

  // ── Wake word handler ────────────────────────────────────────────────────────
  const handleWakeWord = async (fullTranscript) => {
    stateRef.current = 'wake_detected'
    setWakeWordDetected(true)
    setStatusMessage('Wake word detected — listening for command...')

    // Pause recitation
    const audioEl = document.querySelector('audio')
    wasPlayingRef.current = !audioEl?.paused
    if (wasPlayingRef.current && audioEl) audioEl.pause()

    // If the command was spoken in the same breath ("hey huda pause"),
    // handle it immediately without waiting for another utterance.
    const afterWake = stripWakeWord(fullTranscript)

    if (afterWake.length > 2) {
      stateRef.current = 'processing'
      await speakSafe('Got it.')
      await executeIntent(afterWake)
    } else {
      await speakSafe('Yes?')
      setStatusMessage('Listening for command...')

      // Timeout: no command in 6s → give up
      setTimeout(() => {
        if (stateRef.current === 'wake_detected') {
          speakSafe("Sorry, I didn't catch that.").then(() => {
            if (wasPlayingRef.current) document.querySelector('audio')?.play()
            resetToIdle()
          })
        }
      }, 6000)
    }
  }

  // ── Command handler ──────────────────────────────────────────────────────────
  const handleCommand = async (transcript) => {
    setIsProcessingVoice(true)
    setStatusMessage(`Heard: "${transcript}"`)
    await executeIntent(transcript)
  }

  // ── Intent executor ──────────────────────────────────────────────────────────
  const executeIntent = async (transcript) => {
    const { currentChapter, currentVerse, getPreviousVerse, chapters } = useHudaStore.getState()

    let intentRes
    try {
      const res = await fetch(`${backend}/api/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, chapter: currentChapter, verse: currentVerse }),
      })
      intentRes = await res.json()
    } catch (err) {
      console.error('Intent API error:', err)
      await speakSafe('Sorry, something went wrong.')
      if (wasPlayingRef.current) document.querySelector('audio')?.play()
      resetToIdle()
      return
    }

    const { intent, params } = intentRes

    switch (intent) {

      case 'GET_TAFSIR': {
        const target = params.verse_offset === -1 ? getPreviousVerse() : null
        const ch = target?.chapter ?? currentChapter
        const v = target?.verse ?? currentVerse
        setStatusMessage(`Fetching tafsir for ${ch}:${v}...`)
        try {
          const r = await fetch(`${backend}/api/tafsir?chapter=${ch}&verse=${v}`)
          const data = await r.json()
          setDisplayText(data.text, 'tafsir', data.verse_key)
          // If the tafsir covers a range, mention the actual verse it's stored under
          const foundKey = data.verse_key
          const requestedKey = `${ch}:${v}`
          const prefix = foundKey !== requestedKey
            ? `Tafsir covering verse ${v}, from verse ${foundKey.split(':')[1]}: `
            : `Tafsir for verse ${v}: `
          await speakSafe(prefix + data.text)
        } catch {
          await speakSafe("Sorry, couldn't fetch the tafsir.")
        }
        if (wasPlayingRef.current) setTimeout(() => document.querySelector('audio')?.play(), 500)
        break
      }

      case 'GET_TRANSLATION': {
        const target = params.verse_offset === -1 ? getPreviousVerse() : null
        const ch = target?.chapter ?? currentChapter
        const v = target?.verse ?? currentVerse
        setStatusMessage(`Fetching translation for ${ch}:${v}...`)
        try {
          const r = await fetch(`${backend}/api/translation?chapter=${ch}&verse=${v}`)
          const data = await r.json()
          setDisplayText(data.text, 'translation', data.verse_key)
          await speakSafe(`Translation: ${data.text}`)
        } catch {
          await speakSafe("Sorry, couldn't fetch the translation.")
        }
        if (wasPlayingRef.current) setTimeout(() => document.querySelector('audio')?.play(), 500)
        break
      }

      case 'NAVIGATE_CHAPTER': {
        const chapter = chapters.find(c => c.id === params.chapter_id)
        const name = chapter?.name_simple || `Chapter ${params.chapter_id}`
        setChapterName(name)
        await speakSafe(`Playing ${name}`)
        setCurrentVerse(params.chapter_id, 1)
        break
      }

      case 'NAVIGATE_VERSE': {
        await speakSafe(`Going to verse ${params.verse_id}`)
        setCurrentVerse(currentChapter, params.verse_id)
        break
      }

      case 'PLAYBACK_PAUSE': {
        document.querySelector('audio')?.pause()
        wasPlayingRef.current = false
        await speakSafe('Paused')
        break
      }

      case 'PLAYBACK_RESUME': {
        document.querySelector('audio')?.play()
        await speakSafe('Resuming')
        break
      }

      case 'PLAYBACK_NEXT': {
        const chapter = chapters.find(c => c.id === currentChapter)
        const maxVerse = chapter?.verses_count || 1
        if (currentVerse < maxVerse) {
          await speakSafe('Next verse')
          setCurrentVerse(currentChapter, currentVerse + 1)
        } else {
          await speakSafe('Already at the last verse of this chapter.')
        }
        break
      }

      case 'PLAYBACK_PREVIOUS': {
        if (currentVerse > 1) {
          await speakSafe('Previous verse')
          setCurrentVerse(currentChapter, currentVerse - 1)
        } else {
          await speakSafe('Already at the first verse.')
        }
        break
      }

      case 'PLAYBACK_REPEAT': {
        const audio = document.querySelector('audio')
        if (audio) {
          await speakSafe('Repeating verse')
          audio.currentTime = 0
          audio.play()
          wasPlayingRef.current = false
        }
        break
      }

      default: {
        await speakSafe("Sorry, I didn't understand that. Try: explain this verse, translate this, pause, or play chapter two.")
        if (wasPlayingRef.current) document.querySelector('audio')?.play()
        break
      }
    }

    resetToIdle()
  }

  const resetToIdle = () => {
    stateRef.current = 'idle'
    setWakeWordDetected(false)
    setIsProcessingVoice(false)
    setInterimTranscript('')
    if (micEnabledRef.current) {
      setStatusMessage('Listening... Say "Hey Huda" to activate')
    }
  }

  return null
}
