'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/landing/Navbar'

export default function ArenaPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) {
            router.push('/login')
            return
        }

        fetch(`/api/arena/overview?userId=${userId}`)
            .then(res => res.json())
            .then(d => {
                setData(d)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [userId, router]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleQualifier = () => {
        if (!data?.qualifier?.id) return
        if (data.qualifier.status === 'COMPLETED') return
        router.push(`/qualifier?userId=${userId}&qualifierId=${data.qualifier.id}&skillId=${data.qualifier.skillId}`)
    }

    const handleRanked = () => {
        // Just go to dashboard with Ranked mode active? Or start ranked session immediately?
        // MVP: Go to dashboard with mode=RANKED
        // But dashboard doesn't read mode param yet effectively. 
        // Let's assume standard flow:
        router.push(`/dashboard?userId=${userId}&mode=RANKED`)
    }

    // TODO: Implement Finals link

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Arena...</div>

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 py-12">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 mb-4">
                        Global Arena
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Competitions, Ladders, and Seasonal Glory.
                        Ranked in <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded">{data?.region || "..."}</span>
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* 1. Ranked / Ladder */}
                    <div className="glass-card p-8 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <div className="flex justify-between items-start mb-6">
                            <div className="text-2xl font-bold">Regional Ladder</div>
                            <div className="text-sm bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full">{data?.region}</div>
                        </div>

                        {data?.ladder?.myEntry ? (
                            <div className="mb-6 bg-slate-800/50 p-4 rounded-xl">
                                <div className="text-sm text-slate-400">Your Rating</div>
                                <div className="text-3xl font-mono text-white font-bold">{data.ladder.myEntry.rating}</div>
                                <div className="text-xs text-indigo-400 mt-1">{data.ladder.myEntry.division} Division</div>
                            </div>
                        ) : (
                            <div className="mb-6 text-slate-500 italic">Play ranked matches to enter ladder.</div>
                        )}

                        <div className="space-y-3 mb-8">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top 5 Leaders</div>
                            {data?.ladder?.top5?.map((entry: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm py-2 border-b border-slate-800/50 last:border-0">
                                    <span className="text-slate-300">{i + 1}. {entry.user.name || "Anon"}</span>
                                    <span className="font-mono text-indigo-300">{entry.rating}</span>
                                </div>
                            ))}
                            {(!data?.ladder?.top5 || data.ladder.top5.length === 0) && (
                                <div className="text-slate-600 text-sm">No entries yet. Be the first!</div>
                            )}
                        </div>

                        <Button onClick={handleRanked} className="w-full bg-indigo-600 hover:bg-indigo-500">
                            Play Ranked Match
                        </Button>
                    </div>

                    {/* 2. Weekly Qualifier */}
                    <div className="glass-card p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🏆</div>
                        <div className="relative z-10">
                            <div className="text-2xl font-bold mb-2">Weekly Qualifier</div>
                            <div className="text-sm text-indigo-200 mb-6">
                                {data?.qualifier?.available ? "Open Now" : "Coming Soon"}
                            </div>

                            <div className="bg-slate-950/50 p-6 rounded-xl border border-indigo-500/20 mb-8 min-h-[120px] flex flex-col justify-center">
                                {data?.qualifier?.available ? (
                                    data.qualifier.status === 'COMPLETED' ? (
                                        <div className="text-center">
                                            <div className="text-sm text-slate-400">Score</div>
                                            <div className="text-4xl font-bold text-green-400">{data.qualifier.myScore}</div>
                                            <div className="text-xs text-slate-500 mt-2">Rank processing...</div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-white mb-2">Skill: {data.qualifier.skillId}</div>
                                            <div className="text-xs text-indigo-300">Win your spot in the finals!</div>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center text-slate-500">
                                        Check back next week for new challenges.
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleQualifier}
                                disabled={!data?.qualifier?.available || data?.qualifier?.status === 'COMPLETED'}
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 border-0"
                            >
                                {data?.qualifier?.status === 'COMPLETED' ? 'Completed' : 'Enter Qualifier'}
                            </Button>
                        </div>
                    </div>

                    {/* 3. Global Finals */}
                    <div className="glass-card p-8 rounded-2xl bg-slate-900/50 border border-slate-800 opacity-80 hover:opacity-100 transition-opacity">
                        <div className="text-2xl font-bold mb-2 text-slate-200">Season Finals</div>
                        <div className="text-sm text-slate-500 mb-6">Invitation Only</div>

                        {data?.finals?.eligible ? (
                            <div className="bg-yellow-900/20 border border-yellow-500/30 p-6 rounded-xl mb-6 text-center">
                                <div className="text-yellow-400 font-bold text-lg mb-2">YOU ARE QUALIFIED!</div>
                                <div className="text-xs text-yellow-200/70">Finals status: {data.finals.status}</div>
                                <Button
                                    className="mt-4 w-full bg-yellow-600 hover:bg-yellow-500 text-white"
                                    onClick={() => router.push(`/finals?userId=${userId}&finalId=${data.finals.finalId}`)}
                                    disabled={data.finals.status !== 'LIVE'}
                                >
                                    {data.finals.status === 'LIVE' ? 'Enter Finals' : 'Wait for Start'}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[150px] text-center text-slate-600">
                                <div className="text-4xl mb-4 grayscale opacity-30">👑</div>
                                <p className="text-sm">Reach top 50 in qualifiers to earn your invite.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
