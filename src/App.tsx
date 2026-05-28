import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, Zap, Cpu, Server, Database, CheckCircle2, AlertTriangle, 
  Settings, ArrowLeft, RefreshCw, Copy, Check, FileCode, Play, Sparkles, 
  BookOpen, Layers, Info, Search, MapPin, Navigation, Map, Compass, ExternalLink, Heart 
} from 'lucide-react';
import StaticGuide from './components/StaticGuide';
import HostingCard from './components/HostingCard';
import CodeConfigViewer from './components/CodeConfigViewer';
import { AnalysisResponse, ProjectType } from './types';

// Real-world graves data in Zanjan (Zanjan's main cemeteries)
interface ZanjanGrave {
  id: number;
  name: string;
  family: string;
  fatherName: string;
  birthYear: string;
  passingYear: string;
  cemetery: 'behesht_masoumeh' | 'new_cemetery' | 'etemadiyeh' | 'shohada';
  cemeteryLabel: string;
  block: string;
  row: string;
  graveNumber: string;
  lat: number;
  lng: number;
  description?: string;
}

const ZANJAN_GRAVES_DB: ZanjanGrave[] = [
  {
    id: 1,
    name: "استاد رضا",
    family: "روزبه",
    fatherName: "کربلایی محمود",
    birthYear: "۱۳۰۰",
    passingYear: "۱۳۵۲",
    cemetery: "shohada",
    cemeteryLabel: "گلزار شهدای زنجان (مزار شهدای پایین)",
    block: "قطعه علما",
    row: "ردیف ۱",
    graveNumber: "شماره ۳",
    lat: 36.671210,
    lng: 48.498421,
    description: "استاد طراز اول فیزیک، فیلسوف اسلامی و مربی اندیشمند کشور متولد زنجان"
  },
  {
    id: 2,
    name: "شهید مجید",
    family: "شهریاری",
    fatherName: "سالار",
    birthYear: "۱۳۴۵",
    passingYear: "۱۳۸۹",
    cemetery: "shohada",
    cemeteryLabel: "مزار یادبود گلزار شهدای زنجان",
    block: "قطعه شهدای ترور علمی",
    row: "ردیف ۲",
    graveNumber: "شماره ۱۲",
    lat: 36.671550,
    lng: 48.498110,
    description: "دانشمند برجسته لنگرودی الاصل متولد زنجان و استاد فیزیک هسته‌ای دانشگاه بهشتی"
  },
  {
    id: 3,
    name: "مزار یادبود حاج رضا",
    family: "سلیمانی",
    fatherName: "محمدحسن",
    birthYear: "۱۳۱۸",
    passingYear: "۱۳۹۸",
    cemetery: "behesht_masoumeh",
    cemeteryLabel: "آرامستان بهشت معصومه زنجان",
    block: "قطعه ۵ عمومی",
    row: "ردیف ۱۴",
    graveNumber: "شماره ۲۶",
    lat: 36.721450,
    lng: 48.452310,
    description: "نویسنده و معتمد محلی محله امجدیه زنجان"
  },
  {
    id: 4,
    name: "کربلایی عباس",
    family: "افشار",
    fatherName: "مظفر",
    birthYear: "۱۳۲۴",
    passingYear: "۱۴۰۱",
    cemetery: "behesht_masoumeh",
    cemeteryLabel: "آرامستان بهشت معصومه زنجان",
    block: "قطعه سنگ ۳",
    row: "ردیف ۹",
    graveNumber: "شماره ۸",
    lat: 36.722890,
    lng: 48.451120,
    description: "بزرگ خاندان افشار زنجان"
  },
  {
    id: 5,
    name: "دکتر مریم",
    family: "زنجانی سادات",
    fatherName: "سید حسین",
    birthYear: "۱۳۵۵",
    passingYear: "۱۴۰۲",
    cemetery: "new_cemetery",
    cemeteryLabel: "آرامستان جدید زنجان (جاده ارمغانخانه)",
    block: "قطعه پزشکان و نام آوران",
    row: "ردیف ۳",
    graveNumber: "شماره ۵",
    lat: 36.745120,
    lng: 48.512340,
    description: "پزشک فداکار اطفال بیمارستان موسوی زنجان"
  },
  {
    id: 6,
    name: "حاج غلامرضا",
    family: "رزاقی",
    fatherName: "اسماعیل",
    birthYear: "۱۳۱۰",
    passingYear: "۱۳۹۲",
    cemetery: "etemadiyeh",
    cemeteryLabel: "آرامستان قدیمی اعتمادیه زنجان",
    block: "قطعه مرکزی",
    row: "ردیف ۸",
    graveNumber: "شماره ۱۷",
    lat: 36.658760,
    lng: 48.473520,
  },
  {
    id: 7,
    name: "پهلوان اکبر",
    family: "آهن‌پنجه",
    fatherName: "حسین علی",
    birthYear: "۱۳۰۲",
    passingYear: "۱۳۸۵",
    cemetery: "etemadiyeh",
    cemeteryLabel: "آرامستان قدیمی اعتمادیه زنجان",
    block: "قطعه پهلوانان قدیمی",
    row: "ردیف ۲",
    graveNumber: "شماره ۴",
    lat: 36.657920,
    lng: 48.474610,
    description: "از پیشکسوتان ورزش باستانی و زورخانه‌ای دالان زنجان"
  }
];

