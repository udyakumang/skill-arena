'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/user/create', {
                method: 'POST',
                body: JSON.stringify({ name: name || 'Guest' })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to create user')

            // In a real app, we'd set a cookie token here. 
            // For MVP, we pass userId via query param to the dashboard for now, 
            // or store in localStorage (simpler for this quick demo).
            localStorage.setItem('skill-arena-userid', data.id)

            router.push(`/dashboard?userId=${data.id}`)
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('An unknown error occurred')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/20 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[100px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md p-6 relative z-10"
            >
                <div className="glass-card p-8 rounded-2xl">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block">
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 cursor-pointer">
                                Skill Arena
                            </h1>
                        </Link>
                        <p className="text-slate-400 mt-2">Enter the flow state.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Player Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Enter your username..."
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Entering Arena...' : 'Start Playing'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        By continuing, you agree to our <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">Terms of Service</Link>.
                    </div>
                </div>
            </motion.div>
        </main>
    )
}
