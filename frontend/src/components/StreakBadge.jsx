import React, { useEffect, useState } from 'react'

// Quran Foundation Streak API integration
// Endpoint: GET https://apis.quran.foundation/user-data/v1/streaks?type=QURAN&status=ACTIVE&first=1
// Requires: Authorization: Bearer <user_token>
// TODO (partner): pass real bearer token via VITE_QF_USER_TOKEN env var once OAuth is set up

const QF_USER_API = 'https://apis.quran.foundation/user-data/v1/streaks'
const TOKEN = import.meta.env.VITE_QF_USER_TOKEN || null

export default function StreakBadge() {
  const [streak, setStreak] = useState(null)

  useEffect(() => {
    if (!TOKEN) {
      // No token yet — show placeholder so the UI element is visible
      setStreak({ days: '--', status: 'ACTIVE' })
      return
    }

    fetch(`${QF_USER_API}?type=QURAN&status=ACTIVE&first=1`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    })
      .then(r => r.json())
      .then(data => {
        const active = data?.data?.[0]
        if (active) setStreak({ days: active.days, status: active.status })
      })
      .catch(() => {
        setStreak({ days: '--', status: 'ACTIVE' })
      })
  }, [])

  if (!streak) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      background: 'var(--gold-dim)',
      border: '0.5px solid var(--gold-border)',
      borderRadius: '9999px',
      padding: '5px 14px 5px 10px',
    }}>
      {/* Flame icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)">
        <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
      </svg>
      <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 500 }}>
        {streak.days}
      </span>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        day streak
      </span>
    </div>
  )
}
