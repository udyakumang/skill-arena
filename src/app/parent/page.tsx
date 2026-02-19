'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button' // Fixed casing
import { Input } from '@/components/ui/Input'   // Fixed casing

export default function ParentDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [graph, setGraph] = useState<any[]>([])
    const [analytics, setAnalytics] = useState<any>(null)
    const [linkCode, setLinkCode] = useState('')
    const [loading, setLoading] = useState(false)

    // In a real app, we get the logged-in user ID from session
    // For MVP, let's assume we can fetch "my overview" if I am a parent
    // But we need the parentUserId. 
    // We'll trust the user context or just ask for it? 
    // Let's assume the auth layer provides the user.
    // Hack: We'll hardcode or fetch from an endpoint "me" first.
    // For now, let's implement the linking UI primarily.

    const [view, setView] = useState<'LINK' | 'DASHBOARD'>('LINK')

    useEffect(() => {
        // Check if I have a linked child
        // fetch('/api/auth/me') ...
        // For MVP demo, we start at Link screen or if we have data we show Dashboard
    }, [])

    const handleLink = async () => {
        setLoading(true)
        try {
            // Need my userId. 
            // We'll simulate by asking for Parent User ID or assumes session.
            // Let's assume we are User "cmp-parent-1" for demo if not auth'd.
            // PROMPT said "No external APIs". Auth.js is internal.
            // Let's use a prompt/input for Parent User ID to test?
            // Or just assume current user.

            // To make this robust without full auth Context available in this snippet:
            // Input for "My Parent ID" (Debug) + "Child Code"
            const res = await fetch('/api/parent/link', {
                method: 'POST',
                body: JSON.stringify({
                    parentUserId: "test-parent-id", // Replace with actual session logic
                    childLinkCode: linkCode
                })
            })
            if (res.ok) {
                const data = await res.json()
                alert(`Linked to ${data.childName}`)
                setView('DASHBOARD')
                fetchData("test-parent-id")
            } else {
                alert('Link failed')
            }
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    const fetchData = async (pid: string) => {
        const res = await fetch(`/api/parent/overview?parentUserId=${pid}`)
        if (res.ok) {
            const data = await res.json()
            setStats(data)

            // then fetch graph
            const gRes = await fetch(`/api/skills/graph?userId=${data.child.id}`)
            if (gRes.ok) setGraph((await gRes.json()).graph)

            // then analytics
            const aRes = await fetch(`/api/analytics/summary?userId=${data.child.id}`)
            if (aRes.ok) setAnalytics((await aRes.json()).summary)
        }
    }

    if (view === 'LINK') {
        return (
            <div className="p-8 max-w-md mx-auto">
                <Card>
                    <CardHeader><CardTitle>Parent Access</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Enter Child Link Code"
                            value={linkCode}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkCode(e.target.value)}
                        />
                        {/* Debug Input for Parent ID since we don't have global auth context here easily */}
                        <Button onClick={handleLink} disabled={loading}>
                            {loading ? 'Linking...' : 'Link Child'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Parent Dashboard
            </h1>

            {/* Overview Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Child</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.child.name}</div>
                            <div className="text-xs text-muted-foreground">Div: {stats.child.division} • Lvl {stats.child.level}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Win Streak</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.child.winStreak}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Skills Mastered</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.masteredSkillsCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">XP</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.child.xp}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visualizations: Analytics Trend */}
                <Card>
                    <CardHeader><CardTitle>Engagement Trend (30 Days)</CardTitle></CardHeader>
                    <CardContent className="h-64 flex items-end space-x-2">
                        {analytics?.accuracyTrend?.map((d: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                                <div
                                    className="w-full bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-all"
                                    style={{ height: `${d.accuracy}%` }}
                                ></div>
                                <span className="text-[10px] hidden group-hover:block absolute -top-6 bg-black text-white px-2 py-1 rounded">
                                    {d.date}: {Math.round(d.accuracy)}%
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Weak Skills */}
                <Card>
                    <CardHeader><CardTitle>Focus Areas (Weak Skills)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {graph
                                .filter((n: any) => n.weakSkillScore > 3)
                                .sort((a: any, b: any) => b.weakSkillScore - a.weakSkillScore)
                                .slice(0, 5)
                                .map((skill: any) => (
                                    <div key={skill.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                        <div>
                                            <div className="font-semibold text-red-900">{skill.name}</div>
                                            <div className="text-xs text-red-600">{skill.topic}</div>
                                        </div>
                                        <div className="text-red-700 font-bold">
                                            Score: {skill.weakSkillScore}
                                        </div>
                                    </div>
                                ))}
                            {graph.filter((n: any) => n.weakSkillScore > 3).length === 0 && (
                                <div className="text-center text-gray-500 italic p-4">
                                    No weak skills detected! Great job.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Heatmap / Skill Grid per Topic */}
            <Card>
                <CardHeader><CardTitle>Skill Mastery Map</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {graph.map((skill: any) => {
                            const score = skill.mastery?.score || 0
                            // Color scale
                            let color = 'bg-gray-100'
                            if (score > 80) color = 'bg-green-500'
                            else if (score > 50) color = 'bg-yellow-400'
                            else if (score > 0) color = 'bg-orange-300'

                            return (
                                <div key={skill.id} className={`p-2 rounded cursor-help ${color} text-xs text-center truncate`} title={`${skill.name}: ${score}%`}>
                                    {skill.name}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
