import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, MapPin, ShieldAlert, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SOS() {
  const [sosActive, setSosActive] = useState(false);
  const navigate = useNavigate();

  const handleSOS = () => {
    setSosActive(true);
    // In a real app, this would trigger geolocation, find nearest hospital, and send alerts
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-zinc-400 hover:text-white flex items-center gap-2"
      >
        &larr; Back to Home
      </button>

      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Public SOS</h1>
          <p className="text-zinc-400">Tap the button below in case of an emergency</p>
        </div>

        <div className="relative flex items-center justify-center py-12">
          {sosActive && (
            <>
              <motion.div 
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute w-48 h-48 bg-red-500 rounded-full"
              />
              <motion.div 
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                className="absolute w-48 h-48 bg-red-500 rounded-full"
              />
            </>
          )}
          
          <button 
            onClick={handleSOS}
            className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all ${
              sosActive 
                ? 'bg-red-600 text-white shadow-[0_0_50px_rgba(239,68,68,0.8)]' 
                : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]'
            }`}
          >
            <ShieldAlert size={48} />
            <span className="text-2xl font-bold tracking-widest">SOS</span>
          </button>
        </div>

        {sosActive && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 space-y-4 text-left"
          >
            <div className="flex items-center gap-3 text-red-400 font-medium">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Emergency Alert Broadcasted
            </div>
            
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <h3 className="text-sm text-zinc-400 uppercase tracking-wider">Nearest Help</h3>
              
              <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-full text-blue-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-medium">City General Hospital</p>
                    <p className="text-xs text-zinc-400">1.2 km away • 4 mins</p>
                  </div>
                </div>
                <button className="text-blue-400 hover:text-blue-300 p-2">
                  <Navigation size={20} />
                </button>
              </div>

              <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-full text-green-400">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Emergency Services</p>
                    <p className="text-xs text-zinc-400">Ambulance dispatched</p>
                  </div>
                </div>
                <button className="text-green-400 hover:text-green-300 p-2">
                  Call
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
