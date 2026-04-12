import React, { useEffect, useRef } from 'react'
import useHudaStore from '../store/useHudaStore'

// MicControl: mic toggle button + live waveform visualizer.
// Uses getUserMedia + Web Audio API for the canvas waveform.
// SpeechRecognition (in WakeWordListener) starts/stops based on micEnabled in the store.

export default function MicControl() {
  const { micEnabled, setMicEnabled, setStatusMessage } = useHudaStore()

  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const audioCtxRef = useRef(null)

  useEffect(() => {
    if (micEnabled) {
      startVisualizer()
    } else {
      stopVisualizer()
    }
    return () => stopVisualizer()
  }, [micEnabled])

  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyserRef.current = analyser

      drawLoop()
    } catch (err) {
      console.error('Mic access error:', err)
      setMicEnabled(false)
      setStatusMessage('Mic access denied — check browser permissions')
    }
  }

  const stopVisualizer = () => {
    cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close().catch(() => {})
    analyserRef.current = null
    streamRef.current = null
    audioCtxRef.current = null

    // Draw flat line on canvas to indicate off state
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#1a3d2b'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, canvas.height / 2)
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }
  }

  const drawLoop = () => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const W = canvas.width
    const H = canvas.height

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)

      ctx.clearRect(0, 0, W, H)

      // Pick line color based on voice state
      const { wakeWordDetected, isProcessingVoice } = useHudaStore.getState()
      const active = wakeWordDetected || isProcessingVoice
      ctx.strokeStyle = active ? '#c9a84c' : '#1a6b4a'
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()

      const step = W / (bufferLength - 1)
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0       // 0..2, center at 1.0
        const y = ((v - 1.0) * (H * 0.45)) + H / 2
        if (i === 0) ctx.moveTo(0, y)
        else ctx.lineTo(i * step, y)
      }
      ctx.stroke()
    }

    draw()
  }

  const toggle = async () => {
    setMicEnabled(!micEnabled)
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-md">
      {/* Waveform canvas */}
      <div className="w-full bg-huda-dark border border-huda-green rounded-xl overflow-hidden relative"
           style={{ height: '64px' }}>
        {!micEnabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-huda-light opacity-25 text-xs tracking-widest uppercase">
              mic disabled
            </span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={560}
          height={64}
          className="w-full h-full"
        />
      </div>

      {/* Toggle button */}
      <button
        onClick={toggle}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
          micEnabled
            ? 'bg-huda-green text-white shadow-lg shadow-green-900/40 hover:bg-green-700'
            : 'bg-gray-800 text-huda-light border border-gray-600 hover:border-huda-green hover:text-huda-gold'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
        >
          {micEnabled ? (
            // Mic-on icon
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-7 10a7 7 0 0 0 14 0h-2a5 5 0 0 1-10 0H5zm7 9v-2.07A7.001 7.001 0 0 0 19 11h-2a5 5 0 0 1-10 0H5a7.001 7.001 0 0 0 7 6.93V20H9v2h6v-2h-3z" />
          ) : (
            // Mic-off icon (crossed out)
            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3 3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
          )}
        </svg>
        {micEnabled ? 'Mic On — Click to Disable' : 'Enable Microphone'}
      </button>
    </div>
  )
}
