'use client'

import Link from 'next/link'
import { Button } from '../ui/Button'
import { motion } from 'framer-motion'

export function Navbar() {
    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-slate-800/50"
        >
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">
                        S
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">Skill Arena</span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Features</Link>
                    <Link href="#how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">How it works</Link>
                    <Link href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Pricing</Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="ghost" size="sm">Log in</Button>
                    </Link>
                    <Link href="/login?mode=signup">
                        <Button variant="primary" size="sm" className="hidden sm:flex">Start Training</Button>
                    </Link>
                </div>
            </div>
        </motion.nav>
    )
}
