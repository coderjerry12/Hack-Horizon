import { motion } from "framer-motion";
import { ArrowRight, ShieldPlus, Heartbeat, Brain } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-[#fdfbf7] text-zinc-950 font-sans selection:bg-zinc-200">
      <nav className="fixed top-0 left-0 w-full z-50 p-6">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center bg-white/50 backdrop-blur-xl border border-black/5 rounded-full px-6 py-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="text-xl font-bold tracking-tighter">HackHorizon</div>
          <button 
            onClick={() => navigate("/login")}
            className="group relative px-6 py-2.5 rounded-full bg-zinc-950 text-white font-medium text-sm tracking-wide active:scale-[0.98] transition-transform flex items-center gap-2 overflow-hidden"
          >
            <span>Log In</span>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-1 group-hover:-translate-y-[1px]">
              <ArrowRight weight="bold" className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 pt-40 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="lg:col-span-7 flex flex-col gap-8 pr-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-zinc-100 border border-zinc-200 w-max">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">Next-Gen Medical AI</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-zinc-950">
            Emergency Care, <br />
            <span className="text-zinc-400">Re-engineered.</span>
          </h1>
          
          <p className="text-lg text-zinc-500 leading-relaxed max-w-[50ch]">
            HackHorizon integrates Gemini and Ollama visual models to analyze medical details instantly via camera. One tap SOS. Immediate intelligence.
          </p>

          <button 
            onClick={() => navigate("/login")}
            className="group mt-4 px-8 py-4 rounded-full bg-zinc-950 text-white font-medium text-base tracking-wide active:scale-[0.98] transition-transform w-max flex items-center gap-3 shadow-2xl shadow-zinc-950/20"
          >
            <span>Get Started</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-1 group-hover:-translate-y-[1px]">
              <ArrowRight weight="bold" className="w-4 h-4" />
            </div>
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
          className="lg:col-span-5 grid grid-cols-1 gap-6 mt-12 lg:mt-0"
        >
          {/* Feature Bento 1 */}
          <div className="bg-white rounded-[2rem] p-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-zinc-200/50 group hover:-translate-y-1 transition-transform duration-500">
            <div className="bg-zinc-50 rounded-[calc(2rem-0.5rem)] p-8 h-full flex flex-col gap-6">
              <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center text-white">
                <Brain weight="duotone" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight mb-2">Dual Core Intelligence</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">Toggle instantly between high-parameter Gemini analysis and local, private Ollama LLMs for instant medical reporting.</p>
              </div>
            </div>
          </div>

          {/* Feature Bento 2 */}
          <div className="bg-white rounded-[2rem] p-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-zinc-200/50 group hover:-translate-y-1 transition-transform duration-500">
            <div className="bg-emerald-50 rounded-[calc(2rem-0.5rem)] p-8 h-full flex flex-col gap-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                <ShieldPlus weight="fill" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-emerald-950 mb-2">One-Tap SOS</h3>
                <p className="text-sm text-emerald-800/80 leading-relaxed">Instantly alert emergency contacts with your medical baseline data—blood group, conditions, and live location.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
