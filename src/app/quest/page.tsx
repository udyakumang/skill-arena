'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

export default function QuestPage() {
    const [config, setConfig] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [currentStage, setCurrentStage] = useState<'warmup' | 'core' | 'challenge'>('warmup')
    const [stageProgress, setStageProgress] = useState(0)
    const [item, setItem] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [feedback, setFeedback] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [answer, setAnswer] = useState('')
    const [loading, setLoading] = useState(false)
    const [streak, setStreak] = useState(0)

    const inputRef = useRef<HTMLInputElement>(null)
    const initializedRef = useRef(false)

    // TODO: Ideally get from Context or Auth
    // Hardcoding for MVP flow
    const userId = 'guest-User'

    const fetchNextItem = useCallback(async (skillId: string) => {
        setLoading(true)
        try {
            const res = await fetch('/api/session/start', {
                method: 'POST',
                body: JSON.stringify({ userId, skillId, type: 'PRACTICE' })
            })
            const data = await res.json()
            setItem(data.item)
            setFeedback(null)
            setAnswer('')
            // Auto-focus after a short delay to ensure render
            setTimeout(() => {
                inputRef.current?.focus()
            }, 50)
        } catch (error) {
            console.error("Failed to fetch next item:", error)
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        const startQuest = async () => {
            if (initializedRef.current) return
            initializedRef.current = true

            try {
                // 1. Get Quest Config
                const res = await fetch('/api/quest/start', {
                    method: 'POST',
                    body: JSON.stringify({ userId })
                })
                const data = await res.json()
                setConfig(data.config)
                setSessionId(data.sessionId)

                // 2. Start First Item
                fetchNextItem(data.config.warmup.skillId)
            } catch (error) {
                console.error("Failed to start quest:", error)
            }
        }
        startQuest()
    }, [fetchNextItem, userId])

    // Re-focus input when item changes or feedback clears
    useEffect(() => {
        if (!feedback && item && !loading) {
            // Small delay to ensure disabled attribute is removed from DOM before focusing
            const timer = setTimeout(() => {
                inputRef.current?.focus()
            }, 10)
            return () => clearTimeout(timer)
        }
    }, [item, feedback, loading])

    const submitAnswer = async () => {
        if (!item || loading || !answer.trim()) return

        setLoading(true)
        try {
            const res = await fetch('/api/session/submit', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    itemId: item.id,
                    userAnswer: answer,
                    timeTakenMs: 1000,
                    hintsUsed: 0
                })
            })
            const data = await res.json()
            setFeedback(data)

            // Progression Logic
            setTimeout(() => {
                handleProgression(data.result.isCorrect)
            }, 2000)
        } catch (error) {
            console.error("Failed to submit answer:", error)
            setLoading(false)
        }
        // Note: loading stays true during feedback delay until next item fetch starts
    }

    const handleProgression = (isCorrect: boolean) => {
        // Update Streak
        if (isCorrect) {
            setStreak(prev => prev + 1)
        } else {
            setStreak(0)
        }

        const targetCount = config[currentStage].count
        const nextProgress = stageProgress + 1

        if (nextProgress >= targetCount) {
            // Stage Complete!
            if (currentStage === 'warmup') {
                setCurrentStage('core')
                setStageProgress(0)
                fetchNextItem(config.core.skillId)
            } else if (currentStage === 'core') {
                setCurrentStage('challenge')
                setStageProgress(0)
                fetchNextItem(config.challenge.skillId)
            } else {
                alert("QUEST COMPLETE! 🎉")
            }
        } else {
            setStageProgress(nextProgress)
            fetchNextItem(config[currentStage].skillId)
        }
    }

    if (!config) return <div className="p-10 text-white min-h-screen bg-slate-900 flex items-center justify-center">Loading Quest...</div>

    return (
        <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
            {/* Header */}
            <div className="w-full max-w-md mb-8 flex justify-between items-center">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-yellow-500 uppercase tracking-widest">{currentStage} Phase</h1>
                    <div className="text-xs text-slate-500">Quest Progress</div>
                </div>

                <div className="flex gap-4">
                    {streak > 0 && (
                        <div className="flex items-center gap-1 text-orange-400 font-bold animate-pulse">
                            <span>🔥</span>
                            <span>{streak}</span>
                        </div>
                    )}
                    <div className="text-slate-400 font-mono bg-slate-800 px-3 py-1 rounded-lg">
                        {stageProgress} / {config[currentStage].count}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md h-2 bg-slate-800 rounded-full mb-8 overflow-hidden relative">
                <div
                    className="h-full bg-yellow-500 transition-all duration-500 ease-out"
                    style={{ width: `${(stageProgress / config[currentStage].count) * 100}%` }}
                />
            </div>

            {/* Question Card */}
            <div className="w-full max-w-md bg-slate-800 rounded-2xl p-8 text-center shadow-2xl mb-8 min-h-[200px] flex flex-col justify-center items-center relative overflow-hidden transition-all">
                {loading ? (
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-4 w-3/4 bg-slate-700 rounded mb-4"></div>
                        <div className="h-4 w-1/2 bg-slate-700 rounded"></div>
                    </div>
                ) : feedback ? (
                    <div className="animate-bounce">
                        <div className="text-6xl mb-4">{feedback.result.isCorrect ? '✅' : '❌'}</div>
                        <div className={`text-xl font-bold ${feedback.result.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {feedback.result.isCorrect ? 'Correct!' : 'Keep trying!'}
                        </div>
                        {feedback.animation?.layers.character && (
                            <div className="mt-2 text-sm text-indigo-300">{feedback.animation.layers.character}</div>
                        )}
                    </div>
                ) : (
                    <h2 className="text-4xl font-bold animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {item?.question}
                    </h2>
                )}
            </div>

            {/* Input */}
            <div className={`flex gap-4 w-full max-w-md transition-opacity duration-300 ${loading || feedback ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <input
                    ref={inputRef}
                    type="text"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    className="flex-1 bg-slate-700 rounded-xl px-6 py-4 text-2xl text-center outline-none focus:ring-2 ring-yellow-500 transition-all"
                    placeholder="Type answer..."
                    disabled={loading || !!feedback}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            submitAnswer()
                        }
                    }}
                    autoComplete="off"
                    autoFocus
                />
                <button
                    onClick={submitAnswer}
                    disabled={!answer || loading || !!feedback}
                    className="px-8 py-4 bg-yellow-600 rounded-xl font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                >
                    GO
                </button>
            </div>

            <div className="mt-8 text-xs text-slate-600">
                Press <span className="font-mono bg-slate-800 px-1 rounded text-slate-400">Enter</span> to submit
            </div>
        </main>
    )
}
