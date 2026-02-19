'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { LayoutDashboard, Swords, ShoppingBag, User, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function DashboardNavbar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')

    // Helper to persist userId query param
    const href = (path: string) => userId ? `${path}?userId=${userId}` : path

    const isActive = (path: string) => pathname === path

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Arena', path: '/arena', icon: Swords },
        { name: 'Store', path: '/store', icon: ShoppingBag },
        { name: 'Profile', path: '/profile', icon: User },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto z-50 h-16 md:h-20 glass border-t md:border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                {/* Desktop Logo */}
                <Link href={href('/dashboard')} className="hidden md:flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                        <Zap className="w-6 h-6 fill-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">Skill Arena</span>
                </Link>

                {/* Mobile/Desktop Nav Links */}
                <div className="flex-1 md:flex-none flex justify-around md:justify-center items-center gap-1 md:gap-8 h-full">
                    {navItems.map((item) => {
                        const active = isActive(item.path)
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.path}
                                href={href(item.path)}
                                className={cn(
                                    "flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 rounded-xl transition-all duration-300 relative",
                                    active ? "text-white" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {active && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-slate-800 rounded-xl -z-10"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <Icon className={cn("w-6 h-6 md:w-5 md:h-5", active && "fill-current/10")} />
                                <span className="text-[10px] md:text-sm font-medium">{item.name}</span>
                            </Link>
                        )
                    })}
                </div>

                {/* CTA */}
                <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-slate-400 font-mono">ONLINE</span>
                    </div>
                    <Link href={href('/play')}>
                        <Button className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 border-0 shadow-lg shadow-indigo-500/25">
                            Quick Play
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
