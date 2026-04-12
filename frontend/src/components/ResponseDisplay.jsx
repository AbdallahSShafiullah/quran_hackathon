import React from 'react'
import useHudaStore from '../store/useHudaStore'

export default function ResponseDisplay() {
  const { displayText, displayMode, displayVerseKey } = useHudaStore()

  if (!displayText || displayMode === 'player') return null

  const label = displayMode === 'tafsir' ? 'Tafsir' : 'Translation'
  const borderColor = displayMode === 'tafsir' ? 'border-huda-gold' : 'border-blue-400'

  return (
    <div className={`w-full max-w-md bg-huda-dark border ${borderColor} rounded-2xl p-5`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-huda-gold text-sm font-semibold uppercase tracking-wide">{label}</span>
        {displayVerseKey && (
          <span className="text-huda-light opacity-50 text-xs">Verse {displayVerseKey}</span>
        )}
      </div>
      <p className="text-huda-light leading-relaxed text-sm">{displayText}</p>
    </div>
  )
}
