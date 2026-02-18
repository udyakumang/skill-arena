'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

function DashboardContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const userId = searchParams.get('userId')

    // State
    const [started, setStarted] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [item, setItem] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [answer, setAnswer] = useState('')
    const [feedback, setFeedback] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(false)

    // Redirect if no user
    useEffect(() => {
        if (!userId) {
            router.push('/login')
        }
    }, [userId, router])

    // Start Session
    const startSession = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/session/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, type: 'PRACTICE' })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setSessionId(data.sessionId)
            setItem(data.item)
            setStarted(true)
        } catch (e) {
            console.error(e)
            alert('Failed to start session')
        } finally {
            setLoading(false)
        }
    }

    // Submit Answer
    const submitAnswer = async () => {
        if (!item || !sessionId) return

        const res = await fetch('/api/session/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                itemId: item.id,
                userAnswer: answer,
                timeTakenMs: 2000,
                hintsUsed: 0
            })
        })
        const data = await res.json()
        setFeedback(data)

        // Auto-advance
        setTimeout(() => {
            if (data.nextItem) {
                setItem(data.nextItem)
                setAnswer('')
                setFeedback(null)
            }
        }, 2000)
    }

    if (!userId) return null

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
                        Skill Arena Dashboard
                    </h1>
                    <div className="text-sm text-slate-400">Player: <span className="text-white">{userId.split('-')[0]}...</span></div>
                </header>

                {!started ? (
                    <div className="glass-card p-10 rounded-2xl text-center max-w-lg mx-auto">
                        <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                            ⚔️
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Ready to Train?</h2>
                        <p className="text-slate-400 mb-8">
                            Your daily quest awaits. Focus, adapt, and enter the flow state.
                        </p>
                        <Button size="lg" onClick={startSession} disabled={loading} className="w-full">
                            {loading ? 'Entering Arena...' : 'Start Practice Session'}
                        </Button>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto space-y-8">
                        {/* Game Card */}
                        <div className="glass-card p-12 rounded-3xl relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center ring-1 ring-white/10">
                            {feedback ? (
                                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                    <div className="text-8xl mb-4">
                                        {feedback.result.isCorrect ? '✨' : '🛡️'}
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {feedback.result.isCorrect ? 'Brilliant!' : 'Keep going!'}
                                    </div>
                                    <div className="text-indigo-300">
                                        {feedback.animation?.layers?.character || "Correct!"}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full space-y-8">
                                    <div className="text-slate-500 text-sm tracking-[0.2em] uppercase font-bold">
                                        Question
                                    </div>
                                    <h2 className="text-5xl md:text-6xl font-bold text-white font-mono">
                                        {item?.question}
                                    </h2>
                                </div>
                            )}
                        </div>

                        {/* Input Controls */}
                        <div className="flex gap-4 max-w-md mx-auto">
                            <input
                                type="text"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && answer && !feedback && submitAnswer()}
                                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-6 py-4 text-2xl text-center outline-none focus:ring-2 ring-indigo-500 text-white placeholder-slate-600"
                                placeholder="?"
                                disabled={!!feedback}
                                autoFocus
                            />
                            <Button
                                onClick={submitAnswer}
                                disabled={!answer || !!feedback}
                                size="lg"
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Arena...</div>}>
            <DashboardContent />
        </Suspense>
    )
}
