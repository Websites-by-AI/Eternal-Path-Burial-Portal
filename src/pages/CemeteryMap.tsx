import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { MapPin, Search, ChevronRight, X, Info, Footprints, Calendar, Navigation } from 'lucide-react';
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

  const allBlocks = Array.from(new Set(graves.map(g => g.block))).filter(Boolean).sort();
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  const filteredGraves = graves.filter(g => {
    const matchesSearch = (g.fullName.includes(searchQuery) || 
                          (g.fatherName && g.fatherName.includes(searchQuery)) ||
                          (g.block && g.block.includes(searchQuery)));
    const matchesBlock = !selectedBlock || g.block === selectedBlock;
    return matchesSearch && matchesBlock;
  });

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
          targetGraveInfo={selectedGrave?.block}
        />

        {/* Floating Quick Stats - Improved */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="bg-emerald-950/80 backdrop-blur-xl text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] font-sans">SATELLITE ENGINE v4.5</span>
            <div className="h-3 w-px bg-white/20 mx-1" />
            <span className="text-[10px] font-bold text-emerald-300 font-sans uppercase">Zanjan | live</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Graves Sidebar List & Details */}
      <div className="w-full md:w-[420px] bg-[#f8faf9] flex flex-col h-full border-r border-stone-200 shrink-0 shadow-2xl z-20">
        
        {/* Sidebar Header & Search Filter */}
        <div className="p-6 md:p-8 space-y-6 text-right bg-white border-b border-stone-100 shadow-sm">
          <div>
            <h3 className="text-xl font-black text-stone-900 tracking-tight">جستجوی هوشمند مزارات</h3>
            <p className="text-[11px] text-emerald-600 font-black uppercase tracking-widest mt-1">سامانه متمرکز بهشت زهرای زنجان</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text"
                placeholder="جستجو نام متوفی یا بازماندگان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-sm font-bold text-stone-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-right pl-12 shadow-inner"
              />
              <Search className="w-5 h-5 text-stone-300 absolute left-4 top-4 pointer-events-none" />
            </div>

            {/* Block Quick Filters */}
            <div className="flex flex-row-reverse gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedBlock(null)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black transition-all border ${!selectedBlock ? 'bg-emerald-900 text-white border-emerald-900 shadow-lg' : 'bg-white text-stone-500 border-stone-200 hover:border-emerald-200'}`}
              >
                همه قطعات
              </button>
              {allBlocks.map(block => (
                <button
                  key={block}
                  onClick={() => setSelectedBlock(block)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black transition-all border ${selectedBlock === block ? 'bg-emerald-900 text-white border-emerald-900 shadow-lg' : 'bg-white text-stone-500 border-stone-200 hover:border-emerald-200'}`}
                >
                  قطعه {block}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List of Graves OR Selected Grave details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="wait">
            {selectedGrave ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Back Link */}
                <button 
                  onClick={() => setSelectedGrave(null)}
                  className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors font-black text-[10px] flex-row-reverse"
                >
                  <ChevronRight className="w-4 h-4 rotate-0" />
                  <span>بازگشت به لیست مزارات</span>
                </button>

                {/* Grave Info Card - Improved aesthetics */}
                <div className="bg-white border border-stone-200 rounded-[2rem] overflow-hidden shadow-2xl relative">
                  {/* Portrait Section */}
                  <div className="aspect-[4/5] relative bg-stone-100 group">
                    <GravestonePortrait 
                      fullName={selectedGrave.fullName}
                      fatherName={selectedGrave.fatherName}
                      birthDate={selectedGrave.birthDate}
                      deathDate={selectedGrave.deathDate}
                      inscription={selectedGrave.inscription}
                      photoUrl={selectedGrave.photoUrl}
                      className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-6 right-6 text-right text-white">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">متوفی شناسایی شده</p>
                      <h4 className="text-2xl font-black">{selectedGrave.fullName}</h4>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="p-8 text-right space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 font-black block">فرزند</span>
                        <p className="font-bold text-stone-900 text-sm">{selectedGrave.fatherName || 'نامشخص'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 font-black block">کد سیستمی</span>
                        <p className="font-mono text-stone-900 text-sm font-bold">#{selectedGrave.id.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 grid grid-cols-2 gap-6 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 bg-stone-200" />
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-stone-400 font-black block flex items-center justify-end gap-1 flex-row-reverse">
                          <MapPin className="w-3 h-3" />
                          قطعه
                        </span>
                        <p className="font-black text-emerald-950 text-lg">{selectedGrave.block || 'عمومی'}</p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-stone-400 font-black block flex items-center justify-end gap-1 flex-row-reverse">
                          <Footprints className="w-3 h-3" />
                          ردیف
                        </span>
                        <p className="font-black text-emerald-950 text-lg">{selectedGrave.row || '--'} - {selectedGrave.number || '--'}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3 pt-2">
                       <Link 
                        to={`/grave/${selectedGrave.id}`}
                        className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-black uppercase rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-stone-900/10"
                      >
                        <Info className="w-4 h-4" />
                        <span>ورود به پرونده کامل</span>
                      </Link>
                      
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100/50 flex items-center justify-center gap-2 flex-row-reverse text-emerald-700">
                        <Navigation className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black italic">موقعیت مزار روی نقشه پین شده است</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex justify-between items-center px-2 pb-2 flex-row-reverse">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">مزارات (نمایش {filteredGraves.length} مورد)</span>
                  {selectedBlock && (
                     <span className="text-[9px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded font-bold">فیلتر شده: قطعه {selectedBlock}</span>
                  )}
                </div>

                <div className="space-y-2">
                  {filteredGraves.map((grave) => (
                    <button
                      key={grave.id}
                      onClick={() => setSelectedGrave(grave)}
                      className="group w-full p-5 bg-white hover:bg-emerald-50/30 border border-stone-200 hover:border-emerald-200 rounded-3xl text-right transition-all flex items-center justify-between flex-row-reverse text-stone-800 shadow-sm hover:shadow-md"
                    >
                      <div className="space-y-1">
                        <p className="font-black text-[15px] group-hover:text-emerald-900 transition-colors">{grave.fullName}</p>
                        <div className="flex items-center gap-2 justify-end text-[10px] text-stone-400 font-bold">
                          <span>قطعه {grave.block || '...'}</span>
                          <span className="w-1 h-1 bg-stone-300 rounded-full" />
                          <span>فرزند {grave.fatherName || '...'}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-stone-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-emerald-600 rotate-180" />
                      </div>
                    </button>
                  ))}
                </div>

                {filteredGraves.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-stone-200">
                    <Search className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                    <p className="text-xs text-stone-400 font-black">موردی با این مشخصات یافت نشد.</p>
                    <button 
                      onClick={() => { setSearchQuery(''); setSelectedBlock(null); }}
                      className="mt-4 text-[10px] font-black text-emerald-600 hover:underline"
                    >
                      حذف تمام فیلترها
                    </button>
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
