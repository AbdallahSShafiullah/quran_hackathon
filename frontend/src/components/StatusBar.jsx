import React from 'react'
import useHudaStore from '../store/useHudaStore'

export default function StatusBar() {
    const { statusMessage, isListening, wakeWordDetected, isProcessingVoice, interimTranscript } = useHudaStore()

    const dotClass =
        wakeWordDetected || isProcessingVoice ? 'active'
            : isListening ? 'listening'
                : 'idle'

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div className="status-bar">
                <div className={`status-dot ${dotClass}`} />
                <span className="status-text">{statusMessage}</span>
            </div>
            {interimTranscript && (
                <div className="interim-text">
                    "{interimTranscript}"
                </div>
            )}
        </div>
    )
}