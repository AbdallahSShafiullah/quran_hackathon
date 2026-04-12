import React from 'react'
import useHudaStore from '../store/useHudaStore'

export default function ChapterSelector({ backend }) {
  const { chapters, currentChapter, currentVerse, setCurrentVerse, setStatusMessage, setChapterName } = useHudaStore()

  const handleChapterChange = async (e) => {
    const chapterId = parseInt(e.target.value)
    const chapter = chapters.find(c => c.id === chapterId)
    if (chapter) {
      setChapterName(chapter.name_simple)
      setStatusMessage(`Loading ${chapter.name_simple}...`)
    }
    setCurrentVerse(chapterId, 1)
  }

  const handleVerseChange = (e) => {
    const verseNum = parseInt(e.target.value)
    if (!isNaN(verseNum) && verseNum > 0) {
      setCurrentVerse(currentChapter, verseNum)
    }
  }

  const currentChapterData = chapters.find(c => c.id === currentChapter)

  return (
    <div className="flex gap-4 flex-wrap justify-center">
      {/* Chapter select */}
      <select
        className="bg-huda-dark border border-huda-green text-huda-light rounded-lg px-3 py-2 text-sm"
        value={currentChapter}
        onChange={handleChapterChange}
      >
        {chapters.map(ch => (
          <option key={ch.id} value={ch.id}>
            {ch.id}. {ch.name_simple} ({ch.translated_name?.name})
          </option>
        ))}
      </select>

      {/* Verse number input */}
      <input
        type="number"
        min="1"
        max={currentChapterData?.verses_count || 286}
        value={currentVerse}
        onChange={handleVerseChange}
        className="bg-huda-dark border border-huda-green text-huda-light rounded-lg px-3 py-2 text-sm w-24"
        placeholder="Verse"
      />
    </div>
  )
}
