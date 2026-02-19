'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/landing/Navbar'
import { Lock, Unlock, Gift } from 'lucide-react'

// Mock types
interface BPTier {
    id: string
    tier: number
    requiredXp: number
    rewardType: 'COIN' | 'COSMETIC'
    rewardValue: string
}

export default function BattlePassPage() {
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')
    const [xp, setXp] = useState(0)
    const [tiers, setTiers] = useState<BPTier[]>([])
    const [claimed, setClaimed] = useState<number[]>([])
    const [unlockedTier, setUnlockedTier] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (userId) fetchBP()
    }, [userId])

    async function fetchBP() {
        try {
            const res = await fetch(`/api/battlepass/status?userId=${userId}`)
            const data = await res.json()
            if (!data.error) {
                setXp(data.xp)
                setTiers(data.tiers || [])
                setClaimed(data.claimedTiers || [])
                setUnlockedTier(data.tierUnlocked)
            }
        } catch (e) { } finally {
            setLoading(false)
        }
    }

    async function handleClaim(tier: number) {
        try {
            const res = await fetch('/api/battlepass/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, tier })
            })
            const data = await res.json()
            if (data.success) {
                setClaimed(prev => [...prev, tier])
                alert(`Claimed Tier ${tier} Reward!`)
            } else {
                alert(data.error)
            }
        } catch (e) {
            alert("Claim failed")
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />
            <div className="max-w-4xl mx-auto p-8">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600 mb-4">
                        Season Pass
                    </h1>
                    <div className="inline-block px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
                        <span className="text-yellow-400 font-bold">{xp} XP</span> Earned
                    </div>
                </div>

                {loading ? <div>Loading...</div> : (
                    <div className="space-y-4">
                        {tiers.map((tier) => {
                            const isUnlocked = tier.tier <= unlockedTier
                            const isClaimed = claimed.includes(tier.tier)

                            return (
                                <div key={tier.id} className={`glass-card p-6 rounded-xl flex items-center justify-between border ${isUnlocked ? 'border-yellow-500/30 bg-yellow-900/10' : 'border-slate-800 bg-slate-900/50'}`}>
                                    <div className="flex items-center gap-6">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl ${isUnlocked ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                            {tier.tier}
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400">Requires {tier.requiredXp} XP</div>
                                            <div className="font-bold text-lg flex items-center gap-2">
                                                {tier.rewardType === 'COIN' ? '🪙' : '🎁'}
                                                {tier.rewardValue}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        {isClaimed ? (
                                            <div className="text-green-400 font-bold flex items-center gap-2">
                                                ✓ Claimed
                                            </div>
                                        ) : isUnlocked ? (
                                            <Button onClick={() => handleClaim(tier.tier)} className="bg-yellow-600 hover:bg-yellow-500 text-white border-0">
                                                Claim Reward
                                            </Button>
                                        ) : (
                                            <div className="text-slate-600 flex items-center gap-2">
                                                <Lock className="w-4 h-4" /> Locked
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
