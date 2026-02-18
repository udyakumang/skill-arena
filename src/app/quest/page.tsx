'use client'

import React, { useState, useEffect, useCallback } from 'react'

export default function QuestPage() {
    const [config, setConfig] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [currentStage, setCurrentStage] = useState<'warmup' | 'core' | 'challenge'>('warmup')
    const [stageProgress, setStageProgress] = useState(0)
    const [item, setItem] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [feedback, setFeedback] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [answer, setAnswer] = useState('')

    // TODO: Ideally get from Context or Auth
    // Hardcoding for MVP flow
    const userId = 'guest-User'

    const fetchNextItem = useCallback(async (skillId: string) => {
        // Use existing session/start logic but overriding skill
        // Actually, we should use a /api/session/next endpoint or similar
        // For MVP, reusing /api/session/start to get an item for a specific skill
        // THIS IS A HACK for MVP speed. Ideally quest has its own item fetcher attached to session.
        const res = await fetch('/api/session/start', {
            method: 'POST',
            body: JSON.stringify({ userId, skillId, type: 'PRACTICE' })
        })
        const data = await res.json()
        setItem(data.item)
        setFeedback(null)
        setAnswer('')
    }, [userId])

    useEffect(() => {
        const startQuest = async () => {
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
        }
        startQuest()
    }, [fetchNextItem, userId])

    const submitAnswer = async () => {
        if (!item) return
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
    }

    const handleProgression = (isCorrect: boolean) => {
        // Use isCorrect for robust logic later
        console.log("Progression check, correct:", isCorrect)
        // Simple linear progression
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
            // Continue with same skill
            // In a real app, we'd use the 'nextItem' from submit, 
            // but we need to ensure it matches our Quest Skill ID constraint.
            // For now, let's trust the adaptive engine or force the skill again.
            // The submit response gives 'nextItem' which *should* be same skill.
            // Let's use it.
            // But wait, submit response 'nextItem' might be adaptive difficulty
            // within the same skill, which is what we want.
            // Ideally we check if nextItem.skillId matches current stage skill.
            // Assuming yes for MVP.
            // Actually, `submit` returns `nextItem`. We should use that.
            // BUT `submit` uses the logic from `session/submit` which might not know about Quest constraints.
            // It just generates next item for same skill.
            // So we can use it.
            // WAIT: `submit` returns `nextItem`. I need to set it.
            // I need to parse `data` from `submitAnswer` scope. 
            // So passing `data` here would be better, or just rely on fetchNextItem to generate NEW item.
            // Using fetchNextItem is safer to enforce Skill ID.
            fetchNextItem(config[currentStage].skillId)
        }
    }

    if (!config || !item) return <div className="p-10 text-white">Loading Quest...</div>

    return (
        <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
            {/* Header */}
            <div className="w-full max-w-md mb-8 flex justify-between items-center">
                <h1 className="text-xl font-bold text-yellow-500 uppercase tracking-widest">{currentStage} Phase</h1>
                <div className="text-slate-400">{stageProgress} / {config[currentStage].count}</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md h-2 bg-slate-800 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${(stageProgress / config[currentStage].count) * 100}%` }}
                />
            </div>

            {/* Question Card */}
            <div className="w-full max-w-md bg-slate-800 rounded-2xl p-8 text-center shadow-2xl mb-8">
                {feedback ? (
                    <div className="animate-bounce">
                        <div className="text-6xl mb-4">{feedback.result.isCorrect ? '✅' : '❌'}</div>
                        <div className="text-xl font-bold text-indigo-300">{feedback.animation?.layers.character}</div>
                    </div>
                ) : (
                    <h2 className="text-4xl font-bold">{item.question}</h2>
                )}
            </div>

            {/* Input */}
            <div className="flex gap-4 w-full max-w-md">
                <input
                    type="text"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    className="flex-1 bg-slate-700 rounded-xl px-6 py-4 text-2xl text-center outline-none focus:ring-2 ring-yellow-500"
                    placeholder="?"
                    disabled={!!feedback}
                    onKeyDown={e => e.key === 'Enter' && submitAnswer()}
                />
                <button
                    onClick={submitAnswer}
                    disabled={!answer || !!feedback}
                    className="px-8 py-4 bg-yellow-600 rounded-xl font-bold hover:bg-yellow-500 disabled:opacity-50 transition"
                >
                    GO
                </button>
            </div>
        </main>
    )
}
