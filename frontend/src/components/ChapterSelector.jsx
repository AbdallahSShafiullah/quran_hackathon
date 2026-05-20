import React from 'react'
import useHudaStore from '../store/useHudaStore'

export default function ChapterSelector({ backend }) {
    const {
        chapters,
        currentChapter,
        currentVerse,
        setCurrentVerse,
        setStatusMessage,
        setChapterName,
    } = useHudaStore()

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="section-label">Surah</div>

            {/* Surah info card */}
            {currentChapterData && (
                <div className="surface-card gold-tint" style={{ marginBottom: '4px' }}>
                    <div className="surah-name-ar">{currentChapterData.name_arabic || currentChapterData.name_simple}</div>
                    <div className="surah-meta">
                        <span>{currentChapterData.name_simple}</span>
                        <span>{currentChapterData.verses_count} ayat · {currentChapterData.revelation_place}</span>
                    </div>
                </div>
            )}

            {/* Chapter select */}
            <select
                className="huda-select"
                value={currentChapter}
                onChange={handleChapterChange}
            >
                {chapters.map(ch => (
                    <option key={ch.id} value={ch.id}>
                        {ch.id}. {ch.name_simple}
                        {ch.translated_name?.name ? ` — ${ch.translated_name.name}` : ''}
                    </option>
                ))}
            </select>

            {/* Verse picker row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="section-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Verse</div>
                <input
                    type="number"
                    min="1"
                    max={currentChapterData?.verses_count || 286}
                    value={currentVerse}
                    onChange={handleVerseChange}
                    className="huda-input"
                    style={{ width: '80px', flexShrink: 0 }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          of {currentChapterData?.verses_count || '—'}
        </span>
            </div>
        </div>
    )
}