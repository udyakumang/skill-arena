'use client'

import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-900/50 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Science-Backed Learning</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We don&apos;t just throw math problems at you. We monitor your cognitive load, frustration, and flow state to keep you in the sweet spot.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Adaptive Difficulty", desc: "The AI adjusts problem complexity in real-time based on your speed and confidence.", icon: "📈" },
              { title: "Flow State Detection", desc: "We detect when you&apos;re struggling or bored and adjust the pace instantly.", icon: "🧠" },
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

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-950 scroll-mt-20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Enter The Flow State</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Our unique loop is designed to get you addicted to learning, not scrolling.</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              { step: "01", title: "Daily Quest", desc: "Log in for your 15-minute daily brain workout. Warmup -> Core -> Challenge." },
              { step: "02", title: "Adaptive Practice", desc: "As you answer, the arena changes. Too easy? We add constraints. Too hard? We provide hints." },
              { step: "03", title: "Climb the Ladder", desc: "Earn skill points (SP) and rank up from 'Novice' to 'Grandmaster' in the global league." }
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-6 p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-pink-500 opacity-50">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{s.title}</h3>
                  <p className="text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section (Hidden for now) */}
      {/* <section id="pricing" className="py-24 bg-indigo-950/20 scroll-mt-20">
          <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Start For Free</h2>
              <p className="text-slate-400 mb-12">Upgrade only when you&apos;re ready to compete professionally.</p>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <div className="glass p-8 rounded-3xl border border-slate-700 text-left">
                      <div className="text-2xl font-bold mb-2">Novice</div>
                      <div className="text-5xl font-bold mb-6">$0<span className="text-base font-normal text-slate-400">/mo</span></div>
                      <ul className="space-y-3 mb-8 text-slate-300">
                          <li>✅ Daily Quests</li>
                          <li>✅ Basic Progress Tracking</li>
                          <li>✅ Community Leaderboard</li>
                      </ul>
                      <button className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold transition">Get Started</button>
                  </div>

                  <div className="glass p-8 rounded-3xl border border-indigo-500/50 bg-indigo-900/10 text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-indigo-500 text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                      <div className="text-2xl font-bold mb-2 text-indigo-300">Grandmaster</div>
                      <div className="text-5xl font-bold mb-6">$9<span className="text-base font-normal text-slate-400">/mo</span></div>
                       <ul className="space-y-3 mb-8 text-slate-300">
                          <li>✅ All Novice Features</li>
                          <li>✅ Unlimited Ghost Battles</li>
                          <li>✅ Advanced Analytics & Weakness Detection</li>
                          <li>✅ Priority Support</li>
                      </ul>
                      <button className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold transition shadow-lg shadow-indigo-500/25">Join the Elite</button>
                  </div>
              </div>
          </div>
      </section> */}
    </main>
  )
}