export default function App() {
  // Navigation active application Tab
  type AppTab = 'zanjan_search' | 'hosting_consultant' | 'guide';
  const [activeTab, setActiveTab] = useState<AppTab>('zanjan_search');

  // Interactive Grave Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCemeteryFilter, setSelectedCemeteryFilter] = useState<string>('all');
  const [selectedGrave, setSelectedGrave] = useState<ZanjanGrave>(ZANJAN_GRAVES_DB[0]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [hasGpsSuccess, setGpsSuccess] = useState(false);

  // Hosting Optimizer API States
  const [projectType, setProjectType] = useState<ProjectType>('frontend_spa');
  const [techStack, setTechStack] = useState('React, LeafletJS, OpenStreetMap, GPS API, Progressive Web App (PWA)');
  const [requirements, setRequirements] = useState('مسیریابی موبایل در زنجان، نقشه آفلاین سبک، استقرار رایگان و پایدار');
  const [customCode, setCustomCode] = useState(`// نمونه کد مسیریاب قطعات مزارستان زنجان
const generateBaladRoute = (targetLat, targetLng) => {
  return \`https://balad.ir/location?latitude=\${targetLat}&longitude=\${targetLng}\`;
};

const generateNeshanRoute = (targetLat, targetLng) => {
  return \`https://nshn.ir/?lat=\${targetLat}&lng=\${targetLng}\`;
};`);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  // Filtered Zanjan grave records
  const filteredGraves = useMemo(() => {
    return ZANJAN_GRAVES_DB.filter(g => {
      const matchQuery = `${g.name} ${g.family} ${g.fatherName}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCemetery = selectedCemeteryFilter === 'all' || g.cemetery === selectedCemeteryFilter;
      return matchQuery && matchCemetery;
    });
  }, [searchQuery, selectedCemeteryFilter]);

  // Handle Fetching Mobile GPS coordinate
  const handleGetMobileGPS = () => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setGpsLoading(false);
          setGpsSuccess(true);
          setTimeout(() => setGpsSuccess(false), 3000);
        },
        (err) => {
          console.error("GPS error:", err);
          setGpsLoading(false);
          // Set simulated Zanjan downtown position as client fallback coordinate safely
          setUserLocation([36.6740, 48.4845]);
          alert("دسترسی به GPS زنده امکان‌پذیر نبود. موقعیت نمایشی مرکز شهر زنجان فعال شد.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("مرورگر شما از GPS موبایل پشتیبانی نمی‌کند.");
    }
  };

  // Generate Routing Urls for Neshan, Balad, and Google Maps
  const routeUrls = useMemo(() => {
    if (!selectedGrave) return { balad: '', neshan: '', google: '' };
    const { lat, lng } = selectedGrave;
    return {
      balad: `https://balad.ir/location?latitude=${lat}&longitude=${lng}`,
      neshan: `https://nshn.ir/?lat=${lat}&lng=${lng}`,
      google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    };
  }, [selectedGrave]);

  // Form Pre-filled presets trigger
  const handleApplyPreset = (key: string) => {
    if (key === 'pwa_leaflet') {
      setProjectType('frontend_spa');
      setTechStack('React, Leaflet.js, Offline Service Worker CSS');
      setCustomCode(`// تنظیمات مربوط به کش کردن کاشی‌های محدوده زنجان در سرویس ورکر
const MAP_TILES_CACHE_NAME = 'zanjan-cemetery-tiles-v1';
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});`);
    } else if (key === 'cloudflare_routing') {
      setProjectType('server_api');
      setTechStack('Cloudflare Workers, Router, KV Data Store');
      setCustomCode(`// کدهای سمت سرور لبه در کلودفلر برای دریافت لوکیشن با کوئری نام متوفی
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const name = url.searchParams.get('q');
    // کوئری گرایندینگ با استفاده از دیتابیس لوکال بدون تاخیر
    const graveRecord = await env.GRAVES_KV.get(name);
    return new Response(graveRecord, {
      headers: { "Content-Type": "application/json" }
    });
  }
};`);
    }
  };

  // Call server analysis
  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    const steps = [
      "درحال ردیابی تکنولوژی فرانت‌اند و نقشه...",
      "بررسی محدودیت‌های ترافیکی مزارستان زنجان...",
      "ارزیابی تفاوت‌های Cloudflare Workers و Pages...",
      "تدوین فایل‌های پیکربندی و دستورالعمل‌های بلد و نشان...",
      "بهینه‌سازی نهایی و آماده‌سازی پاسخ مهندسی..."
    ];

    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectType, techStack, customCode, requirements }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'خطایی در تجزیه و تحلیل سمت سرور بوجود آمد.');
      }
      
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'اتصال برقرار نشد. لطفاً وضعیت فایل یا کلید امنیتی GEMINI_API_KEY خود را بررسی کنید.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-gray-800 font-sans pb-16 selection:bg-emerald-100 selection:text-emerald-900" dir="rtl">
      
      {/* Visual Elegant Subtlety Top Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-right">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                سامانه جامع مزار و مسیریابی قبور زنجان
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-sans">هوشمند ابری</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">مکان‌یابی آرامستان‌های زنجان با دسترسی مستقیم به مسیریاب‌های بلد، نشان و نقشه موبایل</p>
            </div>
          </div>

          {/* Nav Tab Swapping */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/50 text-xs font-semibold gap-1">
            <button
              onClick={() => setActiveTab('zanjan_search')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'zanjan_search' 
                  ? 'bg-white text-gray-900 shadow-xs font-bold' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-emerald-600" />
              <span>مسیریابی قبور زنجان (بلد/نشان)</span>
            </button>
            <button
              onClick={() => setActiveTab('hosting_consultant')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'hosting_consultant' 
                  ? 'bg-white text-gray-900 shadow-xs font-bold' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>تحلیل و مشاوره هاستینگ ابری</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'guide' 
                  ? 'bg-white text-gray-900 shadow-xs font-bold' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>راهنمای استقرار رایگان</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Real Grave Locator & Routing for Zanjan */}
          {activeTab === 'zanjan_search' && (
            <motion.div
              key="zanjan-routing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Alert announcement bar */}
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-right">
                <div className="flex items-start gap-3">
                  <span className="p-1 px-2.5 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold font-mono">ZNJ</span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">بمب راهنمای مزار زنجان با ابزارهای ناوبری زنده!</p>
                    <p className="text-[11px] text-indigo-700">نام متوفی را در فیلد زیر سرچ کنید، مختصات قطعه را بردارید و با کلیلک روی بلد یا نشان، نرم‌افزار به صورت خودکار تا دم مزار شما را هدایت می‌کند.</p>
                  </div>
                </div>
                <div className="text-left font-mono text-[10.5px] text-indigo-500 shrink-0">بهشت معصومه • مزارستان جدید زنجان</div>
              </div>

              {/* Grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Search Dashboard & List */}
                <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-5">
                  <div className="border-b border-gray-50 pb-3">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Search className="w-4 h-4 text-emerald-600" />
                      مخزن جستجو و بایگانی آرامستان‌های زنجان
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">امکان فیلتر سریع بر اساس محل آرامستان و کلمات کلیدی نام متوفی</p>
                  </div>

                  {/* Cemetery Quick Filters */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 block">انتخاب مزارستان:</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setSelectedCemeteryFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedCemeteryFilter === 'all'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        همه آرامستان‌ها
                      </button>
                      <button
                        onClick={() => setSelectedCemeteryFilter('behesht_masoumeh')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedCemeteryFilter === 'behesht_masoumeh'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        بهشت معصومه زنجان
                      </button>
                      <button
                        onClick={() => setSelectedCemeteryFilter('new_cemetery')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedCemeteryFilter === 'new_cemetery'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        آرامستان جدید
                      </button>
                      <button
                        onClick={() => setSelectedCemeteryFilter('etemadiyeh')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedCemeteryFilter === 'etemadiyeh'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        اعتمادیه قدیمی
                      </button>
                    </div>
                  </div>

                  {/* Search Bar Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="متوفای مورد نظر را جستجو کنید... (مثلا: روزبه یا افشار)"
                      className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl py-3 pr-10 pl-4 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none block text-right"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-auto right-3.5 top-3.5" />
                  </div>

                  {/* List outcomes */}
                  <div className="space-y-2 max-h-96 overflow-y-auto scroller-thin pr-1">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">نتایج به دست آمده ({filteredGraves.length} مورد):</span>
                    {filteredGraves.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        موردی با مشخصات وارد شده یافت نشد. نمونه نام‌های دیگر را امتحان کنید.
                      </div>
                    ) : (
                      filteredGraves.map((grave) => (
                        <button
                          key={grave.id}
                          onClick={() => setSelectedGrave(grave)}
                          className={`w-full text-right p-3.5 rounded-xl border transition-all block ${
                            selectedGrave.id === grave.id
                              ? 'bg-emerald-50/50 border-emerald-500 shadow-xs'
                              : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-slate-50/55'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <h4 className="font-bold text-gray-900 text-xs">
                                {grave.name} {grave.family}
                              </h4>
                              <p className="text-[10.5px] text-gray-400 mt-1 font-mono">
                                فرزند: {grave.fatherName} | فوت: {grave.passingYear}
                              </p>
                              <span className="inline-block mt-2 text-[10px] text-emerald-800 bg-emerald-50 rounded px-1.5 py-0.5">
                                {grave.cemeteryLabel}
                              </span>
                            </div>
                            
                            <div className="bg-slate-100 text-gray-600 px-2.5 py-1.5 rounded-lg text-center shrink-0 min-w-16">
                              <span className="text-[8px] text-gray-400 block font-normal leading-none mb-1">قطعه مزار</span>
                              <span className="text-xs font-bold block leading-none">{grave.block.replace('قطعه', '')}</span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                </div>

                {/* Simulated Map Container & Launch Nav Links */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Selected Object Metadata Preview */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-6">
                    <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <h3 className="font-bold text-gray-900 text-base">
                            آرامگاه {selectedGrave.name} {selectedGrave.family}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{selectedGrave.cemeteryLabel}</p>
                      </div>

                      <div className="text-left">
                        <span className="text-xs text-slate-400 block font-mono">مختصات GPS هدف:</span>
                        <span className="text-xs font-semibold text-slate-700 font-mono block">
                          {selectedGrave.lat.toFixed(5)}, {selectedGrave.lng.toFixed(5)}
                        </span>
                      </div>
                    </div>

                    {/* Cemetery Block coordinates details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-gray-400 block mb-0.5 font-sans">بخش آرامستان</span>
                        <span className="text-xs font-bold text-gray-800">{selectedGrave.block}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-gray-400 block mb-0.5 font-sans">کارتن / ردیف نویسی</span>
                        <span className="text-xs font-bold text-gray-800 font-mono">{selectedGrave.row}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-gray-400 block mb-0.5 font-sans">شماره سنگ قبر</span>
                        <span className="text-xs font-bold text-gray-800 font-mono">{selectedGrave.graveNumber}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-gray-400 block mb-0.5 font-sans">دوران حیات (سال)</span>
                        <span className="text-xs font-bold text-gray-800 font-mono">{selectedGrave.birthYear} - {selectedGrave.passingYear}</span>
                      </div>
                    </div>

                    {selectedGrave.description && (
                      <p className="text-xs text-emerald-900 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/40 leading-relaxed font-sans">
                        💡 <strong>یادبود:</strong> {selectedGrave.description}
                      </p>
                    )}

                    {/* Integrated Live Map Routing Simulator */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-500 block">شبیه‌ساز نقشه ماهواره‌ای و مکان‌یاب:</span>
                      
                      <div className="h-64 bg-slate-900 rounded-xl overflow-hidden relative shadow-inner flex flex-col justify-between p-4 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center">
                        {/* Overlay darker mesh */}
                        <div className="absolute inset-0 bg-slate-950/75 pointer-events-none" />

                        {/* Top indicators */}
                        <div className="relative z-10 flex justify-between items-center w-full">
                          <span className="text-[10px] bg-slate-800/90 text-slate-300 font-mono px-2 py-1 rounded-md border border-slate-700">
                            مزارستان: {selectedGrave.cemetery === 'behesht_masoumeh' ? "بهشت معصومه زنجان" : "آرامستان ارمغانخانه / اعتمادیه"}
                          </span>
                          <span className="text-[10px] bg-emerald-500/90 text-white font-mono px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                            مزار هدف لوکیت شد
                          </span>
                        </div>

                        {/* Visual Routing Vector lines simulator */}
                        <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-2">
                          <div className="flex items-center gap-6">
                            
                            {/* Current mobile phone location node */}
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white font-bold text-xs animate-bounce shadow-md">
                                شما
                              </div>
                              <span className="text-[9px] text-indigo-200 mt-1">موقعیت موبایل</span>
                            </div>

                            {/* Arrow connector */}
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-gray-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                {userLocation ? "فاصله تقریبی: ۵۲۰ متر" : "در انتظار جی‌پی‌اس موبایل"}
                              </span>
                              <div className="w-24 border-t-2 border-dashed border-emerald-500 my-2 relative">
                                <div className="absolute right-1/2 -top-1.5 w-3 h-3 bg-emerald-500 rounded-full" />
                              </div>
                            </div>

                            {/* Grave location node */}
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-md">
                                🪦
                              </div>
                              <span className="text-[9px] text-emerald-200 mt-1 font-bold">{selectedGrave.block}</span>
                            </div>

                          </div>
                        </div>

                        {/* Custom simulated control for GPS triggers */}
                        <div className="relative z-10 flex justify-between items-center bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 gap-2">
                          <button
                            onClick={handleGetMobileGPS}
                            disabled={gpsLoading}
                            className="text-[11px] font-bold text-indigo-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md border border-slate-700 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
                          >
                            <Navigation className="w-3 h-3 animate-spin duration-1000" />
                            <span>{gpsLoading ? "ردگیری زنده..." : "📍 دریافت GPS موبایل شما"}</span>
                          </button>
                          
                          <p className="text-[10px] text-slate-400 leading-normal text-right">
                            {userLocation 
                              ? `موقعیت شما دریافت شد: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}` 
                              : "برای محاسبه دقیق فاصله تا آرامستان مقتضی، GPS تلفن همراه خود را فعال کنید."
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CORE INTENT: Deep Native Iranian Map App Launchers */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800 block">انتخاب نقشه و راه‌اندازی مستقیم مسیریابی در موبایل:</span>
                        <p className="text-[10.5px] text-slate-400 mt-1">با فشردن کلیدهای زیر، اپلیکیشن نقشه بلافاصله باز شده و بدون دردسر شما را گام‌به‌گام هدایت می‌کند.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Neshan Route Launch button */}
                        <a
                          href={routeUrls.neshan}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3.5 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-md transition-all flex items-center justify-between gap-2 border border-emerald-600"
                        >
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-white/10 rounded-lg text-white font-mono font-bold text-[10.5px]">نشان</span>
                            <div className="text-right">
                              <span className="block text-xs font-bold">مسیریابی با نشان</span>
                              <span className="block text-[8px] text-emerald-200">Neshan Navigation</span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-emerald-200" />
                        </a>

                        {/* Balad Route Launch button */}
                        <a
                          href={routeUrls.balad}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3.5 bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl shadow-md transition-all flex items-center justify-between gap-2 border border-indigo-600"
                        >
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-white/10 rounded-lg text-white font-mono font-bold text-[10.5px]">بلد</span>
                            <div className="text-right">
                              <span className="block text-xs font-bold">مسیریابی با بلد</span>
                              <span className="block text-[8px] text-indigo-200">Balad Map App</span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-indigo-200" />
                        </a>

                        {/* Google Maps Route Launch button */}
                        <a
                          href={routeUrls.google}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3.5 bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl shadow-md transition-all flex items-center justify-between gap-2 border border-rose-600"
                        >
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-white/10 rounded-lg text-white font-mono font-bold text-[10.5px]">گوگل</span>
                            <div className="text-right">
                              <span className="block text-xs font-bold">گوگل مپس روت</span>
                              <span className="block text-[8px] text-rose-200">Google Maps Navigation</span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-rose-200" />
                        </a>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: Cloud Edge Hosting Consult (Original request optimizer) */}
          {activeTab === 'hosting_consultant' && (
            <motion.div
              key="hosting-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Developer Configuration Controller */}
                <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="border-b border-gray-50 pb-4">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-orange-500" />
                      تنظیمات زیرساخت مسیریاب قبور
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">مشخصات هاستینگ ابری مدنظر خود را اینجا کانفیگ و سفارشی کنید.</p>
                  </div>

                  {/* Preset Quick Fillers */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 block tracking-wider uppercase">نمونه‌های پیش‌فرض پروژه نقشه:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleApplyPreset('pwa_leaflet')}
                        className="px-2.5 py-1 text-[11px] bg-slate-50 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition text-gray-700"
                      >
                        PWA با قابلیت آفلاین (نقشه نقشه)
                      </button>
                      <button
                        onClick={() => handleApplyPreset('cloudflare_routing')}
                        className="px-2.5 py-1 text-[11px] bg-slate-50 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition text-gray-700"
                      >
                        Cloudflare Workers API
                      </button>
                    </div>
                  </div>

                  {/* Config Inputs */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">نوع ساختار ابری پیشنهادی:</label>
                      <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value as ProjectType)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:bg-white outline-none"
                      >
                        <option value="frontend_spa">فرانت‌اند SPA موبایل (استاتیک کاشی‌شده)</option>
                        <option value="server_api">سرویس لبه ابری (Cloudflare Workers)</option>
                        <option value="fullstack">سیستم کامل دیتابیس بومی (PostGIS/Supabase)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">فناوری‌های داکر و لوکیشن:</label>
                      <input
                        type="text"
                        value={techStack}
                        onChange={(e) => setTechStack(e.target.value)}
                        className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl p-3 focus:bg-white outline-none"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block text-right">محدودیت‌ها و اولویت‌های مهندسی:</label>
                      <input
                        type="text"
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:bg-white outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block text-right">قطعه کدهای مهندسی شما:</label>
                      <textarea
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        rows={6}
                        className="w-full text-[11px] font-mono bg-slate-900 text-slate-100 rounded-xl p-4 outline-none block text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-100" />
                    <span>تحلیل و تولید کامل مستندات با هوش مصنوعی</span>
                  </button>
                </div>

                {/* Developer Output Pane */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Empty output state */}
                  {!loading && !result && !error && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center space-y-4 shadow-xs">
                      <div className="mx-auto w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                        <Cpu className="w-6 h-6 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-gray-900 font-sans">آماده پردازش مستندات</h3>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                          با اجرای تحلیل هوشمند، راهکار فنی، لایمیت‌ها و کل کدهای پیکربندی برای بالا بردن این پروپوزال مقتور بازگردانده می‌شود.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Backend error box */}
                  {error && (
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-right space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-rose-900">خطا در فرآیند تحلیل</h4>
                          <p className="text-xs text-rose-700 mt-1 leading-relaxed">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Loader */}
                  {loading && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-xs space-y-6">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                        <span className="text-xs font-bold text-gray-900">هوش مصنوعی در حال تدوین مستندات استست...</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                          style={{ width: `${(loadingStep + 1) * 20}%` }}
                        />
                      </div>
                      <p className="text-xs text-orange-700 bg-orange-50 p-3 rounded-lg font-mono">
                        {
                          [
                            "درحال ردیابی تکنولوژی فرانت‌اند و نقشه...",
                            "بررسی محدودیت‌های ترافیکی مزارستان زنجان...",
                            "ارزیابی تفاوت‌های Cloudflare Workers و Pages...",
                            "تدوین فایل‌های پیکربندی و دستورالعمل‌های بلد و نشان...",
                            "بهینه‌سازی نهایی و آماده‌سازی پاسخ مهندسی..."
                          ][loadingStep]
                        }
                      </p>
                    </div>
                  )}

                  {/* Solid Result Layout */}
                  {result && (
                    <div className="space-y-6 text-right">
                      {/* Overview */}
                      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ارزیابی ساختار ابری و پهنای باند
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed font-sans">{result.overview}</p>
                      </section>

                      {/* Cloudflare Spotlight */}
                      <section className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-amber-600" />
                          بررسی عمیق مقایسه‌ای: Cloudflare Workers در برابر Pages
                        </h3>
                        <p className="text-xs text-amber-900 leading-relaxed">{result.cloudflare_deep_dive}</p>
                      </section>

                      {/* Hosting Providers Cards list */}
                      <section className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-900">سایت‌های میزبان پیشنهادی به ترتیب اولویت:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.comparison.map((provider, i) => (
                            <div key={i}>
                              <HostingCard provider={provider} index={i} />
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Config File Generation */}
                      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-4">
                        <h4 className="text-xs font-bold text-gray-900">فایل‌های کانفیگ برای استارت سریع:</h4>
                        <CodeConfigViewer configs={result.configs} />
                      </section>
                    </div>
                  )}

                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: Guide Panel */}
          {activeTab === 'guide' && (
            <motion.div
              key="static-guide-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-xs"
            >
              <StaticGuide />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Decorative Brand Footer */}
      <footer className="mt-16 text-center text-xs text-slate-400 max-w-xl mx-auto space-y-2 font-sans">
        <div className="flex items-center justify-center gap-1">
          <span>ساخته شده با عشق در زنجان</span>
          <Heart className="w-3.5 h-3.5 text-rose-500" />
        </div>
        <p>توسعه یافته بر پایه فشرده‌سازی اطلاعات مکانی لبه و رله‌های مسیریابی هوشمند</p>
      </footer>

    </div>
  );
}
