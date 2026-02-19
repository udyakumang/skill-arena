'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/landing/Navbar'
import { Lock, ShoppingCart } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface StoreItem {
    id: string
    sku: string
    name: string
    type: string
    rarity: string
    coinCost: number
}

import { Suspense } from 'react'

function StoreContent() {
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')
    const [items, setItems] = useState<StoreItem[]>([])
    const [balance, setBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [purchasing, setPurchasing] = useState<string | null>(null)

    useEffect(() => {
        fetchItems()
        if (userId) fetchBalance()
    }, [userId])

    async function fetchItems() {
        const res = await fetch('/api/store/items')
        const data = await res.json()
        setItems(data.items || [])
        setLoading(false)
    }

    async function fetchBalance() {
        // In a real app, this would be part of a user/me endpoint
        // Here we might infer or fetch via a separate user endpoint if available.
        // For MVP, assume balance passed or fetched via profile?
        // Let's verify balance on buy attempt, but display is tricky without user endpoint.
        // We'll trust the buy API response for updated balance.
    }

    async function handleBuy(sku: string) {
        if (!userId) return alert("Log in to buy")
        setPurchasing(sku)
        try {
            const data = await apiClient.post('/api/store/buy', { userId, sku })
            if (data.error) {
                alert(data.error)
            } else if (data.__queued) {
                alert("You are offline. Purchase queued and will process when online.")
            } else {
                alert(`Purchased ${sku}! Remaining: ${data.remainingCoins}`)
                setBalance(data.remainingCoins)
            }
        } catch (e) {
            alert("Failed to buy")
        } finally {
            setPurchasing(null)
        }
    }

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'COMMON': return 'border-slate-600'
            case 'RARE': return 'border-blue-500 shadow-blue-500/20'
            case 'EPIC': return 'border-purple-500 shadow-purple-500/30'
            case 'LEGENDARY': return 'border-yellow-500 shadow-yellow-500/40'
            default: return 'border-slate-800'
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />

            <div className="max-w-6xl mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
                        Cosmetic Store
                    </h1>
                    {/* Balance display would go here */}
                </div>

                {loading ? (
                    <div>Loading Store...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {items.map(item => (
                            <div key={item.id} className={`glass-card p-6 rounded-xl border ${getRarityColor(item.rarity)} flex flex-col items-center text-center transition-all hover:scale-105`}>
                                <div className="h-32 w-32 bg-slate-900 rounded-lg mb-4 flex items-center justify-center text-4xl">
                                    {item.type === 'AVATAR' ? '👾' : item.type === 'FRAME' ? '🖼️' : '🎨'}
                                </div>
                                <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                                <div className={`text-xs font-mono mb-4 px-2 py-0.5 rounded-full bg-slate-800 ${item.rarity === 'LEGENDARY' ? 'text-yellow-400' : 'text-slate-400'}`}>
                                    {item.rarity}
                                </div>
                                <div className="flex-grow"></div>
                                <Button
                                    onClick={() => handleBuy(item.sku)}
                                    disabled={!!purchasing && purchasing === item.sku}
                                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700"
                                >
                                    {purchasing === item.sku ? 'Buying...' : (
                                        <span className="flex items-center gap-2">
                                            <span className="text-yellow-400">🪙</span> {item.coinCost}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function StorePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <StoreContent />
        </Suspense>
    )
}
