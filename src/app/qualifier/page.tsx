'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/landing/Navbar'
import { apiClient } from '@/lib/api-client'

import { Suspense } from 'react'

function QualifierContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')
    const qualifierId = searchParams.get('qualifierId')
    const skillId = searchParams.get('skillId')

    const [status, setStatus] = useState<'LOADING' | 'START' | 'QUIZ' | 'SUBMITTING' | 'RESULT' | 'ERROR'>('LOADING')
    const [items, setItems] = useState<any[]>([])
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [currentQ, setCurrentQ] = useState(0)
    const [score, setScore] = useState<number | null>(null)
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [error, setError] = useState('')

    useEffect(() => {
        if (!userId || !qualifierId || !skillId) {
            setError("Missing params")
            setStatus('ERROR')
            return
        }
        setStatus('START')
    }, [userId, qualifierId, skillId])

    const startQualifier = async () => {
        setStatus('LOADING')
        try {
            const res = await fetch('/api/qualifier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'START', userId, skillId })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setItems(data.items)
            setStatus('QUIZ')
        } catch (e: any) {
            setError(e.message || "Failed to start")
            setStatus('ERROR')
        }
    }

    const submitAnswer = (ans: string) => {
        setAnswers(prev => ({ ...prev, [items[currentQ].id]: ans }))
        if (currentQ < items.length - 1) {
            setCurrentQ(prev => prev + 1)
        } else {
            // All answered?
        }
    }

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`/api/qualifier?qualifierId=${qualifierId}`)
            const data = await res.json()
            setLeaderboard(data.leaderboard || [])
        } catch (e) { }
    }

    const submitQualifier = async () => {
        setStatus('SUBMITTING')
        try {
            const data = await apiClient.post('/api/qualifier', { action: 'SUBMIT', userId, qualifierId, answers })
            if (data.error) throw new Error(data.error)

            if (data.__queued) {
                alert("Qualifier submitted to offline queue.")
            }

            setScore(data.score || 0) // Handle pending score
            setStatus('RESULT')
            fetchLeaderboard()
        } catch (e: any) {
            setError(e.message || "Submission failed")
            setStatus('ERROR')
        }
    }


    if (status === 'LOADING') return <div className="text-white p-8">Loading...</div>
    if (status === 'ERROR') return <div className="text-red-400 p-8">Error: {error}</div>

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />

            <div className="max-w-3xl mx-auto p-4 md:p-8">
                {status === 'START' && (
                    <div className="glass-card p-12 text-center rounded-2xl">
                        <h1 className="text-4xl font-bold mb-6">Weekly Qualifier</h1>
                        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                            10 Questions. Fixed difficulty ramp. One attempt only.
                            Speed and accuracy determine your rank.
                        </p>
                        <ul className="text-left text-sm text-slate-500 mb-8 max-w-sm mx-auto space-y-2">
                            <li>• Correct: +10 pts</li>
                            <li>• Wrong: -3 pts</li>
                            <li>• Speed Bonus: Up to +20 pts</li>
                            <li>• Top 50 qualify for Seasonal Finals</li>
                        </ul>
                        <Button onClick={startQualifier} size="lg" className="w-full max-w-xs text-lg">
                            Start Attempt
                        </Button>
                    </div>
                )}

                {status === 'QUIZ' && items.length > 0 && (
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-between items-center mb-6 text-slate-400">
                            <div>Question {currentQ + 1} / {items.length}</div>
                            <div className="font-mono text-indigo-400">Time: --:--</div>
                        </div>

                        <div className="glass-card p-12 rounded-3xl mb-8 min-h-[300px] flex items-center justify-center text-center">
                            <h2 className="text-5xl font-bold">{items[currentQ].question}</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <input
                                type="text"
                                autoFocus
                                className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-center text-2xl outline-none focus:border-indigo-500"
                                placeholder="Answer..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const target = e.target as HTMLInputElement
                                        if (target.value) {
                                            submitAnswer(target.value)
                                            target.value = ''
                                            if (currentQ === items.length - 1) {
                                                // Trigger submit after last question
                                                // Small delay logic or UI button needed
                                            }
                                        }
                                    }
                                }}
                            />
                            <div className="text-center text-xs text-slate-500 mt-2">Press Enter to submit</div>
                        </div>

                        {currentQ === items.length - 1 && Object.keys(answers).length === items.length && (
                            <Button onClick={submitQualifier} className="w-full mt-8 bg-green-600 hover:bg-green-500">
                                Submit Qualifier
                            </Button>
                        )}
                    </div>
                )}

                {status === 'RESULT' && (
                    <div className="text-center">
                        <div className="glass-card p-12 rounded-2xl mb-8">
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-3xl font-bold mb-2">Qualifier Completed</h2>
                            <div className="text-slate-400 text-lg mb-6">Your Score</div>
                            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-8">
                                {score}
                            </div>
                            <Button onClick={() => router.push(`/arena?userId=${userId}`)} variant="outline">
                                Back to Arena
                            </Button>
                        </div>

                        <div className="glass-card p-8 rounded-2xl bg-slate-900/50">
                            <h3 className="text-xl font-bold mb-6 text-left">Live Leaderboard</h3>
                            <div className="space-y-3">
                                {leaderboard.map((entry, i) => (
                                    <div key={i} className={`flex justify-between p-3 rounded-lg ${entry.user.name === 'You' ? 'bg-indigo-900/30 border border-indigo-500/30' : 'bg-slate-900'}`}>
                                        <div className="flex gap-4">
                                            <span className="font-mono text-slate-500 w-6">#{i + 1}</span>
                                            <span>{entry.user.name}</span>
                                        </div>
                                        <span className="font-mono text-indigo-400">{entry.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function QualifierPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <QualifierContent />
        </Suspense>
    )
}
