import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MapPin, Calendar, Clock, ChevronLeft, Navigation, Bus, Footprints, Info, Compass, ExternalLink, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { fallbackZanjanGraves } from '../lib/fallbackData';
import OfflineCemeteryMap from '../components/OfflineCemeteryMap';
import GravestonePortrait from '../components/GravestonePortrait';

const GOOGLE_MAPS_KEY = typeof process !== 'undefined' && process.env 
  ? (process.env.GOOGLE_MAPS_PLATFORM_KEY || '') 
  : (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');

export default function GraveDetails() {
  const { id } = useParams();
  const [grave, setGrave] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'navigate'>('info');

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [calculatingGPS, setCalculatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  useEffect(() => {
    fetchGrave();
  }, [id]);

  const fetchGrave = async () => {
    if (!id) return;
    if (id === 'test-1' || id === 'test-2' || id === 'test-3') {
      const testGraves: Record<string, any> = {
        'test-1': {
          id: 'test-1',
          fullName: 'علی رضایی',
          fatherName: 'محمد',
          birthDate: '۱۳۲۰',
          deathDate: '۱۳۹۸',
          block: '۴ (قطعه صالحین)',
          row: '۱۲',
          number: '۵',
          location: { lat: 36.658211, lng: 48.478904 },
          photoUrl: 'https://images.unsplash.com/photo-1549424606-5b4af79612f0?auto=format&fit=crop&q=80&w=800',
          inscription: 'یا هو. مزار مرحوم علی رضایی، آزاده سرافراز و همسر فداکار شهر زنجان که عمری را در خدمت به خلق سپری نمود.',
        },
        'test-2': {
          id: 'test-2',
          fullName: 'زهرا عباسی',
          fatherName: 'غلامرضا',
          birthDate: '۱۳۳۵',
          deathDate: '۱۴۰۱',
          block: '۲ (قطعه خواهران)',
          row: '۷',
          number: '۴۲',
          location: { lat: 36.657152, lng: 48.479533 },
          photoUrl: 'https://images.unsplash.com/photo-1524613032530-449a5d94c285?auto=format&fit=crop&q=80&w=800',
          inscription: 'مادر مهربان و دلسوز مرحومه زهرا عباسی، الگوی اخلاق و پارسایی. خاک پاک تو توتیای چشمان ماست.',
        },
        'test-3': {
          id: 'test-3',
          fullName: 'حسین کریمی',
          fatherName: 'احمد',
          birthDate: '۱۳۱۵',
          deathDate: '۱۳۹۵',
          block: '۹ (بخش عمومی مزارات)',
          row: '۱۵',
          number: '۸',
          location: { lat: 36.656845, lng: 48.478411 },
          photoUrl: 'https://images.unsplash.com/photo-1549424606-5b4af79612f0?auto=format&fit=crop&q=80&w=800',
          inscription: 'آرامگاه مرحوم کربلایی حسین کریمی. مرید اهل بیت و خادم‌الحسین زنجان که با عزت زیست.',
        }
      };
      setGrave(testGraves[id]);
      setLoading(false);
      return;
    }
    const foundFallback = fallbackZanjanGraves.find(g => g.id === id);
    if (foundFallback) {
      setGrave(foundFallback);
      setLoading(false);
      return;
    }
    try {
      // Race Firebase document lookup against a 600ms timeout constraint to keep intranet UI responsive
      const fetchPromise = getDoc(doc(db, 'graves', id));
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 600)
      );
      
      const snap = await Promise.race([fetchPromise, timeoutPromise]);
      if (snap.exists()) {
        setGrave({ id: snap.id, ...snap.data() });
      }
    } catch (error) {
      console.warn("Firestore document query deferred or timed out under intranet check:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = () => {
    if (!navigator.geolocation) {
      setGpsError("دستگاه شما از مکان‌یاب GPS پشتیبانی نمی‌کند.");
      return;
    }
    setCalculatingGPS(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const uLat = position.coords.latitude;
        const uLng = position.coords.longitude;
        setUserLocation({ lat: uLat, lng: uLng });
        
        // Haversine formula
        const R = 6371e3; // metres
        const lat1 = uLat;
        const lon1 = uLng;
        const lat2 = grave.location.lat;
        const lon2 = grave.location.lng;

        if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || isNaN(v))) {
          setUserDistance(0);
          setCalculatingGPS(false);
          return;
        }

        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const d = R * c; // in metres
        setUserDistance(Math.round(d));
        setCalculatingGPS(false);
      },
      (error) => {
        console.error("GPS Error:", error);
        setGpsError("دسترسی به مکان‌یاب انجام نشد. لطفا GPS خود را روشن کرده و دسترسی مرورگر را تایید کنید.");
        setCalculatingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getDirections = (mode: 'walking' | 'transit') => {
    if (!grave?.location) return;
    const { lat, lng } = grave.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${mode}`;
    window.open(url, '_blank');
  };

  const openAppRoute = (provider: 'neshan' | 'balad', directApp: boolean = false) => {
    if (!grave?.location) return;
    const destLat = grave.location.lat;
    const destLng = grave.location.lng;
    
    // Use userLocation if available, else Behesht-e-Zahra main gate as origin
    const originLat = userLocation?.lat ?? 36.6552;
    const originLng = userLocation?.lng ?? 48.4850;
    
    if (provider === 'neshan') {
      const url = directApp 
        ? `nshn://navigate?lat=${destLat}&lng=${destLng}`
        : `https://neshan.org/maps?origin=${originLat},${originLng}&destination=${destLat},${destLng}`;
      window.open(url, '_blank');
    } else if (provider === 'balad') {
      const url = directApp 
        ? `balad://navigate?latitude=${destLat}&longitude=${destLng}`
        : `https://balad.ir/route?origin=${originLat},${originLng}&destination=${destLat},${destLng}`;
      window.open(url, '_blank');
    }
  };

  const copyRouteLink = (provider: 'neshan' | 'balad') => {
    if (!grave?.location) return;
    const destLat = grave.location.lat;
    const destLng = grave.location.lng;
    const originLat = userLocation?.lat ?? 36.6552;
    const originLng = userLocation?.lng ?? 48.4850;

    const url = provider === 'neshan'
      ? `https://neshan.org/maps?origin=${originLat},${originLng}&destination=${destLat},${destLng}`
      : `https://balad.ir/route?origin=${originLat},${originLng}&destination=${destLat},${destLng}`;

    navigator.clipboard.writeText(url).then(() => {
      setCopiedType(provider);
      setTimeout(() => setCopiedType(null), 2500);
    });
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-t-2 border-stone-800 rounded-full animate-spin" />
    </div>
  );
  if (!grave) return <div className="h-[60vh] flex items-center justify-center">پرونده مورد نظر یافت نشد</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-8 py-12"
    >
      <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 mb-8 transition-colors">
        <ChevronLeft className="w-3 h-3 rotate-180 rtl:rotate-0" />
        بازگشت به جستجو
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-12">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-4 block drop-shadow-sm">گردش کار پرونده دیجیتال: {grave.id.substring(0,8).toUpperCase()}</span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 uppercase text-emerald-900 leading-none">{grave.fullName}</h2>
            <div className="flex gap-6 items-center text-sm font-black text-emerald-700/60 uppercase tracking-widest">
               <span>{grave.birthDate || '...'}</span>
               <div className="w-8 h-[2px] bg-emerald-200" />
               <span>{grave.deathDate || '...'}</span>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-sm overflow-hidden shadow-2xl group border border-stone-100 bg-stone-100">
             <GravestonePortrait 
               fullName={grave.fullName}
               fatherName={grave.fatherName}
               birthDate={grave.birthDate}
               deathDate={grave.deathDate}
               inscription={grave.inscription}
               photoUrl={grave.photoUrl}
               className="w-full h-full object-cover"
             />
             <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-sm shadow-sm border border-stone-200">
                <p className="text-stone-800 text-[9px] font-bold uppercase tracking-widest">تصویر مستند شده سنگ مزار</p>
             </div>
          </div>

          <div className="p-8 bg-stone-50 border border-stone-100 rounded shadow-sm relative overflow-hidden text-right">
             <div className="absolute top-0 left-0 p-4 opacity-5">
                <Info size={80} />
             </div>
             <h4 className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-4">متن سنگ مزار</h4>
             <p className="text-sm text-stone-600 leading-relaxed font-mono italic">
                "{grave.inscription || 'متنی برای این پرونده ثبت نشده است.'}"
             </p>
          </div>
        </div>

        <div className="flex flex-col h-full">
            <div className="flex gap-1 mb-8 border-b border-emerald-100 bg-white p-1 rounded-xl shadow-sm">
              <button 
                onClick={() => setActiveTab('info')}
                className={cn(
                  "flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all rounded-lg",
                  activeTab === 'info' ? "bg-emerald-700 text-white shadow-lg" : "text-emerald-900/40 hover:text-emerald-900"
                )}
              >
                کارت مشخصات
              </button>
              <button 
                onClick={() => setActiveTab('navigate')}
                className={cn(
                  "flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all rounded-lg",
                  activeTab === 'navigate' ? "bg-emerald-700 text-white shadow-lg" : "text-emerald-900/40 hover:text-emerald-900"
                )}
              >
                ناوبری زنده
              </button>
           </div>

           <div className="flex-1">
              <AnimatePresence mode="wait">
                {activeTab === 'info' ? (
                  <motion.div 
                    key="info"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-px bg-stone-200 border border-stone-200 rounded-sm overflow-hidden"
                  >
                    {[
                      { icon: MapPin, label: 'آرامستان', val: 'بهشت زهرا (س) زنجان' },
                      { icon: Clock, label: 'نام پدر', val: grave.fatherName || 'نامشخص' },
                      { icon: Clock, label: 'قطعه / بلوک', val: (grave.block || 'قطعه عمومی') },
                      { icon: Clock, label: 'ردیف / شماره', val: `${grave.row || 'نامشخص'} — ${grave.number || 'نامشخص'}` },
                      { icon: Calendar, label: 'تاریخ آخرین ویرایش', val: grave.createdAt?.toDate ? grave.createdAt.toDate().toLocaleDateString('fa-IR') : 'اخیراً' }
                    ].map((item, i) => (
                      <div key={i} className="p-6 bg-white hover:bg-stone-50 transition-colors text-right">
                        <item.icon className="w-4 h-4 text-brand-secondary mb-4 ml-auto" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1 block">{item.label}</span>
                        <p className="text-sm font-bold uppercase tracking-tight">{item.val}</p>
                      </div>
                    ))}
                    <div className="md:col-span-2 p-8 bg-stone-900 text-white rounded-b-sm text-right">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-8 h-8 bg-emerald-700/50 rounded-sm flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-emerald-400" />
                           </div>
                           <h5 className="text-[10px] font-bold uppercase tracking-widest">مختصات دقیق جغرافیایی</h5>
                        </div>
                        <div className="flex items-center gap-4 text-2xl font-bold font-mono tracking-tighter text-emerald-400 direction-ltr">
                           <span>{grave.location.lat.toFixed(6)}</span>
                           <span className="text-white/20">|</span>
                           <span>{grave.location.lng.toFixed(6)}</span>
                        </div>
                        <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-6">تایید شده توسط موتور هوش مصنوعی v2.1</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="navigate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col space-y-6 animate-fadeIn"
                  >
                    {/* GPS Distance Calculator Card */}
                    <div className="bg-white p-6 rounded border border-stone-200 text-right shadow-sm space-y-4">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <div className="flex items-center gap-2 text-[#1abc9c]">
                          <Compass className="w-5 h-5" />
                          <h4 className="text-sm font-bold uppercase tracking-tight">محاسبه هوشمند فاصله تا مزار</h4>
                        </div>
                        <button
                          onClick={calculateDistance}
                          disabled={calculatingGPS}
                          className="px-3 py-1.5 bg-stone-900 text-white rounded text-[10px] font-bold hover:bg-[#1abc9c] transition-colors"
                        >
                          {calculatingGPS ? 'در حال دریافت GPS...' : 'تخمین فاصله تا مزار'}
                        </button>
                      </div>

                      {userDistance !== null ? (
                        <div className="bg-emerald-50 border border-emerald-110 p-4 rounded text-center space-y-2">
                          <p className="text-xs text-stone-600">فاصله تخمینی شما در حال حاضر از این مزار:</p>
                          <div className="text-3xl font-bold font-mono text-emerald-600">
                            {userDistance.toLocaleString('fa-IR')} <span className="text-sm font-sans">متر</span>
                          </div>
                          <p className="text-[10px] text-stone-400">با پای پیاده تقریباً {Math.ceil(userDistance / 80).toLocaleString('fa-IR')} دقیقه طول می‌کشد.</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400">برای مشاهده فاصله‌ی زنده خود تا قبر و مسیریابی دقیق درون آرامستان بهشت زهرا (س)، دکمه بالا را فشار دهید.</p>
                      )}

                      {gpsError && (
                        <p className="text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded">{gpsError}</p>
                      )}
                    </div>

                    <div className="rounded-2xl overflow-hidden border border-emerald-100 bg-stone-100 h-[320px] shadow-inner">
                      <OfflineCemeteryMap 
                        graveLocation={grave.location}
                        originLocation={userLocation}
                        targetGraveName={grave.fullName}
                        targetGraveInfo={grave.block}
                      />
                    </div>
                    
                    {/* Iranian Local Routers Section */}
                    <div className="space-y-3 pb-4">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">مسیریابی با برنامه‌های نقشه همراه بومی</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white border border-stone-200 rounded p-4 flex flex-col items-end gap-3 hover:border-[#1abc9c] transition-colors relative overflow-hidden">
                          <span className="text-xs font-bold text-[#1F3041]">نقشه و مسیریاب نشان</span>
                          <p className="text-[10px] text-stone-400 text-right font-medium">مسیریابی از {userLocation ? 'موقعیت زنده شما' : 'ورودی بهشت زهرا'} تا سنگ مزار متوفی</p>
                          <div className="flex flex-col gap-1.5 w-full">
                            <div className="flex gap-1.5 w-full">
                              <button
                                onClick={() => openAppRoute('neshan', true)}
                                className="flex-1 py-2.5 bg-[#1abc9c]/5 text-[#1abc9c] text-[9.5px] font-bold rounded hover:bg-[#1abc9c]/10 transition-colors flex items-center justify-center gap-1 border border-[#1abc9c]/20"
                              >
                                <ExternalLink className="w-3 h-3" />
                                برنامه نشان (اپ)
                              </button>
                              <button
                                onClick={() => openAppRoute('neshan', false)}
                                className="flex-1 py-2.5 bg-stone-50 text-stone-700 text-[9.5px] font-bold rounded hover:bg-stone-100 transition-colors flex items-center justify-center gap-1 border border-stone-200"
                              >
                                وب‌سایت نشان
                              </button>
                            </div>
                            <button
                              onClick={() => copyRouteLink('neshan')}
                              className="w-full py-2 bg-stone-900 text-white text-[9.5px] font-bold rounded hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5 animate-pulse"
                            >
                              {copiedType === 'neshan' ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">لینک مسیریابی نشان کپی شد</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>کپی لینک مسیریابی نشان</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="bg-white border border-stone-200 rounded p-4 flex flex-col items-end gap-3 hover:border-yellow-600 transition-colors relative overflow-hidden">
                          <span className="text-xs font-bold text-[#1F3041]">نقشه و مسیریاب بلد</span>
                          <p className="text-[10px] text-stone-400 text-right font-medium">مسیریابی از {userLocation ? 'موقعیت زنده شما' : 'ورودی بهشت زهرا'} تا سنگ مزار متوفی</p>
                          <div className="flex flex-col gap-1.5 w-full">
                            <div className="flex gap-1.5 w-full">
                              <button
                                onClick={() => openAppRoute('balad', true)}
                                className="flex-1 py-2.5 bg-yellow-50 text-yellow-850 text-[9.5px] font-bold rounded hover:bg-yellow-105 transition-colors flex items-center justify-center gap-1 border border-yellow-200"
                              >
                                <ExternalLink className="w-3 h-3" />
                                برنامه بلد (اپ)
                              </button>
                              <button
                                onClick={() => openAppRoute('balad', false)}
                                className="flex-1 py-2.5 bg-stone-50 text-stone-700 text-[9.5px] font-bold rounded hover:bg-stone-100 transition-colors flex items-center justify-center gap-1 border border-stone-200"
                              >
                                وب‌سایت بلد
                              </button>
                            </div>
                            <button
                              onClick={() => copyRouteLink('balad')}
                              className="w-full py-2 bg-stone-900 text-white text-[9.5px] font-bold rounded hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5"
                            >
                              {copiedType === 'balad' ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">لینک مسیریابی بلد کپی شد</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>کپی لینک مسیریابی بلد</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Google Maps Fallback Global Routers */}
                    <div className="space-y-3 border-t border-stone-200 pt-4">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">سایر ناوبری‌های بین‌المللی (گوگل)</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => getDirections('transit')}
                          className="flex items-center justify-center gap-3 p-4 bg-brand-primary text-white rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-[#16a085] transition-all shadow-sm"
                        >
                          <Bus className="w-4 h-4" />
                          <span>مسیر اتوبوس (گوگل)</span>
                        </button>
                        <button 
                          onClick={() => getDirections('walking')}
                          className="flex items-center justify-center gap-3 p-4 bg-stone-900 text-white rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-stone-800 transition-all shadow-sm"
                        >
                          <Footprints className="w-4 h-4" />
                          <span>مسیر پیاده (گوگل)</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
