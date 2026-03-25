import React from 'react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Activity, Navigation, Clock, MapPin, Zap, ChevronRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30 selection:text-white font-sans relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Hero Section */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden min-h-screen">
        <div className="relative z-10 w-full mx-auto max-w-5xl px-4">
          <main className="relative py-20 flex flex-col items-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="mb-6 text-white text-center text-6xl md:text-8xl font-black tracking-tight"
            >
              SafeRoute <span className="text-[#FF2A2A]">AI</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="text-zinc-300 px-6 text-center text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              Intelligent emergency route optimization platform. Reducing response times with AI-based congestion prediction and real-time traffic intelligence.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8"
            >
              <button 
                className="bg-[#E5E7EB] hover:bg-white text-black rounded-full px-8 py-4 text-base font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
                onClick={() => navigate('/login')}
              >
                Launch Dashboard
              </button>
              <button 
                className="text-zinc-400 hover:text-white transition-colors px-6 py-4 text-base"
                onClick={() => navigate('/sos')}
              >
                Public SOS Mode
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
              className="flex justify-center mb-16"
            >
              <button 
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white rounded-full px-6 py-3 text-sm font-medium transition-all"
                onClick={() => navigate('/safe-route')}
              >
                <MapPin size={16} className="text-blue-400" />
                Find your safe Route
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
              className="flex items-center justify-center gap-2 bg-[#0A1A10] px-5 py-2.5 rounded-full border border-[#1A3A20]"
            >
              <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00FF66] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00FF66]"></span>
              </span>
              <p className="text-sm text-[#00FF66] font-medium tracking-wide">System Online & Monitoring</p>
            </motion.div>
          </main>
        </div>
      </div>

      {/* Features Section with Scroll Animation */}
      <div className="flex flex-col overflow-hidden pb-[100px] pt-[50px] bg-black">
        <ContainerScroll
          titleComponent={
            <>
              <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 tracking-tight">
                Real-time Intelligence for <br />
                <span className="text-5xl md:text-[6rem] font-bold mt-2 leading-none text-[#FF2A2A]">
                  Critical Moments
                </span>
              </h2>
            </>
          }
        >
          <img
            src="https://images.unsplash.com/photo-1506501139174-099022df5260?q=80&w=3840&auto=format&fit=crop"
            alt="Red Traffic Light"
            className="mx-auto rounded-2xl object-cover h-full object-center w-full"
            draggable={false}
          />
        </ContainerScroll>
      </div>

      {/* Project References / UI Elements Section */}
      <div className="py-24 bg-zinc-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Capabilities</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Our platform integrates multiple data streams to provide the fastest, safest routes for emergency responders.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-black border border-white/10 rounded-2xl p-8 hover:border-red-500/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-red-500/20"></div>
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform relative z-10">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 relative z-10">Live Traffic Prediction</h3>
              <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                AI models analyze historical and real-time traffic data to predict congestion before it happens, ensuring emergency vehicles avoid bottlenecks.
              </p>
              <div className="mt-6 rounded-lg overflow-hidden border border-white/10 relative z-10">
                <img src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800&auto=format&fit=crop" alt="Traffic" className="w-full h-32 object-cover opacity-70 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-black border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20"></div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform relative z-10">
                <Navigation size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 relative z-10">Dynamic Rerouting</h3>
              <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                Instantly recalculates routes if new obstacles or accidents are reported, keeping the ETA as low as possible during transit.
              </p>
              <div className="mt-6 rounded-lg overflow-hidden border border-white/10 relative z-10">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop" alt="Navigation" className="w-full h-32 object-cover opacity-70 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-black border border-white/10 rounded-2xl p-8 hover:border-green-500/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-500/20"></div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform relative z-10">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 relative z-10">Public SOS Integration</h3>
              <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                Direct connection between public emergency requests and the nearest available response units, minimizing dispatch delays.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-black border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-purple-500/20"></div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform relative z-10">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 relative z-10">Facility Finder</h3>
              <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                Automatically identifies and filters hospitals, clinics, pharmacies, and police stations along your safe route.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-black border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-cyan-500/20"></div>
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500 mb-6 group-hover:scale-110 transition-transform relative z-10">
                <Navigation size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 relative z-10">Live Location Tracking</h3>
              <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                Tracks your live GPS location and monitors emergency fleet vehicles in real-time for ultimate situational awareness.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-black border border-white/10 rounded-2xl p-8 hover:border-yellow-500/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-yellow-500/20"></div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 mb-6 group-hover:scale-110 transition-transform relative z-10">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3 relative z-10">User Profiles & Settings</h3>
              <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                Save your preferred routes, manage emergency contacts, and customize your map settings for a personalized experience.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24 bg-black border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,42,42,0.05)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-8 rounded-2xl bg-zinc-950 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex justify-center mb-4 text-red-500"><Clock size={32} /></div>
              <div className="text-5xl font-bold text-white mb-2">20%</div>
              <div className="text-zinc-400 font-medium">Average ETA Reduction</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 rounded-2xl bg-zinc-950 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex justify-center mb-4 text-blue-500"><Zap size={32} /></div>
              <div className="text-5xl font-bold text-white mb-2">&lt;2s</div>
              <div className="text-zinc-400 font-medium">Route Recalculation Latency</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-8 rounded-2xl bg-zinc-950 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex justify-center mb-4 text-green-500"><MapPin size={32} /></div>
              <div className="text-5xl font-bold text-white mb-2">95%</div>
              <div className="text-zinc-400 font-medium">Alert Delivery Success</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-[#FF2A2A]" size={24} />
              <span className="text-xl font-bold tracking-tight">SafeRoute <span className="text-[#FF2A2A]">AI</span></span>
            </div>
            
            <div className="flex gap-8 text-sm text-zinc-400">
              <a href="#" className="hover:text-white transition-colors">Platform</a>
              <a href="#" className="hover:text-white transition-colors">Solutions</a>
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
            </div>
            
            <div className="text-sm text-zinc-500">
              &copy; {new Date().getFullYear()} SafeRoute AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
