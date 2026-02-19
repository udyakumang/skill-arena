'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api-client'
import { Plus, Users, BookOpen, BarChart3, ChevronRight, Copy } from 'lucide-react'

// Sub-components would ideally be in separate files, but for speed/cohesion in this phase:

function CreateClassroomModal({ onClose, onCreated, teacherUserId }: any) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await apiClient.post('/api/classroom/create', {
                teacherUserId,
                classroomName: name,
                schoolName: "My School" // Default for MVP
            })
            onCreated(res.classroom)
            onClose()
        } catch (e) {
            alert('Failed to create classroom')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md">
                <h3 className="text-xl font-bold text-white mb-4">Create Classroom</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-400">Class Name</label>
                        <input
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                            value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Grade 5 Math"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function TeacherContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')

    // State
    const [classrooms, setClassrooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
    const [insights, setInsights] = useState<any>(null)

    useEffect(() => {
        if (!userId) {
            router.push('/login')
            return
        }

        // Fetch Classrooms
        apiClient.get(`/api/classroom/teacher?teacherUserId=${userId}`)
            .then(data => {
                setClassrooms(data.classrooms || [])
                setLoading(false)
            })
            .catch(err => setLoading(false))

    }, [userId, router])

    // Load detailed insights when a class is selected
    useEffect(() => {
        if (!selectedClassId || !userId) return

        setInsights(null)
        apiClient.get(`/api/teacher/insights?teacherUserId=${userId}&classroomId=${selectedClassId}`)
            .then(data => setInsights(data))
    }, [selectedClassId, userId])

    if (!userId) return null

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20 md:pb-0 pt-0 md:pt-20">
            <DashboardNavbar />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Teacher Dashboard</h1>
                        <p className="text-slate-400">Manage your classrooms and assignments</p>
                    </div>
                    <Button onClick={() => setShowCreate(true)} className="gap-2">
                        <Plus className="w-4 h-4" /> New Class
                    </Button>
                </header>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading classrooms...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left: Classroom List */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Your Classes</h2>

                            {classrooms.length === 0 && (
                                <div className="p-8 border border-dashed border-slate-700 rounded-xl text-center text-slate-500">
                                    No classrooms yet. Create one!
                                </div>
                            )}

                            {classrooms.map((cls) => (
                                <div
                                    key={cls.id}
                                    onClick={() => setSelectedClassId(cls.id)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedClassId === cls.id ? 'bg-indigo-900/20 border-indigo-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-white">{cls.name}</div>
                                        {/* Copy Code Badge */}
                                        <div
                                            className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono flex items-center gap-1 cursor-copy hover:bg-slate-700"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                navigator.clipboard.writeText(cls.joinCode)
                                                alert('Code copied: ' + cls.joinCode)
                                            }}
                                        >
                                            {cls.joinCode} <Copy className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-xs text-slate-400">
                                        <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {cls._count?.students || 0} Students</div>
                                        <div className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {cls._count?.assignments || 0} Assignments</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right: Detailed View */}
                        <div className="md:col-span-2">
                            {!selectedClassId ? (
                                <div className="h-full flex items-center justify-center text-slate-600 bg-slate-900/20 rounded-2xl border border-slate-800/50 min-h-[300px]">
                                    Select a classroom to view insights
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {/* Stats Row */}
                                    {!insights ? (
                                        <div className="text-center py-10">Loading insights...</div>
                                    ) : (
                                        <>
                                            {/* Weak Skills */}
                                            <div className="glass-card p-6 rounded-2xl border border-slate-800">
                                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                    <BarChart3 className="w-5 h-5 text-indigo-400" /> Class Insights (Weak Skills)
                                                </h3>
                                                {insights.weakSkills.length === 0 ? (
                                                    <div className="text-slate-500 text-sm">Not enough data yet.</div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {insights.weakSkills.map((ws: any, i: number) => (
                                                            <div key={i}>
                                                                <div className="flex justify-between text-sm mb-1">
                                                                    <span className="text-slate-300">{ws.skillId}</span>
                                                                    <span className="text-red-400 font-bold">{ws.failCount} Struggles</span>
                                                                </div>
                                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="bg-red-500 h-full rounded-full"
                                                                        style={{ width: `${Math.min(ws.failCount * 10, 100)}%` }} // Arbitrary scale
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Roster & Assignments Tabs (Simplified for MVP as lists) */}
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h3 className="font-bold">Assignments</h3>
                                                        <Button size="sm" variant="ghost" className="text-xs">+ Add</Button>
                                                    </div>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                        {insights.assignments.length === 0 && <div className="text-sm text-slate-500">No assignments yet.</div>}
                                                        {insights.assignments.map((a: any) => (
                                                            <div key={a.id} className="p-3 bg-slate-950 rounded border border-slate-800 text-sm">
                                                                <div className="font-bold">{a.title}</div>
                                                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                                                    <span>Done: {a.completed}/{a.totalStudents}</span>
                                                                    <span>In Progress: {a.inProgress}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                                    <h3 className="font-bold mb-4">Roster</h3>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                        {insights.roster.length === 0 && <div className="text-sm text-slate-500">No students joined yet. Share code!</div>}
                                                        {insights.roster.map((s: any) => (
                                                            <div key={s.id} className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded">
                                                                <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-xs font-bold text-indigo-300">
                                                                    {s.name?.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-white">{s.name}</div>
                                                                    <div className="text-xs text-slate-500">{s.division} • Lvl {s.level}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showCreate && (
                    <CreateClassroomModal
                        teacherUserId={userId}
                        onClose={() => setShowCreate(false)}
                        onCreated={(newCls: any) => {
                            setClassrooms([newCls, ...classrooms])
                            setSelectedClassId(newCls.id)
                        }}
                    />
                )}
            </div>
        </div>
    )
}

export default function TeacherPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <TeacherContent />
        </Suspense>
    )
}
