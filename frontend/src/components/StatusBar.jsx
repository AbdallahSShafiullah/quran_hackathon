import React from 'react'
import useHudaStore from '../store/useHudaStore'

export default function StatusBar() {
  const { statusMessage, isListening, wakeWordDetected, isProcessingVoice, interimTranscript } = useHudaStore()

  const getIndicatorColor = () => {
    if (wakeWordDetected || isProcessingVoice) return 'bg-huda-gold animate-pulse'
    if (isListening) return 'bg-green-500 animate-pulse'
    return 'bg-gray-500'
  }

  return (
    <div className="flex flex-col items-center gap-1 w-full max-w-md">
      <div className="flex items-center gap-3 bg-huda-dark border border-huda-green rounded-full px-5 py-2 text-sm w-full justify-center">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getIndicatorColor()}`} />
        <span className="text-huda-light opacity-80 text-center">{statusMessage}</span>
      </div>
      {interimTranscript && (
        <div className="text-huda-light opacity-40 text-xs italic px-2 text-center truncate max-w-full">
          Hearing: &ldquo;{interimTranscript}&rdquo;
        </div>
      )}
    </div>
  )
}
