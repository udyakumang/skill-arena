'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { SkillTree } from '@/components/dashboard/SkillTree'

function PlayContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const userId = searchParams.get('userId')
    const mode = searchParams.get('mode') || 'PRACTICE'

    const assignmentId = searchParams.get('assignmentId')

    // State
    const [started, setStarted] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [item, setItem] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [answer, setAnswer] = useState('')
    const [feedback, setFeedback] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(false)

    // Finite Session State
    const [questionCount, setQuestionCount] = useState(0)
    const MAX_QUESTIONS = 10

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
                body: JSON.stringify({ userId, type: mode, assignmentId })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setSessionId(data.sessionId)
            setItem(data.item)
            setStarted(true)
            setQuestionCount(0)
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
        setQuestionCount(prev => prev + 1)

        // Auto-advance
        setTimeout(() => {
            if (questionCount >= MAX_QUESTIONS - 1) {
                // End Session logic
                // Ideally this would be a separate component, but for now alert and redirect
                alert(`Session Complete! You've finished ${MAX_QUESTIONS} questions.`)
                router.push(`/dashboard?userId=${userId}`)
            } else if (data.nextItem) {
                setItem(data.nextItem)
                setAnswer('')
                setFeedback(null)
            }
        }, 1000)
    }

    if (!userId) return null

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* Sidebar */}
            <SkillTree />

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-8 max-h-screen overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <header className="flex justify-between items-center mb-12">
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
                                Skill Arena
                            </h1>
                            <div className="text-sm text-slate-500">{mode} Mode</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard?userId=${userId}`)}>
                                    Exit
                                </Button>
                            </div>
                        </div>
                    </header>

                    {!started ? (
                        <div className="glass-card p-10 rounded-2xl text-center max-w-lg mx-auto mt-20">
                            <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-pulse">
                                ⚔️
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Ready to Train?</h2>
                            <p className="text-slate-400 mb-8">
                                {MAX_QUESTIONS} Questions. Focus on accuracy and speed.
                            </p>
                            <Button size="lg" onClick={startSession} disabled={loading} className="w-full">
                                {loading ? 'Entering Arena...' : 'Start Session'}
                            </Button>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto space-y-8 mt-10">
                            {/* Progress Header */}
                            <div className="flex justify-between items-center text-sm text-slate-400 px-2">
                                <div>Topic: <span className="text-indigo-400 font-bold">Mixed</span></div>
                                <div>Progress: {questionCount + 1} / {MAX_QUESTIONS}</div>
                            </div>

                            {/* Game Card */}
                            <div className="glass-card p-12 rounded-3xl relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center ring-1 ring-white/10 shadow-2xl shadow-indigo-500/10">
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
                                    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="text-slate-500 text-sm tracking-[0.2em] uppercase font-bold">
                                            Solve
                                        </div>
                                        <h2 className="text-6xl md:text-7xl font-bold text-white font-mono tracking-tighter">
                                            {item?.question}
                                        </h2>
                                    </div>
                                )}
                            </div>

                            {/* Input Controls */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    if (answer && !feedback) submitAnswer()
                                }}
                                className="flex gap-4 max-w-md mx-auto"
                            >
                                <input
                                    type="text"
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-6 py-4 text-2xl text-center outline-none focus:ring-2 ring-indigo-500 text-white placeholder-slate-600 font-mono"
                                    placeholder="?"
                                    disabled={!!feedback}
                                    autoFocus
                                />
                                <Button
                                    type="submit"
                                    disabled={!answer || !!feedback}
                                    size="lg"
                                    className="px-8 text-xl"
                                >
                                    Submit
                                </Button>
                            </form>

                            <div className="text-center text-xs text-slate-600">
                                Press <span className="font-mono bg-slate-800 px-1 rounded">Enter</span> to submit
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function PlayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Arena...</div>}>
            <PlayContent />
        </Suspense>
    )
}
