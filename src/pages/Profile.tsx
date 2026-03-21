import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Map, Phone, Save, Trash2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('routes');
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [mapSettings, setMapSettings] = useState({
    defaultZoom: 12,
    mapStyle: 'dark',
    showTraffic: true
  });

  // New contact form
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  useEffect(() => {
    // Load saved routes
    const routes = localStorage.getItem('savedSafeRoutes');
    if (routes) {
      try {
        setSavedRoutes(JSON.parse(routes));
      } catch (e) {
        console.error("Failed to parse saved routes", e);
      }
    }

    // Load emergency contacts
    const contacts = localStorage.getItem('emergencyContacts');
    if (contacts) {
      try {
        setEmergencyContacts(JSON.parse(contacts));
      } catch (e) {
        console.error("Failed to parse emergency contacts", e);
      }
    }

    // Load map settings
    const settings = localStorage.getItem('mapSettings');
    if (settings) {
      try {
        setMapSettings(JSON.parse(settings));
      } catch (e) {
        console.error("Failed to parse map settings", e);
      }
    }
  }, []);

  const handleDeleteRoute = (id: string) => {
    const updated = savedRoutes.filter(r => r.id !== id);
    setSavedRoutes(updated);
    localStorage.setItem('savedSafeRoutes', JSON.stringify(updated));
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    const newContact = {
      id: Date.now().toString(),
      name: newContactName,
      phone: newContactPhone
    };

    const updated = [...emergencyContacts, newContact];
    setEmergencyContacts(updated);
    localStorage.setItem('emergencyContacts', JSON.stringify(updated));
    
    setNewContactName('');
    setNewContactPhone('');
  };

  const handleDeleteContact = (id: string) => {
    const updated = emergencyContacts.filter(c => c.id !== id);
    setEmergencyContacts(updated);
    localStorage.setItem('emergencyContacts', JSON.stringify(updated));
  };

  const handleSaveSettings = () => {
    localStorage.setItem('mapSettings', JSON.stringify(mapSettings));
    alert('Map settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">User Profile</span>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sticky top-24">
              <div className="flex items-center gap-4 mb-8 p-2">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                  <User size={24} className="text-zinc-400" />
                </div>
                <div>
                  <div className="font-semibold">My Account</div>
                  <div className="text-xs text-zinc-500">Manage your settings</div>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('routes')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'routes' ? 'bg-red-500/10 text-red-500' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                >
                  <Map size={18} />
                  <span className="font-medium text-sm">Saved Routes</span>
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'contacts' ? 'bg-red-500/10 text-red-500' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                >
                  <Phone size={18} />
                  <span className="font-medium text-sm">Emergency Contacts</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-red-500/10 text-red-500' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                >
                  <Save size={18} />
                  <span className="font-medium text-sm">Map Settings</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'routes' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold">Saved Routes</h2>
                <p className="text-zinc-400 text-sm">Manage your frequently used safe routes.</p>
                
                {savedRoutes.length === 0 ? (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center">
                    <Map size={32} className="mx-auto text-zinc-600 mb-4" />
                    <div className="text-zinc-400">No saved routes yet.</div>
                    <div className="text-sm text-zinc-500 mt-2">Save a route from the Safe Route planner.</div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {savedRoutes.map(route => (
                      <div key={route.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group">
                        <div>
                          <div className="font-semibold text-lg">{route.name}</div>
                          <div className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
                            <span>{route.origin?.name}</span>
                            <span className="text-zinc-600">→</span>
                            <span>{route.destination?.name}</span>
                          </div>
                          <div className="text-xs text-zinc-500 mt-2 flex gap-3">
                            <span>ETA: {route.eta}</span>
                            <span>Distance: {route.distance}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={`/safe-route?originLat=${route.origin?.lat}&originLng=${route.origin?.lng}&originName=${encodeURIComponent(route.origin?.name)}&destLat=${route.destination?.lat}&destLng=${route.destination?.lng}&destName=${encodeURIComponent(route.destination?.name)}`} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors">
                            Load
                          </Link>
                          <button onClick={() => handleDeleteRoute(route.id)} className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'contacts' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold">Emergency Contacts</h2>
                <p className="text-zinc-400 text-sm">Add contacts to quickly notify them in case of an emergency.</p>
                
                <form onSubmit={handleAddContact} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-6">
                  <h3 className="text-sm font-semibold mb-4">Add New Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Name</label>
                      <input 
                        type="text" 
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors"
                        placeholder="e.g. John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors"
                        placeholder="e.g. +1 234 567 8900"
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                    Add Contact
                  </button>
                </form>

                {emergencyContacts.length === 0 ? (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center">
                    <Phone size={32} className="mx-auto text-zinc-600 mb-4" />
                    <div className="text-zinc-400">No emergency contacts saved.</div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {emergencyContacts.map(contact => (
                      <div key={contact.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400">
                            <User size={18} />
                          </div>
                          <div>
                            <div className="font-semibold">{contact.name}</div>
                            <div className="text-sm text-zinc-400">{contact.phone}</div>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteContact(contact.id)} className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold">Map Settings</h2>
                <p className="text-zinc-400 text-sm">Customize your map preferences.</p>
                
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Zoom Level ({mapSettings.defaultZoom})</label>
                    <input 
                      type="range" 
                      min="5" 
                      max="18" 
                      value={mapSettings.defaultZoom}
                      onChange={(e) => setMapSettings({...mapSettings, defaultZoom: parseInt(e.target.value)})}
                      className="w-full accent-red-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                      <span>World</span>
                      <span>City</span>
                      <span>Street</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Map Style</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setMapSettings({...mapSettings, mapStyle: 'dark'})}
                        className={`p-4 rounded-xl border text-left transition-colors ${mapSettings.mapStyle === 'dark' ? 'bg-zinc-900 border-red-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                      >
                        <div className="font-medium mb-1">Dark Mode</div>
                        <div className="text-xs text-zinc-500">Optimized for low-light environments</div>
                      </button>
                      <button 
                        onClick={() => setMapSettings({...mapSettings, mapStyle: 'light'})}
                        className={`p-4 rounded-xl border text-left transition-colors ${mapSettings.mapStyle === 'light' ? 'bg-zinc-900 border-red-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                      >
                        <div className="font-medium mb-1">Light Mode</div>
                        <div className="text-xs text-zinc-500">Standard high-contrast map</div>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-zinc-800">
                    <div>
                      <div className="font-medium">Show Traffic by Default</div>
                      <div className="text-xs text-zinc-500">Enable live traffic layer automatically</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={mapSettings.showTraffic}
                        onChange={(e) => setMapSettings({...mapSettings, showTraffic: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  <div className="pt-4">
                    <button onClick={handleSaveSettings} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors w-full">
                      Save Settings
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
