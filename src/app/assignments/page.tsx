'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api-client'
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react'

// Sub-component for Join Class Modal
function JoinClassModal({ onClose, userId, onJoined }: any) {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await apiClient.post('/api/classroom/join', {
                studentUserId: userId,
                joinCode: code.toUpperCase()
            })
            if (res.error) throw new Error(res.error)

            alert(`Joined ${res.classroom.name} at ${res.classroom.school}!`)
            onJoined()
            onClose()
        } catch (e: any) {
            setError(e.message || "Failed to join")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm">
                <h3 className="text-xl font-bold text-white mb-2">Join a Class</h3>
                <p className="text-sm text-slate-400 mb-4">Enter the 6-character code from your teacher.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="w-full bg-slate-800 border-2 border-slate-600 focus:border-indigo-500 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono text-white uppercase placeholder-slate-600"
                        value={code} onChange={e => setCode(e.target.value)} required maxLength={6} placeholder="CODE"
                    />
                    {error && <div className="text-red-400 text-sm text-center">{error}</div>}

                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" type="button" onClick={onClose} className="w-full">Cancel</Button>
                        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Joining...' : 'Join Class'}</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function AssignmentsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')

    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showJoin, setShowJoin] = useState(false)

    const fetchAssignments = () => {
        setLoading(true)
        apiClient.get(`/api/assignment/my?studentUserId=${userId}`)
            .then(data => {
                setAssignments(data.assignments || [])
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }

    useEffect(() => {
        if (!userId) {
            router.push('/login')
            return
        }
        fetchAssignments()
    }, [userId, router]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleStart = async (assignmentId: string) => {
        // Start Assignment API -> Getting session params -> Redirect to Play
        try {
            await apiClient.post('/api/assignment/start', {
                studentUserId: userId,
                assignmentId
            })
            // Redirect to play with assignment context
            router.push(`/play?userId=${userId}&assignmentId=${assignmentId}&mode=ASSIGNMENT`)
        } catch (e) {
            alert('Failed to start assignment')
        }
    }

    if (!userId) return null

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20 md:pb-0 pt-0 md:pt-20">
            <DashboardNavbar />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">My Assignments</h1>
                        <p className="text-slate-400">Tasks assigned by your teachers</p>
                    </div>
                    <Button onClick={() => setShowJoin(true)} variant="outline" className="border-indigo-500 text-indigo-300 hover:bg-indigo-900/20">
                        Join Class
                    </Button>
                </header>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading Assignments...</div>
                ) : assignments.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                        <div className="text-4xl mb-4">📚</div>
                        <h3 className="text-xl font-bold text-slate-300">No Assignments Yet</h3>
                        <p className="text-slate-500 mb-6">Join a class to get started!</p>
                        <Button onClick={() => setShowJoin(true)}>Enter Join Code</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assignments.map((a) => (
                            <div key={a.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${a.status === 'COMPLETED' ? 'border-green-500 bg-green-500/20 text-green-500' : 'border-slate-600 text-slate-600'}`}>
                                        {a.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg text-white">{a.title}</div>
                                        <div className="text-sm text-slate-400 mb-1">{a.classroom.name} • {a.mode} Mode</div>
                                        {a.dueAt && (
                                            <div className="flex items-center gap-1 text-xs text-orange-400">
                                                <Clock className="w-3 h-3" /> Due: {new Date(a.dueAt).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full md:w-auto self-end md:self-center">
                                    {a.status === 'COMPLETED' ? (
                                        <div className="text-right">
                                            <div className="text-xs text-slate-400">Best Score</div>
                                            <div className="text-2xl font-bold text-white">{a.bestScore}%</div>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => handleStart(a.id)}
                                            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500"
                                        >
                                            Start <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showJoin && <JoinClassModal userId={userId} onClose={() => setShowJoin(false)} onJoined={fetchAssignments} />}
            </div>
        </div>
    )
}

export default function AssignmentsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <AssignmentsContent />
        </Suspense>
    )
}
