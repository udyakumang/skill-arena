'use client'

import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      <Navbar />
      <Hero />

      {/* Features Section (Inline for now) */}
      <section id="features" className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Science-Backed Learning</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We don&apos;t just throw math problems at you. We monitor your cognitive load, frustration, and flow state to keep you in the sweet spot.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Adaptive Difficulty", desc: "The AI adjusts problem complexity in real-time based on your speed and confidence.", icon: "📈" },
              { title: "Flow State Detection", desc: "We detect when you're struggling or bored and adjust the pace instantly.", icon: "🧠" },
              { title: "Safe Competition", desc: "Compete against 'Ghosts' (simulated opponents) to rank up without toxicity.", icon: "🛡️" }
            ].map((f, i) => (
              <div key={i} className="glass p-8 rounded-2xl hover:bg-slate-800/80 transition-colors">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
