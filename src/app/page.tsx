'use client'

import React, { useState } from 'react'
// import { v4 as uuidv4 } from 'uuid'

// Mock user create for guest
// async function createGuestUser() {
//   // In real app, call /api/auth/guest
//   // For now, we simulate user ID
//   return "guest-" + Date.now()
// }

export default function Home() {
  const [started, setStarted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [item, setItem] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [userId, setUserId] = useState<string | null>(null)

  const startDiagnostic = async () => {
    // 1. Guest User Logic
    let uid = userId
    if (!uid) {
      // Create user in DB properly via API 
      // (Skipping for brevity, assuming existing for test or creating via session start implicitly logic?)
      // Let's assume we pass a temp ID and backend handles user creation if missing (or we add a /api/user/create route)
      // For MVP quick start:
      const res = await fetch('/api/user/create', { method: 'POST' })
      const data = await res.json()
      uid = data.id
      setUserId(uid)
    }

    // 2. Start Session
    const res = await fetch('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid, type: 'DIAGNOSTIC' })
    })
    const data = await res.json()
    setSessionId(data.sessionId)
    setItem(data.item)
    setStarted(true)
    setFeedback(null)
  }

  const submitAnswer = async () => {
    if (!item) return
    // const start = Date.now() // rough timing
    const res = await fetch('/api/session/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        itemId: item.id,
        userAnswer: answer,
        timeTakenMs: 2000, // Mock timing
        hintsUsed: 0
      })
    })
    const data = await res.json()
    setFeedback(data)

    // Auto-advance after delay
    setTimeout(() => {
      if (data.nextItem) {
        setItem(data.nextItem)
        setAnswer('')
        setFeedback(null)
      }
    }, 2000)
  }

  if (!started) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
        <h1 className="text-4xl font-bold mb-4">Skill Arena</h1>
        <p className="text-xl mb-8 text-slate-300">Train your mind. Master the craft.</p>
        <button
          onClick={startDiagnostic}
          className="px-8 py-4 bg-indigo-600 rounded-full text-lg font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/50"
        >
          Start Diagnostic Session
        </button>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
      <div className="w-full max-w-md space-y-8">
        {/* Progress / Animation Area */}
        <div className="h-64 bg-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden ring-1 ring-slate-700">
          {feedback ? (
            <div className="text-center animate-bounce">
              <div className="text-6xl mb-2">{feedback.result.isCorrect ? '✨' : '🛡️'}</div>
              <div className="text-xl font-bold">{feedback.animation?.layers.character}</div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Question</p>
              <h2 className="text-4xl font-bold">{item?.question}</h2>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-4">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="flex-1 bg-slate-800 rounded-xl px-4 py-3 text-2xl text-center outline-none focus:ring-2 ring-indigo-500"
            placeholder="?"
            disabled={!!feedback}
          />
          <button
            onClick={submitAnswer}
            disabled={!answer || !!feedback}
            className="px-6 py-3 bg-indigo-600 rounded-xl font-bold disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>
    </main>
  )
}
