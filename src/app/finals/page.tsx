'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/landing/Navbar'

export default function FinalsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')
    const finalId = searchParams.get('finalId')

    const [status, setStatus] = useState<'LOADING' | 'START' | 'QUIZ' | 'SUBMITTING' | 'RESULT' | 'ERROR'>('LOADING')
    const [items, setItems] = useState<any[]>([])
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [currentQ, setCurrentQ] = useState(0)
    const [score, setScore] = useState<number | null>(null)
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [error, setError] = useState('')

    useEffect(() => {
        if (!userId || !finalId) {
            setError("Missing params")
            setStatus('ERROR')
            return
        }
        setStatus('START')
    }, [userId, finalId])

    const startFinals = async () => {
        setStatus('LOADING')
        try {
            const res = await fetch('/api/finals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'START', userId, globalFinalId: finalId })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setItems(data.items)
            setStatus('QUIZ')
        } catch (e: any) {
            setError(e.message || "Failed to start finals")
            setStatus('ERROR')
        }
    }

    const submitAnswer = (ans: string) => {
        setAnswers(prev => ({ ...prev, [items[currentQ].id]: ans }))
        if (currentQ < items.length - 1) {
            setCurrentQ(prev => prev + 1)
        } else {
            // Last question answered
        }
    }

    const submitFinals = async () => {
        setStatus('SUBMITTING')
        try {
            const res = await fetch('/api/finals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'SUBMIT', userId, globalFinalId: finalId, answers })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setScore(data.score)
            setStatus('RESULT')
            fetchLeaderboard()
        } catch (e: any) {
            setError(e.message || "Submission failed")
            setStatus('ERROR')
        }
    }

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`/api/finals?globalFinalId=${finalId}`)
            const data = await res.json()
            setLeaderboard(data.leaderboard || [])
        } catch (e) { }
    }

    if (status === 'LOADING') return <div className="text-yellow-500 p-8">Loading Finals...</div>
    if (status === 'ERROR') return <div className="text-red-400 p-8">Error: {error}</div>

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />

            <div className="max-w-4xl mx-auto p-4 md:p-8">
                {status === 'START' && (
                    <div className="glass-card p-12 text-center rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-slate-900 to-yellow-950/20">
                        <div className="text-6xl mb-6">👑</div>
                        <h1 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
                            Season Finals
                        </h1>
                        <p className="text-yellow-100/70 mb-8 max-w-lg mx-auto text-lg">
                            The best of the best. 15 Questions. Higher Difficulty.
                            Only one chance to claim glory.
                        </p>
                        <ul className="text-left text-sm text-yellow-200/50 mb-12 max-w-sm mx-auto space-y-3 font-mono">
                            <li>Result: +20 pts per Correct</li>
                            <li>Penalty: -5 pts per Wrong</li>
                            <li>Legacy: Hall of Fame Entry</li>
                        </ul>
                        <Button onClick={startFinals} size="lg" className="w-full max-w-xs text-lg bg-yellow-600 hover:bg-yellow-500 text-white border-0 shadow-lg shadow-yellow-900/40">
                            Enter the Arena
                        </Button>
                    </div>
                )}

                {status === 'QUIZ' && items.length > 0 && (
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-between items-center mb-6 text-yellow-500/60">
                            <div>Final Question {currentQ + 1} / {items.length}</div>
                            <div className="font-mono text-yellow-500">Ranked Mode</div>
                        </div>

                        <div className="glass-card p-12 rounded-3xl mb-8 min-h-[300px] flex items-center justify-center text-center border-yellow-500/20 shadow-none ring-1 ring-yellow-500/20">
                            <div>
                                <h2 className="text-5xl font-bold mb-4">{items[currentQ].question}</h2>
                                {items[currentQ].hints && (
                                    <div className="text-sm text-slate-500 mt-4">Hint available (cost penalty)</div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <input
                                type="text"
                                autoFocus
                                className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-center text-2xl outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                                placeholder="Answer..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const target = e.target as HTMLInputElement
                                        if (target.value) {
                                            submitAnswer(target.value)
                                            target.value = ''
                                        }
                                    }
                                }}
                            />
                            <div className="text-center text-xs text-slate-500 mt-2">No turning back. Accuracy is key.</div>
                        </div>

                        {currentQ === items.length - 1 && Object.keys(answers).length === items.length && (
                            <Button onClick={submitFinals} className="w-full mt-8 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white border-0">
                                Submit Final Score
                            </Button>
                        )}
                    </div>
                )}

                {status === 'RESULT' && (
                    <div className="text-center">
                        <div className="glass-card p-12 rounded-2xl mb-8 border-yellow-500/20">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-3xl font-bold mb-2">Finals Completed</h2>
                            <div className="text-slate-400 text-lg mb-6">Final Score</div>
                            <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-8">
                                {score}
                            </div>
                            <Button onClick={() => router.push(`/arena?userId=${userId}`)} variant="outline" className="border-slate-700 hover:bg-slate-800">
                                Return to Lobby
                            </Button>
                        </div>

                        <div className="glass-card p-8 rounded-2xl bg-slate-900/50">
                            <h3 className="text-xl font-bold mb-6 text-left text-yellow-500">Global Leaderboard</h3>
                            <div className="space-y-3">
                                {leaderboard.map((entry, i) => (
                                    <div key={i} className={`flex justify-between p-4 rounded-lg items-center ${entry.user.name === 'You' ? 'bg-yellow-900/20 border border-yellow-500/30' : 'bg-slate-900 group'}`}>
                                        <div className="flex gap-4 items-center">
                                            <span className={`font-mono w-8 text-center text-lg ${i < 3 ? 'text-yellow-400 font-bold' : 'text-slate-600'}`}>
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                            </span>
                                            <div>
                                                <div className="font-bold">{entry.user.name}</div>
                                                <div className="text-xs text-slate-500">{entry.user.region} • {entry.user.division}</div>
                                            </div>
                                        </div>
                                        <span className="font-mono text-xl text-yellow-200">{entry.finalScore}</span>
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
