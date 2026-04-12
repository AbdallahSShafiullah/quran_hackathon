import { create } from 'zustand'

const useHudaStore = create((set, get) => ({
  // --- Playback ---
  currentChapter: 1,
  currentVerse: 1,
  isPlaying: false,
  audioUrl: null,
  reciterId: 7, // Alafasy

  // --- Verse history (for "previous verse" commands) ---
  verseHistory: [], // array of { chapter, verse }

  // --- Content preferences ---
  translationId: 131, // Saheeh International
  tafsirId: 169,      // Ibn Kathir English

  // --- Voice pipeline state ---
  micEnabled: false,        // user has toggled mic on
  isListening: false,       // SpeechRecognition is actively running
  wakeWordDetected: false,  // wake word just fired, awaiting command
  isProcessingVoice: false, // intent call in flight
  interimTranscript: '',    // live speech being heard (browser STT)

  // --- UI display ---
  displayMode: 'player',  // 'player' | 'tafsir' | 'translation'
  displayText: null,       // text content to show (tafsir or translation)
  displayVerseKey: null,   // which verse the display text is for
  statusMessage: 'Say "Hey Huda" to begin', // shown in status bar
  chapterName: 'Al-Fatihah',
  chapters: [],            // full chapter list loaded on mount

  // --- Actions ---
  setCurrentVerse: (chapter, verse) => {
    const { currentChapter, currentVerse, verseHistory } = get()
    set({
      verseHistory: [...verseHistory, { chapter: currentChapter, verse: currentVerse }].slice(-10),
      currentChapter: chapter,
      currentVerse: verse,
      displayMode: 'player',
      displayText: null,
    })
  },

  setIsPlaying: (val) => set({ isPlaying: val }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setWakeWordDetected: (val) => set({ wakeWordDetected: val }),
  setIsProcessingVoice: (val) => set({ isProcessingVoice: val }),
  setStatusMessage: (msg) => set({ statusMessage: msg }),
  setDisplayText: (text, mode, verseKey) => set({ displayText: text, displayMode: mode, displayVerseKey: verseKey }),
  setChapters: (chapters) => set({ chapters }),
  setChapterName: (name) => set({ chapterName: name }),
  setMicEnabled: (val) => set({ micEnabled: val }),
  setIsListening: (val) => set({ isListening: val }),
  setInterimTranscript: (t) => set({ interimTranscript: t }),

  getPreviousVerse: () => {
    const { verseHistory } = get()
    if (verseHistory.length === 0) return null
    return verseHistory[verseHistory.length - 1]
  },
}))

export default useHudaStore
