'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-300 p-8 md:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="mb-8">&larr; Back to Home</Button>
                </Link>

                <h1 className="text-4xl font-bold text-white mb-8">Terms and Conditions</h1>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
                    <p>
                        Welcome to Skill Arena. By accessing our website and using our services, you agree to be bound by these Terms and Conditions.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">2. Usage Rights</h2>
                    <p>
                        Skill Arena is designed for educational purposes. You agree to use the platform responsibly and not to attempt to cheat, hack, or disrupt the learning experience of others.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">3. User Accounts</h2>
                    <p>
                        You are responsible for maintaining the confidentiality of your account credentials. We reserve the right to terminate accounts that violate our community guidelines.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">4. Disclaimer</h2>
                    <p>
                        The services are provided &quot;as is&quot;. We make no warranties regarding the accuracy or completeness of the content.
                    </p>
                </section>

                <div className="pt-8 border-t border-slate-800 text-sm text-slate-500">
                    Last updated: {new Date().toLocaleDateString()}
                </div>
            </div>
        </main>
    )
}
