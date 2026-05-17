import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Target, Activity, Users, Shield, Zap, CheckCircle, BarChart3, Workflow } from 'lucide-react';


// Reusable animated feature card
const FeatureCard = ({ icon: Icon, title, desc }) => (
  <motion.div 
    whileHover={{ scale: 1.05, translateY: -5 }}
    className="bg-[#0f213d]/50 backdrop-blur-md border border-[#1e3a5f] p-8 rounded-2xl shadow-[0_0_15px_rgba(79,70,229,0.1)] hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] transition-shadow duration-300 relative overflow-hidden group"
  >
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4F46E5] to-[#FFC107] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    <div className="w-14 h-14 rounded-full bg-[#1e3a5f] flex items-center justify-center mb-6 text-[#FFC107]">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400">{desc}</p>
  </motion.div>
);

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  return (
    <div className="min-h-screen bg-[#071426] text-white selection:bg-[#4F46E5] selection:text-white overflow-hidden font-sans">
      {/* Background Particles/Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-[#4F46E5] opacity-20 blur-[100px]"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#071426]/70 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/src/assets/logo_full.png" alt="Zenthra" className="h-16 object-contain mix-blend-lighten" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Sign In</Link>
            <Link to="/login" className="bg-[#4F46E5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all hover:scale-105 flex items-center gap-2">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center min-h-[90vh]">
          <div className="w-full lg:w-1/2 flex flex-col gap-8 z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e3a5f] border border-[#2d5284] text-[#38BDF8] text-xs font-semibold mb-6 tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse"></span>
                ATOMBERG ENTERPRISE PLATFORM
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6">
                Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#FFC107]">Atomberg</span> Teams Align & Achieve.
              </h1>
              <p className="text-lg lg:text-xl text-gray-400 max-w-xl leading-relaxed">
                An intelligent enterprise platform built to streamline employee goal alignment, quarterly performance tracking, and workforce growth through a unified digital ecosystem.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link to="/login" className="bg-gradient-to-r from-[#4F46E5] to-[#6366f1] hover:from-[#4338ca] hover:to-[#4F46E5] text-white px-8 py-4 rounded-full font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:scale-105 flex items-center gap-2 group">
                Explore Dashboard
                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
            </motion.div>
          </div>

          {/* Hero Right Graphic - Corporate Working People Animation */}
          <div className="w-full lg:w-1/2 h-[500px] lg:h-[600px] relative mt-16 lg:mt-0 flex items-center justify-center">
            <motion.div
              animate={{ y: [-15, 15, -15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full max-w-lg"
            >
              <div className="absolute inset-0 bg-[#4F46E5] opacity-20 blur-[80px] rounded-full"></div>
              
              <img 
                src="/hero_working.png" 
                alt="Atomberg Teams Working" 
                className="relative z-10 w-full h-auto object-cover rounded-3xl shadow-[0_0_40px_rgba(79,70,229,0.3)] border border-[#1e3a5f]"
              />

              {/* Floating UI Cards */}
              <motion.div 
                animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -top-6 -left-6 z-20 bg-[#0f213d]/90 backdrop-blur-md border border-[#1e3a5f] p-4 rounded-2xl shadow-xl flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center"><Activity size={20} /></div>
                <div>
                  <p className="text-xs text-gray-400">Team Alignment</p>
                  <p className="text-sm font-bold text-white">98% On Track</p>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0], x: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -bottom-8 -right-6 z-20 bg-[#0f213d]/90 backdrop-blur-md border border-[#1e3a5f] p-4 rounded-2xl shadow-xl flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#FFC107]/20 text-[#FFC107] flex items-center justify-center"><BarChart3 size={20} /></div>
                <div>
                  <p className="text-xs text-gray-400">Q3 Performance</p>
                  <p className="text-sm font-bold text-white">+24% Growth</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl lg:text-5xl font-bold mb-4">Built for High-Performance</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">Empower managers to track progress, and HR to monitor organization-wide performance with intelligent analytics.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard icon={Target} title="Goal Management" desc="Set, track, and align individual goals with Atomberg's strategic vision using intuitive dynamic interfaces." />
              <FeatureCard icon={Activity} title="Quarterly Check-ins" desc="Automated windows for performance reviews, preventing updates outside active periods." />
              <FeatureCard icon={BarChart3} title="Analytics Dashboard" desc="Enterprise-grade analytics with Recharts, offering deep insights into team performance." />
              <FeatureCard icon={Zap} title="Escalation Engine" desc="Node-cron powered automated escalation chain ensuring timely submissions and approvals." />
              <FeatureCard icon={Workflow} title="Approval Workflows" desc="Seamless employee-to-manager submission with inline editing and state locking." />
              <FeatureCard icon={Shield} title="Audit Logs" desc="Track every critical action with detailed logs of who changed what, and when." />
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="py-24 bg-[#0a1930] relative px-6 border-t border-b border-white/5">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl lg:text-5xl font-bold mb-16">Seamless Intelligent Workflow</h2>
            
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
              <motion.div whileHover={{ scale: 1.05 }} className="w-64 p-8 rounded-2xl bg-[#071426] border border-[#1e3a5f] relative z-10">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4"><Users size={32} /></div>
                <h3 className="text-xl font-bold mb-2">1. Employee</h3>
                <p className="text-sm text-gray-400">Creates & submits goals, updates quarterly achievements.</p>
              </motion.div>
              
              <div className="hidden lg:block w-24 h-1 bg-gradient-to-r from-blue-500 to-yellow-500 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-500 rotate-45"></div>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} className="w-64 p-8 rounded-2xl bg-[#071426] border border-[#1e3a5f] relative z-10">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
                <h3 className="text-xl font-bold mb-2">2. Manager</h3>
                <p className="text-sm text-gray-400">Reviews, edits targets inline, approves and locks goals.</p>
              </motion.div>

              <div className="hidden lg:block w-24 h-1 bg-gradient-to-r from-yellow-500 to-purple-500 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 rotate-45"></div>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} className="w-64 p-8 rounded-2xl bg-[#071426] border border-[#1e3a5f] relative z-10">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4"><BarChart3 size={32} /></div>
                <h3 className="text-xl font-bold mb-2">3. HR / Admin</h3>
                <p className="text-sm text-gray-400">Monitors completion, unlocks goals, views org analytics.</p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e3a5f] bg-[#071426] pt-16 pb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#4F46E5] to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/src/assets/logo_full.png" alt="Zenthra" className="h-12 object-contain mix-blend-lighten opacity-80" />
            </div>
            <p className="text-gray-400 max-w-sm mb-6">Intelligent Goal Setting & Performance Tracking built specifically for Atomberg's enterprise needs.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4 text-white">Platform</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-[#FFC107] transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-[#FFC107] transition-colors">Analytics</a></li>
              <li><a href="#" className="hover:text-[#FFC107] transition-colors">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4 text-white">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-[#FFC107] transition-colors">Atomberg Intranet</a></li>
              <li><a href="#" className="hover:text-[#FFC107] transition-colors">HR Support</a></li>
              <li><a href="#" className="hover:text-[#FFC107] transition-colors">Contact IT</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm pt-8 border-t border-white/5">
          &copy; {new Date().getFullYear()} Zenthra for Atomberg. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
