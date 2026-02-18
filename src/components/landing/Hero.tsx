'use client'

import { Button } from '../ui/Button'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-pink-600/10 blur-[100px] rounded-full mix-blend-screen" />
            </div>

            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-slate-800/50 border border-slate-700 text-indigo-400 text-sm font-medium mb-6">
                        v1.0 Public Beta is Live 🚀
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
                        Master Math with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                            The Power of Flow
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Skill Arena adapts to your mind in real-time. Enter the zone, compete with ghosts, and build daily streaks in a safe, distracted-free environment.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/login">
                            <Button size="lg" className="w-full sm:w-auto">
                                Start Your Journey
                            </Button>
                        </Link>
                        <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                            View Leaderboard
                        </Button>
                    </div>
                </motion.div>

                {/* Hero Visual Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="mt-20 mx-auto max-w-5xl glass-card rounded-xl p-2 border border-slate-700/50 transform perspective-1000 rotate-x-12"
                >
                    <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center text-slate-700">
                            {/* Placeholder for a gameplay screenshot or video */}
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-slate-700 rounded-full mx-auto mb-4 border-t-indigo-500 animate-spin" />
                                <p>Interactive Demo Loading...</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
