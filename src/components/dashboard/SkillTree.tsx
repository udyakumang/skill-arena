'use client'

import React from 'react'
import { twMerge } from 'tailwind-merge'

type SkillNode = {
    id: string
    title: string
    tier: number
    status: 'LOCKED' | 'ACTIVE' | 'COMPLETED'
}

const SKILL_PATH: SkillNode[] = [
    { id: 'math-add-1', title: 'Addition (1-10)', tier: 1, status: 'ACTIVE' },
    { id: 'math-sub-1', title: 'Subtraction (1-10)', tier: 1, status: 'LOCKED' },
    { id: 'math-add-2', title: 'Addition (2-digit)', tier: 2, status: 'LOCKED' },
    { id: 'math-mul-1', title: 'Multiplication', tier: 3, status: 'LOCKED' },
    { id: 'math-div-1', title: 'Division', tier: 3, status: 'LOCKED' },
    { id: 'math-frac-1', title: 'Fractions Intro', tier: 4, status: 'LOCKED' },
    { id: 'math-alg-1', title: 'Algebra Basics', tier: 6, status: 'LOCKED' },
]

export function SkillTree() {
    return (
        <div className="bg-slate-900/50 border-r border-slate-800 p-6 hidden lg:block w-80 h-screen sticky top-0 overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span>🗺️</span> Campaign Map
            </h3>

            <div className="relative space-y-8 pl-4">
                {/* Connecting Line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-800 -z-10" />

                {SKILL_PATH.map((node) => (
                    <div key={node.id} className="relative flex items-center gap-4 group">
                        {/* Node Dot */}
                        <div className={twMerge(
                            "w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center transition-all",
                            node.status === 'ACTIVE' ? "bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110" :
                                node.status === 'COMPLETED' ? "bg-green-500 border-green-400" :
                                    "bg-slate-900 border-slate-700"
                        )}>
                            {node.status === 'COMPLETED' && <span className="text-[10px]">✓</span>}
                        </div>

                        {/* Content */}
                        <div className={twMerge(
                            "flex-1 p-3 rounded-lg border transition-all",
                            node.status === 'ACTIVE' ? "bg-indigo-900/20 border-indigo-500/50" :
                                node.status === 'LOCKED' ? "bg-slate-900/20 border-slate-800/50 opacity-50 grayscale" :
                                    "bg-slate-900/50 border-slate-800"
                        )}>
                            <div className="text-sm font-bold text-slate-200">{node.title}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-mono mt-1">Tier {node.tier}</div>
                        </div>
                    </div>
                ))}

                <div className="pt-8 text-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-400 border border-slate-700">
                        Total Content: 50+ Hours
                    </div>
                </div>
            </div>
        </div>
    )
}
