'use client'

import React, { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsVisible(true)
        }

        window.addEventListener('beforeinstallprompt', handler)

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()

        const { outcome } = await deferredPrompt.userChoice
        console.log(`User response to the install prompt: ${outcome}`)

        setDeferredPrompt(null)
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div className="fixed bottom-20 left-4 z-50 animate-bounce">
            <Button
                onClick={handleInstall}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl flex items-center gap-2 rounded-full px-4 py-3"
            >
                <Download size={18} />
                <span>Install App</span>
            </Button>
        </div>
    )
}
