/**
 * Chrome SpeechSynthesis reliability fixes:
 *
 * Problem 1 – Utterances > ~200 chars get silently truncated.
 * Problem 2 – Engine stalls after ~15s of continuous speech.
 * Problem 3 – Heartbeat pause/resume can fire a premature onend, causing
 *              speakChunk to resolve early and leaving Chrome in a weird state.
 *
 * Solution: cancel-between-chunks strategy.
 *  - Split text into small chunks (≤ 75 chars) at natural boundaries.
 *  - After each chunk fully ends, call speechSynthesis.cancel() + wait 150ms
 *    before the next one. This gives Chrome a completely clean slate and
 *    prevents engine stall accumulation.
 *  - Safety timeout per chunk so a hung utterance never blocks the queue.
 */

const MAX_CHUNK = 75

function splitChunks(text) {
  const chunks = []

  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)

  for (const sentence of sentences) {
    if (sentence.length <= MAX_CHUNK) {
      chunks.push(sentence)
      continue
    }
    const clauses = sentence.split(/(?<=[,;:])\s+/).map(s => s.trim()).filter(Boolean)
    for (const clause of clauses) {
      if (clause.length <= MAX_CHUNK) {
        chunks.push(clause)
        continue
      }
      // Hard word-boundary split
      const words = clause.split(' ')
      let current = ''
      for (const word of words) {
        if ((current + ' ' + word).trim().length > MAX_CHUNK) {
          if (current) chunks.push(current.trim())
          current = word
        } else {
          current = (current + ' ' + word).trim()
        }
      }
      if (current) chunks.push(current.trim())
    }
  }

  return chunks.filter(c => c.length > 0)
}

function speakChunk(text, opts) {
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate   = opts.rate
    utter.pitch  = opts.pitch
    utter.volume = opts.volume
    utter.lang   = 'en-US'

    // Safety timeout: if onend never fires, move on after a generous estimate.
    // ~60ms per character is a conservative upper bound for normal speech rate.
    const timeoutMs = Math.max(text.length * 60 + 1500, 3000)
    const timeout = setTimeout(() => {
      utter.onend  = null
      utter.onerror = null
      resolve()
    }, timeoutMs)

    utter.onend   = () => { clearTimeout(timeout); resolve() }
    utter.onerror = () => { clearTimeout(timeout); resolve() }

    window.speechSynthesis.speak(utter)
  })
}

let _cancelFlag = false  // lets callers abort an in-progress speak()

export async function speak(text, { rate = 0.95, pitch = 1, volume = 1 } = {}) {
  if (!window.speechSynthesis) {
    console.warn('SpeechSynthesis not supported')
    return
  }

  _cancelFlag = false
  window.speechSynthesis.cancel()
  await new Promise(r => setTimeout(r, 150))  // let cancel settle

  const chunks = splitChunks(text)
  const opts   = { rate, pitch, volume }

  for (const chunk of chunks) {
    if (_cancelFlag) break

    await speakChunk(chunk, opts)

    // Cancel + pause between chunks — resets Chrome's internal timer,
    // preventing the ~15s stall bug.
    window.speechSynthesis.cancel()
    await new Promise(r => setTimeout(r, 150))
  }
}

export function cancelSpeech() {
  _cancelFlag = true
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
