import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Search, MapPin, User, Calendar, Navigation, Clock, CreditCard, ChevronRight, Info, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { fallbackZanjanGraves } from '../lib/fallbackData';

interface Grave {
  id: string;
  fullName: string;
  fatherName?: string;
  birthDate: string;
  deathDate: string;
  location: { lat: number, lng: number };
  block?: string;
  row?: string;
  number?: string;
}

export default function KioskPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: 'رضایی',
    fatherName: '',
    deathDate: ''
  });
  const [results, setResults] = useState<Grave[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setHasSearched(true);
    
    // Quick local filtering for instant fallback response under offline/intranet environment
    const getLocalFiltered = () => {
      return fallbackZanjanGraves.filter((g: any) => {
        const nameMatch = !formData.lastName || g.fullName.includes(formData.lastName) || g.fullName.includes(formData.firstName);
        const fatherMatch = !formData.fatherName || (g.fatherName && g.fatherName.includes(formData.fatherName));
        const dateMatch = !formData.deathDate || g.deathDate.includes(formData.deathDate);
        return nameMatch && fatherMatch && dateMatch;
      }) as Grave[];
    };
    
    try {
      const gravesRef = collection(db, 'graves');
      let q = query(gravesRef, limit(100));

      // Limit network query time to 600ms on server integrations
      const fetchPromise = getDocs(q);
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 600)
      );

      const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
      const allGraves = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grave));
      
      const merged = [...allGraves];
      fallbackZanjanGraves.forEach((g: any) => {
        if (!merged.some(m => m.id === g.id)) {
          merged.push(g as Grave);
        }
      });
      
      const filtered = merged.filter(g => {
        const nameMatch = !formData.lastName || g.fullName.includes(formData.lastName) || g.fullName.includes(formData.firstName);
        const fatherMatch = !formData.fatherName || (g.fatherName && g.fatherName.includes(formData.fatherName));
        const dateMatch = !formData.deathDate || g.deathDate.includes(formData.deathDate);
        return nameMatch && fatherMatch && dateMatch;
      });

      setResults(filtered.length > 0 ? filtered : getLocalFiltered());
    } catch (error) {
      console.warn("Intranet connection check: Firestore timed out/failed. Using pure local dataset lookup.", error);
      setResults(getLocalFiltered());
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-full bg-[#34495e]/5"
    >
      {/* Header - Samane Jame Meraj Style */}
      <header className="bg-[#1F3041] py-8 border-b-4 border-[#34495e] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Map size={120} className="text-white" />
        </div>
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
            <div className="flex items-center gap-4 mb-2">
                <div className="h-[2px] w-12 bg-white/20" />
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter text-center">سامانه جامع معراج</h1>
                <div className="h-[2px] w-12 bg-white/20" />
            </div>
            <p className="text-[#B1B6BC] text-xs font-bold uppercase tracking-[0.3em]">باجه هوشمند جستجوی یادبود و مسیریابی</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 -mt-8">
        {/* Search Form Card */}
        <div className="bg-white rounded shadow-xl border border-stone-200 overflow-hidden mb-8">
          <div className="bg-stone-50 border-b border-stone-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
                    <Search size={16} />
                    بخش جستجوی متوفی
                </h2>
                <button 
                    onClick={() => setFormData({ firstName: 'علی', lastName: 'رضایی', fatherName: 'محمد', deathDate: '۱۳۹۸' })}
                    className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest rounded hover:bg-emerald-100 transition-colors border border-emerald-200"
                >
                    تست هوشمند بارگذاری
                </button>
            </div>
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-stone-200" />
                <div className="w-2 h-2 rounded-full bg-stone-200" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          <form onSubmit={handleSearch} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <SearchField 
                    label="نام" 
                    value={formData.firstName} 
                    onChange={v => setFormData(p => ({...p, firstName: v}))} 
                    placeholder="مثال: علی"
                />
                <SearchField 
                    label="نام خانوادگی" 
                    value={formData.lastName} 
                    onChange={v => setFormData(p => ({...p, lastName: v}))} 
                    placeholder="مثال: عبدی"
                />
              </div>
              <div className="space-y-4">
                <SearchField 
                    label="نام پدر" 
                    value={formData.fatherName} 
                    onChange={v => setFormData(p => ({...p, fatherName: v}))} 
                    placeholder="مثال: محمد"
                />
                <SearchField 
                    label="تاریخ فوت" 
                    value={formData.deathDate} 
                    onChange={v => setFormData(p => ({...p, deathDate: v}))} 
                    placeholder="مثال: 1402"
                />
              </div>
            </div>

            <button 
                type="submit"
                disabled={isSearching}
                className="w-full h-16 bg-[#1abc9c] hover:bg-[#16a085] text-white text-xl font-bold uppercase tracking-[0.2em] rounded shadow-lg transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
            >
                {isSearching ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Search size={24} />
                        جستجو در پایگاه داده
                    </>
                )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {hasSearched && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">
                  نتایج یافت شده ({results.length} مورد)
                </span>
                <div className="h-[1px] flex-1 mx-4 bg-stone-200" />
              </div>

              {results.length === 0 ? (
                <div className="bg-white p-12 text-center rounded border border-dashed border-stone-300">
                    <Info size={40} className="mx-auto mb-4 text-stone-200" />
                    <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">موردی یافت نشد</p>
                </div>
              ) : (
                results.map((grave, i) => (
                    <GraveKioskCard key={grave.id} grave={grave} index={i} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SearchField({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
    return (
        <div className="flex flex-row-reverse border border-stone-200 rounded overflow-hidden h-12">
            <div className="w-32 bg-[#1F3041] text-[#B1B6BC] flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {label}
            </div>
            <input 
                type="text" 
                value={value} 
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 text-sm font-bold bg-stone-50 outline-none focus:bg-white transition-colors text-right"
            />
        </div>
    );
}

function GraveKioskCard({ grave, index }: { grave: Grave, index: number }) {
    // Generate some mock smart data
    const mockTime = (Math.floor(Math.random() * 8) + 3) + " دقیقه";
    const mockStatus = index % 3 === 0 ? "تکمیل پرونده" : "در حال بایگانی";
    const mockSection = grave.block || (Math.random() > 0.5 ? "D" : "F2");
    
    return (
        <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border-r-4 border-r-[#1abc9c] shadow-sm hover:shadow-md transition-shadow rounded overflow-hidden"
        >
            <div className="p-0 flex flex-col md:flex-row items-center">
                {/* Person Info */}
                <div className="p-6 flex-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-l border-stone-100 min-w-[250px]">
                    <span className="text-[10px] font-bold text-[#1abc9c] uppercase tracking-widest mb-1">{mockStatus}</span>
                    <h3 className="text-2xl font-bold text-stone-900 mb-1">{grave.fullName}</h3>
                    <p className="text-[11px] text-stone-400 font-bold uppercase tracking-widest">فرزند {grave.fatherName || '...'} | فوت: {grave.deathDate}</p>
                </div>

                {/* Status Column */}
                <div className="p-6 w-full md:w-48 flex flex-col items-center justify-center border-b md:border-b-0 md:border-l border-stone-100 bg-stone-50/50">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">وضعیت استقرار</span>
                    <div className="px-3 py-1 bg-[#1F3041] text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                        {mockSection} - بخش هوشمند
                    </div>
                </div>

                {/* Navigation/Cost Details */}
                <div className="p-6 flex-[1.5] w-full grid grid-cols-2 gap-4 bg-stone-50/20">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <Navigation size={14} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">مسیریابی هوشمند</span>
                        </div>
                        <p className="text-xs font-bold text-stone-700">فاصله: {Math.floor(Math.random() * 400 + 50)} متر</p>
                        <p className="text-[10px] text-stone-400">از درب ورودی اصلی</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-brand-secondary mb-1">
                            <Clock size={14} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">زمان تقریبی پیاده</span>
                        </div>
                        <p className="text-xs font-bold text-stone-700">{mockTime}</p>
                        <p className="text-[10px] text-stone-400">با سرعت پیاده‌روی متوسط</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <CreditCard size={14} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">هزینه ناداون / نگهداری</span>
                        </div>
                        <p className="text-xs font-bold text-stone-700">{(Math.floor(Math.random() * 5 + 1) * 500000).toLocaleString('fa-IR')} ریال</p>
                        <p className="text-[10px] text-stone-400">تسویه کامل (دائمی)</p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => window.print()}
                            className="p-3 bg-stone-100 text-stone-600 rounded hover:bg-stone-200 transition-colors"
                            title="چاپ فیش راهنما"
                        >
                            <Info size={18} />
                        </button>
                        <a 
                            href={`https://neshan.org/maps?destination=${grave.location.lat},${grave.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded hover:bg-blue-100 transition-colors text-[9px] font-bold"
                            title="مسیریابی با نشان"
                        >
                            نشان
                        </a>
                        <a 
                            href={`https://balad.ir/location?latitude=${grave.location.lat}&longitude=${grave.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-3 bg-yellow-50 text-yellow-800 border border-yellow-100 rounded hover:bg-yellow-100 transition-colors text-[9px] font-bold"
                            title="مسیریابی با بلد"
                        >
                            بلد
                        </a>
                        <Link 
                            to={`/grave/${grave.id}`}
                            className="px-4 py-3 bg-stone-900 text-white rounded hover:bg-[#1abc9c] transition-colors group flex items-center gap-2 text-[10px] font-bold uppercase"
                        >
                            <span>جزئیات نقشه</span>
                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
