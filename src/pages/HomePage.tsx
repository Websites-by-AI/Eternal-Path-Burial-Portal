import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { Search, Calendar, MapPin, ChevronRight, TrendingUp, History, ExternalLink, Compass, Check, Copy, RefreshCw, Navigation, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { fallbackZanjanGraves } from '../lib/fallbackData';
import OfflineCemeteryMap from '../components/OfflineCemeteryMap';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem('grave_searchTerm') || 'علی');
  const [recentGraves, setRecentGraves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('grave_searchResults') || '[]');
    } catch {
      return [];
    }
  });
  const [isSearching, setIsSearching] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(() => sessionStorage.getItem('grave_errorStatus') || null);

  // Quick Test and Live GPS walking simulation state
  const [selectedSimGrave, setSelectedSimGrave] = useState<any>(fallbackZanjanGraves[0]);
  const [simDistance, setSimDistance] = useState<number>(35);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStatus, setSimulationStatus] = useState<string>("آماده برای شبیه‌سازی مسیر");
  const [simIntervalId, setSimIntervalId] = useState<any>(null);

  // Advanced User GPS Custom and Live Routing State
  const [gpsOriginMode, setGpsOriginMode] = useState<'simulated' | 'real'>('simulated');
  const [customLat, setCustomLat] = useState<number>(36.6710); // Imam Sq Zanjan
  const [customLng, setCustomLng] = useState<number>(48.4890);
  const [isLoadingRealGPS, setIsLoadingRealGPS] = useState<boolean>(false);
  const [realGpsErr, setRealGpsErr] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Filter inside test module state
  const [quickSearchQuery, setQuickSearchQuery] = useState<string>('');
  const [homeMapStyle, setHomeMapStyle] = useState<'historical' | 'satellite'>('historical');

  // Firestore DB Diagnostics state
  const [dbDiagStatus, setDbDiagStatus] = useState<string>("بر روی تست کلیک کنید");
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);

  useEffect(() => {
    fetchRecent();
    return () => {
      if (simIntervalId) clearInterval(simIntervalId);
    };
  }, []);

  // Calculate distance between two coordinates using the Haversine formula
  const getCalculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || isNaN(v))) return 0;
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // in meters
  };

  // Fetch true GPS location of browser for real-world navigation simulation
  const fetchRealGpsOrigin = () => {
    if (!navigator.geolocation) {
      setRealGpsErr("مرورگر شما از امکان‌یابی GPS به صورت بومی پشتیبانی نمی‌کند.");
      return;
    }
    setIsLoadingRealGPS(true);
    setRealGpsErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomLat(pos.coords.latitude);
        setCustomLng(pos.coords.longitude);
        setGpsOriginMode('real');
        setIsLoadingRealGPS(false);
        setSimulationStatus("مکان کاربر به صورت زنده از سنسور GPS دستگاه دریافت شد!");
      },
      (err) => {
        console.warn("Browser GPS fetch failed:", err);
        setRealGpsErr("دسترسی به مکان‌یاب دستگاه تایید نشد. از شبیه‌ساز زنجان استفاده شد.");
        setIsLoadingRealGPS(false);
        setGpsOriginMode('simulated');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Run a quick GPS path-walk simulation
  const startGpsWalkSimulation = (grave: any) => {
    if (simIntervalId) {
      clearInterval(simIntervalId);
    }
    
    setSelectedSimGrave(grave);
    setSimDistance(35);
    setIsSimulating(true);
    setSimulationStatus("سیگنال ماهواره متصل شد. در حال محاسبه نزدیک‌ترین مسیر پیاده...");

    let currentDist = 35;
    const startLat = customLat;
    const startLng = customLng;
    const destLat = grave.location?.lat ?? 36.6580;
    const destLng = grave.location?.lng ?? 48.4840;

    const interval = setInterval(() => {
      const step = Math.floor(Math.random() * 5) + 3;
      currentDist = Math.max(0, currentDist - step);
      setSimDistance(currentDist);

      const ratio = (35 - currentDist) / 35;
      setCustomLat(startLat + (destLat - startLat) * ratio);
      setCustomLng(startLng + (destLng - startLng) * ratio);

      if (currentDist === 0) {
        setSimulationStatus("شما به مقصد رسیده‌اید! بر روی سنگ مزار متخطط حضور دارید.");
        setIsSimulating(false);
        clearInterval(interval);
      } else {
        setSimulationStatus(`مسیریاب زنده: ${Math.floor(currentDist / 4) + 1} گام تا هدف باقی مانده است...`);
      }
    }, 1000);

    setSimIntervalId(interval);
  };

  const runDbQuickCheck = async () => {
    setIsDiagnosing(true);
    setDbDiagStatus("در حال سنجش پاسخ‌دهی سرور فایربیس...");
    try {
      const q = query(collection(db, 'graves'), limit(1));
      const testPromise = getDocs(q);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 1000)
      );
      await Promise.race([testPromise, timeoutPromise]);
      setDbDiagStatus("اتصال آنلاین فایربیس برقرار است ☑️");
    } catch {
      setDbDiagStatus("سرور باود فایربیس آفلاین است. سوئیچ به پایگاه داده آفلاین انجام شد ☑️");
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Update sessionStorage when state changes
  useEffect(() => {
    sessionStorage.setItem('grave_searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    sessionStorage.setItem('grave_searchResults', JSON.stringify(searchResults));
  }, [searchResults]);

  useEffect(() => {
    if (errorStatus) {
      sessionStorage.setItem('grave_errorStatus', errorStatus);
    } else {
      sessionStorage.removeItem('grave_errorStatus');
    }
  }, [errorStatus]);

  const fetchRecent = async () => {
    try {
      const q = query(collection(db, 'graves'), orderBy('createdAt', 'desc'), limit(100));
      
      // Fast race to prevent intranet hangs if Firestore attempts to connect to unreachable cloud servers
      const fetchPromise = getDocs(q);
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 600)
      );
      
      const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (docs.length === 0) {
        setRecentGraves(fallbackZanjanGraves.slice(0, 4));
      } else {
        setRecentGraves(docs.slice(0, 4));
      }
    } catch (error) {
      console.warn("Could not load recent graves from Firestore under offline check, using offline-ready Zanjan dataset:", error);
      setRecentGraves(fallbackZanjanGraves.slice(0, 4));
    } finally {
      setLoading(false);
    }
  };

  const triggerInstaSearch = async (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;
    setSearchTerm(cleanTerm);
    setIsSearching(true);
    setErrorStatus(null);
    
    // 1. Immediately look up locally for real-time instantaneous feedback
    const localFiltered = fallbackZanjanGraves.filter((g: any) => 
      g.fullName.includes(cleanTerm) || 
      (g.fatherName && g.fatherName.includes(cleanTerm))
    );
    
    setSearchResults(localFiltered);
    if (localFiltered.length === 0) {
      setErrorStatus("موردی با این مشخصات یافت نشد.");
    }

    // 2. Perform a fast-timeout race with Firestore to merge live database content if online
    try {
      const fetchPromise = (async () => {
        const q = query(collection(db, 'graves'), limit(100));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      })();

      const timeoutPromise = new Promise<any[]>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 1000)
      );

      const dbAll = await Promise.race([fetchPromise, timeoutPromise]);
      const combined = [...fallbackZanjanGraves];

      // Merge unique entries
      dbAll.forEach((g: any) => {
        if (!combined.some(c => c.id === g.id)) {
          combined.push(g);
        }
      });

      const filtered = combined.filter((g: any) => 
        g.fullName.includes(cleanTerm) || 
        (g.fatherName && g.fatherName.includes(cleanTerm))
      );
      
      setSearchResults(filtered);
      if (filtered.length > 0) {
        setErrorStatus(null);
      } else {
        setErrorStatus("موردی با این مشخصات یافت نشد.");
      }
    } catch (error) {
      console.warn("Firestore search timed out or failed. Bypassed to offline model.");
      // Fallback data is already displayed, so we keep it.
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerInstaSearch(searchTerm);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24"
    >
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[420px] flex items-center justify-center overflow-hidden bg-brand-primary/10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#064e3b]/90 via-[#065f46]/40 to-[#FDFCFB] z-10" />
          <img 
             src="https://images.unsplash.com/photo-1549424606-5b4af79612f0?auto=format&fit=crop&q=80&w=2000" 
             alt="Cemetery" 
             className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
        </div>

        <div className="relative z-20 max-w-4xl w-full px-4 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-block px-4 py-1.5 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-[0.25em] rounded-full mb-6 shadow-xl shadow-emerald-900/20">
              سامانه مرکزی آرامستان‌های زنجان
            </span>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight leading-tight drop-shadow-2xl">
              جستجوی هوشمند <span className="text-emerald-300">مزارات</span> <br />
              <span className="text-stone-200 font-medium text-3xl md:text-5xl mt-2 block">پایگاه جامع بهشت زهرای زنجان</span>
            </h2>
            
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
              <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] h-20 p-1.5 border border-white/50">
                <div className="pr-6">
                  <Search className="w-6 h-6 text-emerald-600" />
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="نام متوفی (مانند حسین منزوی)..."
                  className="w-full h-full bg-transparent px-5 outline-none text-stone-900 text-lg font-bold placeholder:text-stone-300 text-right"
                />
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="bg-emerald-700 text-white h-full px-10 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isSearching ? '...' : 'جستجوی مزار'}
                </button>
              </div>

              {/* Quick Test Chips */}
              <div className="flex flex-row-reverse gap-2 mt-3 justify-start">
                <span className="text-[8px] font-bold text-stone-400 uppercase ml-2 self-center">تست سریع:</span>
                <button 
                  type="button"
                  onClick={() => { triggerInstaSearch('علی'); }}
                  className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[9px] font-bold rounded transition-colors"
                >
                  علی
                </button>
                <button 
                  type="button"
                  onClick={() => { triggerInstaSearch('زهرا'); }}
                  className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[9px] font-bold rounded transition-colors"
                >
                  زهرا
                </button>
                <button 
                  type="button"
                  onClick={() => { triggerInstaSearch('حسین'); }}
                  className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[9px] font-bold rounded transition-colors"
                >
                  حسین
                </button>
                <button 
                  type="button"
                  onClick={() => { triggerInstaSearch('ناموجود'); }}
                  className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-500 text-[9px] font-bold rounded transition-colors"
                >
                  ناموجود
                </button>
              </div>
              
              {errorStatus && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold rounded shadow-sm z-30"
                >
                  {errorStatus}
                </motion.div>
              )}
            </form>
          </motion.div>
        </div>
      </section>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <section className="max-w-7xl mx-auto px-8 py-20">
          <div className="flex items-center justify-between mb-8 border-b border-stone-200 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">نتایج جستجو</h3>
            <button onClick={() => setSearchResults([])} className="text-[10px] font-bold text-stone-400 hover:text-stone-900 transition-colors">پاکسازی</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
            {searchResults.map((grave) => (
              <GraveCard key={grave.id} grave={grave} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Test & Live Routing Hub for Zanjan */}
      <section id="fast-test-hub" className="bg-[#f8faf9] border-y border-emerald-100 py-24 px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-emerald-100 pb-8 mb-12">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                <h3 className="text-xl font-black uppercase tracking-widest text-emerald-900">هسته ناوبری ماهواره‌ای زنجان</h3>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed font-bold">تست هدایت زنده از موقعیت کاربر به سوی مزارات آرامستان زنجان با نقشه‌های باکیفیت Esri و مسیریاب‌های بومی</p>
            </div>
            <div className="flex gap-3 animate-fade-in">
              <button 
                onClick={runDbQuickCheck}
                disabled={isDiagnosing}
                className="px-6 py-4 bg-emerald-950 text-white text-[11px] font-black uppercase rounded-2xl hover:bg-emerald-800 transition-all shadow-2xl shadow-emerald-900/40 disabled:opacity-50 flex items-center gap-3 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
                <span>{isDiagnosing ? "پینگ..." : "سنجش پایداری دیتاسنتر"}</span>
              </button>
              <div className="flex flex-col items-end px-5 py-3 bg-white rounded-2xl border border-emerald-100 shadow-sm select-none">
                <span className="text-[14px] font-mono leading-none text-emerald-700 font-black tracking-widest">SATELLITE v4.5</span>
                <span className="text-[9px] text-stone-400 font-black mt-1 uppercase">Native Intent Engine</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right mb-8">
            
            {/* Column 1: Source Origin Coordinates Controller (3 Cols) */}
            <div className="lg:col-span-3 bg-white border border-stone-200/80 p-5 rounded shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 flex-row-reverse mb-4 border-b border-stone-100 pb-2">
                  <Navigation className="w-4 h-4 text-[#1abc9c]" />
                  <h4 className="font-bold text-xs uppercase tracking-widest text-stone-800">۱. تعیین مبدأ حرکت</h4>
                </div>
                
                <p className="text-[10.5px] text-stone-500 mb-3 leading-relaxed font-semibold">
                  مختصات شروع حرکت را تعیین یا شبیه‌سازی کنید:
                </p>

                <div className="grid grid-cols-1 gap-2 mb-4">
                  <button
                    onClick={() => {
                      setGpsOriginMode('simulated');
                      setCustomLat(36.6710); // Imam Sq
                      setCustomLng(48.4890);
                      setSimulationStatus("مبدأ حرکت به صورت شبیه‌سازی شده روی میدان امام زنجان تنظیم شد.");
                    }}
                    className={`py-2 px-1 text-[10px] font-bold rounded-sm border transition-colors ${gpsOriginMode === 'simulated' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'}`}
                  >
                    شبیه‌ساز (میدان امام زنجان)
                  </button>
                  <button
                    onClick={fetchRealGpsOrigin}
                    disabled={isLoadingRealGPS}
                    className={`py-2 px-1 text-[10px] font-bold rounded-sm border transition-colors flex items-center justify-center gap-1 ${gpsOriginMode === 'real' ? 'bg-[#1abc9c] text-white border-[#1abc9c]' : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'} ${isLoadingRealGPS ? 'opacity-50' : ''}`}
                  >
                    <Compass className={`w-3 h-3 ${isLoadingRealGPS ? 'animate-spin' : ''}`} />
                    <span>موقعیت واقعی زنده (GPS)</span>
                  </button>
                </div>

                {realGpsErr && (
                  <div className="bg-red-50 text-red-600 text-[9px] font-bold p-2.5 rounded border border-red-100 mb-3">
                    {realGpsErr}
                  </div>
                )}

                <div className="space-y-2 bg-stone-50 p-3 rounded border border-stone-100">
                  <div>
                    <label className="text-[9px] text-stone-400 font-bold uppercase block mb-1">lat (شروع):</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={customLat}
                      onChange={(e) => setCustomLat(parseFloat(e.target.value) || 36.6710)}
                      className="w-full bg-white border border-stone-200 px-2.5 py-1 rounded text-xs font-mono font-bold text-stone-800 outline-none focus:border-[#1abc9c]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-stone-400 font-bold uppercase block mb-1">lng (شروع):</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={customLng}
                      onChange={(e) => setCustomLng(parseFloat(e.target.value) || 48.4890)}
                      className="w-full bg-white border border-stone-200 px-2.5 py-1 rounded text-xs font-mono font-bold text-stone-800 outline-none focus:border-[#1abc9c]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 mt-4">
                <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100 flex items-center gap-1.5 flex-row-reverse">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-[9px] text-stone-600 font-semibold leading-normal">
                    {dbDiagStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: Advanced GPS Interactive Routing to Specific Selected Person (4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-stone-200/80 p-5 rounded shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2 mb-3">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-[#16a085]">۲. انتخاب متوفی و شبیه‌ساز</h4>
                  
                  <div className="relative w-32">
                    <input 
                      type="text"
                      placeholder="فیلتر..."
                      value={quickSearchQuery}
                      onChange={(e) => setQuickSearchQuery(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 text-[10px] font-bold text-stone-700 outline-none focus:bg-white focus:border-[#1abc9c] transition-colors"
                    />
                  </div>
                </div>

                {/* Compact Persons list Selector */}
                <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 mb-4 border-b border-stone-100 pb-3">
                  {fallbackZanjanGraves
                    .filter(g => g.fullName.includes(quickSearchQuery) || (g.fatherName && g.fatherName.includes(quickSearchQuery)))
                    .map((grave) => (
                      <button
                        key={grave.id}
                        onClick={() => {
                          setSelectedSimGrave(grave);
                          setSimDistance(35);
                          setIsSimulating(false);
                          setSimulationStatus("مزار جدید بارگذاری شد. آماده تست زنده مسیر.");
                        }}
                        className={`w-full p-2 rounded text-right transition-all border text-[11px] font-semibold flex items-center justify-between flex-row-reverse ${selectedSimGrave?.id === grave.id ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700"}`}
                      >
                        <div className="truncate text-right">
                          <span className="font-bold">{grave.fullName}</span>
                          <span className="text-[8px] text-stone-400 font-medium mr-1 select-none">({grave.block})</span>
                        </div>
                        <ChevronRight className={`w-3 h-3 rotate-180 transition-transform ${selectedSimGrave?.id === grave.id ? "translate-x-0.5 text-emerald-600" : "text-stone-300"}`} />
                      </button>
                  ))}
                </div>

                {/* Active Person Info display */}
                <div className="bg-stone-900 text-white p-4 rounded relative overflow-hidden font-sans">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-lg pointer-events-none" />
                  
                  <div className="text-right">
                    <span className="text-[8px] text-stone-400 font-bold block mb-0.5">متوفی هدف:</span>
                    <h5 className="font-bold text-sm text-[#1abc9c] leading-tight">{selectedSimGrave?.fullName}</h5>
                    <p className="text-[9px] text-stone-300 leading-normal mt-0.5">{selectedSimGrave?.block} / ردیف {selectedSimGrave?.row}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between flex-row-reverse">
                    <span className="text-[9px] text-stone-400">فاصله زنده:</span>
                    <span className="text-sm font-bold text-yellow-400 font-mono">
                      {selectedSimGrave ? getCalculateDistance(customLat, customLng, selectedSimGrave.location.lat, selectedSimGrave.location.lng).toLocaleString('fa-IR') : '---'} <span className="text-[10px] text-stone-400">متر</span>
                    </span>
                  </div>

                  <p className="text-[9px] text-stone-350 font-sans mt-2 bg-white/5 p-1.5 rounded leading-relaxed text-right border-r-2 border-[#1abc9c]">
                    {simulationStatus}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <button
                  onClick={() => selectedSimGrave && startGpsWalkSimulation(selectedSimGrave)}
                  disabled={isSimulating}
                  className="w-full py-2 bg-stone-900 hover:bg-[#1abc9c] text-white text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Compass className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin text-yellow-400' : ''}`} />
                  <span>{isSimulating ? `شبیه‌ساز گام‌شمار: ${simDistance} م` : "شبیه‌سازی گام‌به‌گام پیاده‌روی"}</span>
                </button>
              </div>
            </div>

            {/* Column 3: Beautiful Interactive Cemetery Map Preview with Overlay Styles Switch (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-emerald-100 p-4 rounded-3xl shadow-xl flex flex-col justify-between relative min-h-[280px]">
              <div className="flex justify-between items-center border-b border-emerald-50 pb-2 mb-3 z-20 flex-row-reverse">
                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-900">۳. تماشای زنده مسیر روی نقشه</h4>
                
                {/* Historical vs Satellite Toggle Switch */}
                <div className="bg-emerald-50/80 backdrop-blur-sm p-1 rounded-xl flex items-center gap-1 text-[9px] font-black border border-emerald-100">
                  <button
                    onClick={() => setHomeMapStyle('historical')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${homeMapStyle === 'historical' ? 'bg-emerald-700 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900'}`}
                  >
                    تاریخی
                  </button>
                  <button
                    onClick={() => setHomeMapStyle('satellite')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${homeMapStyle === 'satellite' ? 'bg-emerald-700 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900'}`}
                  >
                    ماهواره
                  </button>
                </div>
              </div>

              {/* Map Canvas Frame */}
              <div className="flex-1 w-full bg-stone-50 rounded-2xl border border-emerald-50 overflow-hidden relative h-[200px] min-h-[200px]">
                <OfflineCemeteryMap 
                  graveLocation={selectedSimGrave?.location}
                  originLocation={{ lat: customLat, lng: customLng }}
                  targetGraveName={selectedSimGrave?.fullName}
                  targetGraveInfo={selectedSimGrave?.block}
                  mapStyle={homeMapStyle}
                />

                {/* Style Mode Floating Badge Overlay */}
                <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[8px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded pointer-events-none select-none">
                  MODE: {homeMapStyle.toUpperCase()}
                </div>
              </div>

              <p className="text-[9.5px] text-stone-400 text-right leading-relaxed mt-2.5 font-medium">
                {homeMapStyle === 'historical' 
                  ? "🔹 در حال نمایش استایل «نقشه تاریخی» آرامستان با رنگ‌بندی کهنه‌نما و خطوط کتیبه‌ای کجیل."
                  : "🔸 در حال نمایش استایل «تصاویر ماهواره‌ای کنونی» با رنگ‌بندی تیره، رادارهای دیجیتال و شبیه‌ساز ترافیکی."
                }
              </p>
            </div>

          </div>

          {/* Dynamic Neshan & Balad Route Builder Section */}
          <div className="bg-white border border-stone-200/85 p-6 rounded shadow-sm">
            <div className="flex items-center gap-2 flex-row-reverse mb-4 border-b border-stone-100 pb-3">
              <Info className="w-4 h-4 text-[#16a085]" />
              <p className="text-xs font-bold text-stone-700">مسیریابی هوشمند گام‌به‌گام با انتقال مستقیم به برنامه‌های بومی همراه شما:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
              
              {/* Neshan Route Details */}
              <div className="bg-[#f0f4f8] border border-blue-100 rounded p-4 flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <div className="flex justify-between items-center mb-2 flex-row-reverse">
                    <span className="text-[9px] font-mono font-bold bg-blue-100 text-[#1e3d59] px-2 py-0.5 rounded">NESHAN LINK</span>
                    <span className="text-xs font-bold text-[#1e3d59]">نقشه و مسیریاب نشان</span>
                  </div>
                  <p className="text-[10.5px] text-stone-500 leading-relaxed font-semibold">سرویس دهی صوتی سخنگوی فارسی با دقیق‌ترین بانک اطلاعات معابر داخلی بهشت زهرای زنجان</p>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      const url = `https://neshan.org/maps?origin=${customLat},${customLng}&destination=${selectedSimGrave?.location?.lat ?? 36.658},${selectedSimGrave?.location?.lng ?? 48.484}`;
                      navigator.clipboard.writeText(url);
                      setCopiedType('neshan');
                      setTimeout(() => setCopiedType(null), 2500);
                    }}
                    className="p-2 bg-white text-stone-600 hover:text-stone-900 border border-stone-300 rounded hover:bg-stone-50 transition-colors flex items-center justify-center shrink-0"
                    title="کپی لینک مسیریابی"
                  >
                    {copiedType === 'neshan' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <a
                    href={`https://neshan.org/maps?origin=${customLat},${customLng}&destination=${selectedSimGrave?.location?.lat ?? 36.658},${selectedSimGrave?.location?.lng ?? 48.484}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-[#1e3d59] text-white text-[10.5px] font-bold rounded hover:bg-[#1abc9c] transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>کپی مسیر و ناوبری در اپلیکیشن نشان</span>
                  </a>
                </div>
              </div>

              {/* Balad Route Details */}
              <div className="bg-[#fdfbf6] border border-yellow-100 rounded p-4 flex flex-col justify-between hover:border-yellow-400 transition-colors">
                <div>
                  <div className="flex justify-between items-center mb-2 flex-row-reverse">
                    <span className="text-[9px] font-mono font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">BALAD LINK</span>
                    <span className="text-xs font-bold text-yellow-800">نقشه و مسیریاب بلد</span>
                  </div>
                  <p className="text-[10.5px] text-stone-500 leading-relaxed font-semibold">تخمین ترافیک لحظه به لحظه و راه‌های خلوت‌تر منتهی به ورودی‌ها و قطعات آرامستان</p>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      const url = `https://balad.ir/route?origin=${customLat},${customLng}&destination=${selectedSimGrave?.location?.lat ?? 36.658},${selectedSimGrave?.location?.lng ?? 48.484}`;
                      navigator.clipboard.writeText(url);
                      setCopiedType('balad');
                      setTimeout(() => setCopiedType(null), 2500);
                    }}
                    className="p-2 bg-white text-stone-600 hover:text-stone-900 border border-stone-300 rounded hover:bg-stone-50 transition-colors flex items-center justify-center shrink-0"
                    title="کپی لینک مسیریابی"
                  >
                    {copiedType === 'balad' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <a
                    href={`https://balad.ir/route?origin=${customLat},${customLng}&destination=${selectedSimGrave?.location?.lat ?? 36.658},${selectedSimGrave?.location?.lng ?? 48.484}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-yellow-600 text-white text-[10.5px] font-bold rounded hover:bg-[#16a085] transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>کپی مسیر و ناوبری در اپلیکیشن بلد</span>
                  </a>
                </div>
              </div>

            </div>

            {copiedType && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-right text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded border border-emerald-100 mt-4"
              >
                لینک تخصصی مسیریابی زنده {copiedType === 'neshan' ? 'نشان' : 'بلد'} برای دستگاه همراه و زائران کپی شد! می‌توانید این لینک را ذخیره یا پیامک نمائید.
              </motion.p>
            )}
          </div>
        </div>
      </section>

      {/* Recent Records */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="flex items-end justify-between mb-8 border-b border-stone-200 pb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">آخرین موارد ثبت شده</h3>
          <Link to="/map" className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary hover:text-brand-primary transition-colors flex items-center gap-1">
            مشاهده روی نقشه <ChevronRight className="w-3 h-3 rotate-180 rtl:rotate-0" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 shadow-sm border border-stone-200 bg-stone-200 overflow-hidden rounded-sm">
          {loading ? (
             [...Array(4)].map((_, i) => (
               <div key={i} className="animate-pulse bg-white aspect-[4/5]" />
             ))
          ) : (
            recentGraves.map((grave) => (
              <GraveCard key={grave.id} grave={grave} />
            ))
          )}
        </div>
      </section>

      {/* Navigation Feature */}
      <section className="bg-stone-900 py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 text-white">
            <h3 className="text-4xl md:text-5xl font-bold mb-8 tracking-tighter">مسیر زیارت اهل قبور را <br /><span className="italic font-serif font-light opacity-60">هرگز گم نخواهید کرد.</span></h3>
            <p className="text-stone-400 text-lg mb-12 leading-relaxed font-medium">
              سامانه پیشرفته مسیریابی ما، مختصات GPS را با نقشه آرامستان ترکیب می‌کند تا شما را دقیقاً به محل مورد نظر برساند. از نقشه‌های تعاملی ما برای مسیریابی پیاده یا اتوبوس استفاده کنید.
            </p>
            <div className="space-y-4">
              {[
                { title: 'مسیریابی دقیق GPS', desc: 'هدایت تا فاصله ۱ متری سنگ مزار.' },
                { title: 'خطوط حمل و نقل عمومی', desc: 'نمایش ایستگاه‌های اتوبوس منتهی به آرامستان.' },
                { title: 'نقشه دیجیتال آرامستان', desc: 'نمای گرافیکی قطعات و ردیف‌ها.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 bg-emerald-700 rounded-sm flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-widest">{item.title}</h5>
                    <p className="text-[10px] text-stone-400 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-white/5 rounded-full blur-3xl opacity-20" />
            <img 
               src="https://images.unsplash.com/photo-1524613032530-449a5d94c285?auto=format&fit=crop&q=80&w=800" 
               className="relative z-10 w-full rounded shadow-2xl transition-all duration-700 hover:scale-[1.02]"
               alt="Navigation feature"
            />
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function GraveCard({ grave }: { grave: any }) {
  return (
    <motion.div 
      className="group bg-white p-4 h-full"
    >
      <Link to={`/grave/${grave.id}`} className="flex flex-col h-full">
        <div className="relative aspect-[4/3] rounded-sm overflow-hidden mb-4 bg-stone-100">
          <img 
            src={grave.photoUrl} 
            alt={grave.fullName} 
            className="w-full h-full object-cover transition-all duration-700 scale-105 group-hover:scale-100" 
          />
          <div className="absolute top-2 right-2 bg-brand-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm tracking-widest uppercase">
            {grave.block || 'SEC A'}
          </div>
        </div>
        <div className="flex-1 min-h-0">
           <h4 className="text-sm font-bold uppercase tracking-tight group-hover:text-brand-primary transition-colors">{grave.fullName}</h4>
           <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-1">فرزند {grave.fatherName || '...'}</p>
           <div className="flex items-center gap-2 text-stone-400 mt-2">
              <Calendar className="w-3 h-3" />
              <span className="text-[10px] font-bold tracking-widest uppercase">
                {grave.birthDate || '...'} — {grave.deathDate || '...'}
              </span>
           </div>
        </div>
        <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-800 transition-colors">
          <span>مشاهده پرونده</span>
          <ChevronRight className="w-3 h-3 rotate-180 rtl:rotate-0" />
        </div>
      </Link>
    </motion.div>
  );
}
