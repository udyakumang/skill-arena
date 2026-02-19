'use client'

import React, { useEffect, useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { offlineQueue } from '@/lib/offline-sync/queue'

export function SyncStatus() {
    const [status, setStatus] = useState<'IDLE' | 'SYNCING' | 'ERROR'>('IDLE')
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
        const checkQueue = async () => {
            const size = await offlineQueue.size()
            setPendingCount(size)
        }

        const interval = setInterval(checkQueue, 5000)
        checkQueue()

        return () => clearInterval(interval)
    }, [])

    const handleSync = async () => {
        setStatus('SYNCING')
        try {
            await offlineQueue.processQueue()
            const size = await offlineQueue.size()
            setPendingCount(size)
            setStatus('IDLE')
        } catch (e) {
            setStatus('ERROR')
            setTimeout(() => setStatus('IDLE'), 3000)
        }
    }

    if (pendingCount === 0 && status === 'IDLE') return null

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
            {pendingCount > 0 && (
                <div className="bg-amber-600 text-white px-3 py-1.5 rounded-full text-xs font-mono">
                    {pendingCount} Pending
                </div>
            )}

            <button
                onClick={handleSync}
                disabled={status === 'SYNCING'}
                className={`bg-slate-800 border border-slate-700 text-white p-2 rounded-full shadow-lg hover:bg-slate-700 transition-all ${status === 'SYNCING' ? 'animate-spin' : ''}`}
            >
                {status === 'SYNCING' ? <RefreshCw size={18} /> :
                    status === 'ERROR' ? <AlertCircle size={18} className="text-red-400" /> :
                        <RefreshCw size={18} />}
            </button>
        </div>
    )
}
