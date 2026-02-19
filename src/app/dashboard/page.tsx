'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar'
import { Button } from '@/components/ui/Button'
import { Zap, Swords, ShoppingBag, Trophy, Flame, Target, ChevronRight } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

function DashboardContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const href = (path: string) => userId ? `${path}?userId=${userId}` : path

    useEffect(() => {
        if (!userId) {
            router.push('/login')
            return
        }

        // Fetch User Data
        // Ideally we have a dedicated dashboard endpoint, for now we can chain or use what we have
        // Let's rely on stored stats or fetch profile.
        // Mocking structure for now based on what we expect
        // In real app we would start fetching /api/arena/overview or /api/user/me

        apiClient.get(`/api/arena/overview?userId=${userId}`)
            .then(data => {
                setUser(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })

    }, [userId, router])

    if (!userId) return null

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20 md:pb-0 pt-0 md:pt-20">
            <DashboardNavbar />

            <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">

                {/* Welcome & Stats Row */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-indigo-500/20">
                        <div>
                            <div className="text-indigo-200 text-sm font-medium mb-1">Current Level</div>
                            <div className="text-3xl font-bold text-white">Lvl {user?.user?.level || 1}</div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white/80 w-[45%]" />
                            </div>
                            <div className="text-xs text-indigo-200 mt-1">450 / 1000 XP</div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center text-center">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center mb-2">
                            <Flame className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div className="text-2xl font-bold text-white">{user?.user?.winStreak || 0}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Day Streak</div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center text-center">
                        <div className="w-10 h-10 bg-pink-500/10 rounded-full flex items-center justify-center mb-2">
                            <Trophy className="w-6 h-6 text-pink-500" />
                        </div>
                        <div className="text-2xl font-bold text-white">{user?.ladder?.myEntry?.rating || 1000}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Skill Rating</div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center text-center">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center mb-2">
                            <div className="text-xl">🪙</div>
                        </div>
                        <div className="text-2xl font-bold text-white">{user?.user?.coins || 0}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Coins</div>
                    </div>
                </section>

                {/* Hero: Daily Quest */}
                <section className="glass-card p-8 rounded-3xl border border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Daily Quest</h2>
                                <p className="text-slate-400">Complete your daily training to keep your streak alive.</p>
                            </div>
                            <div className="bg-slate-900 px-3 py-1 rounded-lg text-xs font-mono text-slate-400 border border-slate-800">
                                12h 45m left
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            {[
                                { name: "Warmup: 10 Quick Math", done: true },
                                { name: "Core: Algebra Basics", done: false },
                                { name: "Challenge: Beat a Global Ghost", done: false }
                            ].map((task, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${task.done ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                                        {task.done && <span className="text-black font-bold text-xs">✓</span>}
                                    </div>
                                    <span className={task.done ? 'text-slate-500 line-through' : 'text-white'}>{task.name}</span>
                                </div>
                            ))}
                        </div>

                        <Link href={href('/play')}>
                            <Button size="lg" className="bg-white text-black hover:bg-slate-200">
                                Continue Quest <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Feature Grid */}
                <section>
                    <h3 className="text-lg font-bold text-slate-400 mb-6">Explore Arena</h3>
                    <div className="grid md:grid-cols-3 gap-6">

                        <Link href={href('/play?mode=PRACTICE')} className="glass-card p-6 rounded-2xl hover:bg-slate-800/80 transition-colors group">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6 text-blue-400" />
                            </div>
                            <h4 className="text-xl font-bold mb-2">Practice</h4>
                            <p className="text-sm text-slate-400">Infinite training with adaptive difficulty. No pressure.</p>
                        </Link>

                        <Link href={href('/arena')} className="glass-card p-6 rounded-2xl hover:bg-slate-800/80 transition-colors group">
                            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Swords className="w-6 h-6 text-pink-400" />
                            </div>
                            <h4 className="text-xl font-bold mb-2">Ranked Arena</h4>
                            <p className="text-sm text-slate-400">Compete for glory in regional leagues and qualifiers.</p>
                        </Link>

                        <Link href={href('/store')} className="glass-card p-6 rounded-2xl hover:bg-slate-800/80 transition-colors group">
                            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ShoppingBag className="w-6 h-6 text-amber-400" />
                            </div>
                            <h4 className="text-xl font-bold mb-2">Item Store</h4>
                            <p className="text-sm text-slate-400">Spend your coins on avatars, frames, and boosters.</p>
                        </Link>

                    </div>
                </section>
            </main>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    )
}
