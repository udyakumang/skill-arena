'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/landing/Navbar'

import { Suspense } from 'react'

function ProfileContent() {
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')
    const [user, setUser] = useState<any>(null)
    const [inventory, setInventory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (userId) fetchData()
    }, [userId])

    async function fetchData() {
        // In a real app, we'd have a /api/profile endpoint.
        // For now, let's assume we fetch user + inventory via a new route or just reuse what we have.
        // We'll create a simple /api/profile route to support this.
        try {
            const res = await fetch(`/api/profile?userId=${userId}`)
            const data = await res.json()
            setUser(data.user)
            setInventory(data.inventory)
        } catch (e) { } finally {
            setLoading(false)
        }
    }

    async function handleEquip(type: string, sku: string) {
        // Optimistic update
        const field = type === 'AVATAR' ? 'equippedAvatarSku' :
            type === 'FRAME' ? 'equippedFrameSku' :
                type === 'BACKGROUND' ? 'equippedBackgroundSku' : 'equippedEmoteSku'

        setUser({ ...user, [field]: sku })

        await fetch('/api/profile/equip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, type, sku })
        })
    }

    if (loading) return <div className="p-8 text-white">Loading Profile...</div>
    if (!user) return <div className="p-8 text-white">User not found</div>

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />
            <div className="max-w-4xl mx-auto p-8">
                <div key="stats" className="glass-card p-8 rounded-2xl mb-8 flex items-center gap-8">
                    <div className="relative">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-4xl overflow-hidden border-2 border-slate-600">
                            {/* Avatar Render */}
                            {user.equippedAvatarSku ? '👾' : '👤'}
                        </div>
                        {/* Frame Render could go here */}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{user.name || 'Student'}</h1>
                        <div className="text-slate-400">Level {user.level} • {user.division} Division</div>
                        <div className="flex gap-4 mt-2">
                            <span className="text-yellow-400 font-bold">🪙 {user.coins} Coins</span>
                            <span className="text-blue-400 font-bold">❄️ {user.xp} XP</span>
                        </div>
                    </div>
                </div>

                <div key="customization" className="glass-card p-8 rounded-2xl">
                    <h2 className="text-2xl font-bold mb-6">Customization</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-slate-400">Avatars</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {inventory.filter(i => i.cosmetic.type === 'AVATAR').map(item => (
                                    <div
                                        key={item.id}
                                        className={`p-4 rounded-lg border cursor-pointer hover:bg-slate-800 ${user.equippedAvatarSku === item.cosmetic.sku ? 'border-yellow-500 bg-yellow-900/20' : 'border-slate-700'}`}
                                        onClick={() => handleEquip('AVATAR', item.cosmetic.sku)}
                                    >
                                        <div className="text-2xl text-center mb-2">👾</div>
                                        <div className="text-xs text-center truncate">{item.cosmetic.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-4 text-slate-400">Frames</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {inventory.filter(i => i.cosmetic.type === 'FRAME').map(item => (
                                    <div
                                        key={item.id}
                                        className={`p-4 rounded-lg border cursor-pointer hover:bg-slate-800 ${user.equippedFrameSku === item.cosmetic.sku ? 'border-yellow-500 bg-yellow-900/20' : 'border-slate-700'}`}
                                        onClick={() => handleEquip('FRAME', item.cosmetic.sku)}
                                    >
                                        <div className="text-2xl text-center mb-2">🖼️</div>
                                        <div className="text-xs text-center truncate">{item.cosmetic.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <ProfileContent />
        </Suspense>
    )
}
