import React from 'react'
import useHudaStore from '../store/useHudaStore'

export default function ResponseDisplay() {
    const { displayText, displayMode, displayVerseKey } = useHudaStore()

    if (!displayText || displayMode === 'player') return null

    const isTabsir = displayMode === 'tafsir'
    const label = isTabsir ? 'Tafsir' : 'Translation'

    return (
        <div className="response-panel" style={{ maxWidth: '100%' }}>

            {/* Tab label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
          <span
              className="pill-btn"
              style={{
                  background: !isTabsir ? 'var(--gold-dim)' : 'transparent',
                  borderColor: !isTabsir ? 'var(--gold-border)' : 'var(--border-mid)',
                  color: !isTabsir ? 'var(--gold)' : 'var(--text-secondary)',
                  cursor: 'default',
              }}
          >
            Translation
          </span>
                    <span
                        className="pill-btn"
                        style={{
                            background: isTabsir ? 'var(--gold-dim)' : 'transparent',
                            borderColor: isTabsir ? 'var(--gold-border)' : 'var(--border-mid)',
                            color: isTabsir ? 'var(--gold)' : 'var(--text-secondary)',
                            cursor: 'default',
                        }}
                    >
            Tafsir
          </span>
                </div>

                {displayVerseKey && (
                    <span className="ayah-badge">Verse {displayVerseKey}</span>
                )}
            </div>

            {/* Divider */}
            <div className="geo-divider" />

            {/* Content */}
            <p className="response-body">{displayText}</p>
        </div>
    )
}