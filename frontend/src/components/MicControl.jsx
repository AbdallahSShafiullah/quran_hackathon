import React, { useEffect, useRef } from 'react'
import useHudaStore from '../store/useHudaStore'

const MicOnIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.95-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.05 7.44-7 7.93V22h-2v-4.07z"/>
    </svg>
)

const MicOffIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3 3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
    </svg>
)

export default function MicControl() {
    const { micEnabled, setMicEnabled, setStatusMessage, wakeWordDetected, isProcessingVoice } = useHudaStore()

    const canvasRef = useRef(null)
    const animFrameRef = useRef(null)
    const analyserRef = useRef(null)
    const streamRef = useRef(null)
    const audioCtxRef = useRef(null)

    const isActive = wakeWordDetected || isProcessingVoice

    useEffect(() => {
        if (micEnabled) startVisualizer()
        else stopVisualizer()
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

        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.strokeStyle = 'rgba(212,168,71,0.15)'
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

            const { wakeWordDetected, isProcessingVoice } = useHudaStore.getState()
            const activeNow = wakeWordDetected || isProcessingVoice
            ctx.strokeStyle = activeNow ? '#D4A847' : 'rgba(212,168,71,0.45)'
            ctx.lineWidth = activeNow ? 2.5 : 1.8
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            ctx.beginPath()

            const step = W / (bufferLength - 1)
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0
                const y = ((v - 1.0) * (H * 0.42)) + H / 2
                if (i === 0) ctx.moveTo(0, y)
                else ctx.lineTo(i * step, y)
            }
            ctx.stroke()
        }
        draw()
    }

    const toggle = () => setMicEnabled(!micEnabled)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', width: '100%', maxWidth: '560px' }}>

            {/* Orb + rings */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div className="orb-wrap" style={{ width: '160px', height: '160px' }}>
                    <div className={`orb-ring r3 ${isActive ? 'active' : ''}`} style={{ width: '154px', height: '154px' }} />
                    <div className={`orb-ring r2 ${isActive ? 'active' : ''}`} style={{ width: '126px', height: '126px' }} />
                    <div className={`orb-ring r1 ${isActive ? 'active' : ''}`} style={{ width: '100px', height: '100px' }} />
                    <button
                        className={`orb-core ${micEnabled ? '' : 'off'}`}
                        onClick={toggle}
                        title={micEnabled ? 'Disable microphone' : 'Enable microphone'}
                    >
                        {micEnabled ? <MicOnIcon /> : <MicOffIcon />}
                    </button>
                </div>

                <div className="mic-label">
                    {micEnabled
                        ? isActive
                            ? 'Processing...'
                            : 'Say "Hey Huda" to activate'
                        : 'Tap to enable microphone'}
                </div>
            </div>

            {/* Waveform canvas */}
            <div style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border-subtle)',
                borderRadius: '12px',
                overflow: 'hidden',
                height: '56px',
                position: 'relative',
            }}>
                {!micEnabled && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none',
                    }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              mic disabled
            </span>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    width={560}
                    height={56}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                />
            </div>
        </div>
    )
}