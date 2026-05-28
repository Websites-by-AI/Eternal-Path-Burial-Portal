import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { MapPin, Search, ChevronRight, X, Info, Footprints, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { fallbackZanjanGraves } from '../lib/fallbackData';
import OfflineCemeteryMap, { MapMarker } from '../components/OfflineCemeteryMap';
import GravestonePortrait from '../components/GravestonePortrait';

export default function CemeteryMap() {
  const [graves, setGraves] = useState<any[]>([]);
  const [selectedGrave, setSelectedGrave] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGraves();
  }, []);

  const fetchGraves = async () => {
    try {
      const q = query(collection(db, 'graves'), limit(100));
      
      // Fast race to prevent intranet hangs if Firestore attempts to connect to unreachable cloud servers
      const fetchPromise = getDocs(q);
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 600)
      );
      
      const snap = await Promise.race([fetchPromise, timeoutPromise]);
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (docs.length === 0) {
        setGraves(fallbackZanjanGraves);
      } else {
        setGraves(docs);
      }
    } catch (e) {
      console.warn("Could not load map graves from Firestore under offline check, using offline-ready Zanjan dataset:", e);
      setGraves(fallbackZanjanGraves);
    }
  };

  const mapMarkers: MapMarker[] = graves.map(g => ({
    id: g.id,
    fullName: g.fullName,
    location: g.location,
    block: g.block,
    row: g.row,
    number: g.number
  }));

  const filteredGraves = graves.filter(g => 
    g.fullName.includes(searchQuery) || 
    (g.fatherName && g.fatherName.includes(searchQuery)) ||
    (g.block && g.block.includes(searchQuery))
  );

  return (
    <div className="h-[calc(100vh-64px)] relative flex flex-col md:flex-row-reverse overflow-hidden">
      
      {/* 1. Main Interactive Offline Vector Map View */}
      <div className="flex-1 h-full relative border-l border-stone-200">
        <OfflineCemeteryMap 
          markers={mapMarkers}
          selectedMarkerId={selectedGrave?.id}
          onMarkerClick={(marker) => {
            const found = graves.find(g => g.id === marker.id);
            if (found) setSelectedGrave(found);
          }}
          graveLocation={selectedGrave?.location}
          targetGraveName={selectedGrave?.fullName}
        />

        {/* Floating Quick Stats */}
        <div className="absolute top-4 left-4 bg-emerald-900/90 backdrop-blur-md text-white py-2.5 px-5 rounded-xl shadow-2xl flex items-center gap-3 text-[11px] font-mono tracking-widest font-black border border-white/10 z-10 transition-all hover:scale-105">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>ZANJAN HIGH-RES SATELLITE ENGINE</span>
        </div>
      </div>

      {/* 2. Interactive Graves Sidebar List & Details */}
      <div className="w-full md:w-96 bg-white flex flex-col h-full border-r border-stone-200 shrink-0">
        
        {/* Sidebar Header & Search Filter */}
        <div className="p-8 border-b border-emerald-50 flex flex-col gap-6 text-right bg-gradient-to-br from-emerald-50/50 to-transparent">
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest text-emerald-900 leading-tight">ناوبری و نقشه مزارات</h3>
            <p className="text-[11px] text-emerald-600 font-black uppercase tracking-widest leading-relaxed mt-1">نسخه ۴.۰ | تصاویر ماهواره‌ای Esri</p>
          </div>
          
          <div className="relative">
            <input 
              type="text"
              placeholder="نام متوفی..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-right pl-10 shadow-sm"
            />
            <Search className="w-5 h-5 text-emerald-300 absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* List of Graves OR Selected Grave details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence mode="wait">
            {selectedGrave ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-stone-50 border border-stone-200 rounded p-5 space-y-4 text-right relative"
              >
                {/* Close Button to return to list */}
                <button 
                  onClick={() => setSelectedGrave(null)}
                  className="absolute top-4 left-4 p-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-400 hover:text-stone-800 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <span className="text-[9px] font-mono font-bold text-stone-400 block">مشخصات مزار نشان شده</span>
                
                {/* gravestone portrait with automatic offline fallback */}
                <div className="aspect-[4/3] w-full rounded overflow-hidden shadow-md border border-stone-200">
                  <GravestonePortrait 
                    fullName={selectedGrave.fullName}
                    fatherName={selectedGrave.fatherName}
                    birthDate={selectedGrave.birthDate}
                    deathDate={selectedGrave.deathDate}
                    inscription={selectedGrave.inscription}
                    photoUrl={selectedGrave.photoUrl}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <h4 className="text-xl font-bold text-stone-900 leading-tight">{selectedGrave.fullName}</h4>
                  <p className="text-xs text-stone-500 font-medium">فرزند: {selectedGrave.fatherName || 'نامشخص'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-stone-100 pt-4">
                  <div className="bg-white p-2.5 rounded border border-stone-100">
                    <span className="text-[9px] text-stone-400 font-bold block">بلوک/قطعه</span>
                    <span className="font-bold text-stone-700">{selectedGrave.block || 'قطعه عمومی'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-stone-100">
                    <span className="text-[9px] text-stone-400 font-bold block">ردیف/مزار</span>
                    <span className="font-bold text-stone-700">{selectedGrave.row || 'نامشخص'} • {selectedGrave.number || 'نامشخص'}</span>
                  </div>
                </div>

                {/* Direct Action Link to Grave Details */}
                <div className="space-y-2 pt-2">
                  <Link 
                    to={`/grave/${selectedGrave.id}`}
                    className="w-full py-3 bg-stone-900 hover:bg-[#1abc9c] text-white text-[10.5px] font-bold uppercase rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center"
                  >
                    <span>ورود به پرونده کامل و مسیریابی ماهواره‌ای</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <div className="px-2 pb-2 text-right">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">مزارات در دسترس ({filteredGraves.length} مورد)</span>
                </div>

                {filteredGraves.map((grave) => (
                  <button
                    key={grave.id}
                    onClick={() => setSelectedGrave(grave)}
                    className="w-full p-4 bg-white hover:bg-stone-50 border border-stone-150 rounded text-right transition-all flex items-center justify-between flex-row-reverse text-stone-800"
                  >
                    <div className="space-y-1">
                      <p className="font-extrabold text-sm">{grave.fullName}</p>
                      <p className="text-[10px] text-stone-400 font-medium">فرزند {grave.fatherName || '...'} | {grave.block || 'قطعه عمومی'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-[#1abc9c]" />
                  </button>
                ))}

                {filteredGraves.length === 0 && (
                  <div className="text-center py-12">
                    <Info className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                    <p className="text-xs text-stone-400 font-medium">موردی یافت نشد.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
