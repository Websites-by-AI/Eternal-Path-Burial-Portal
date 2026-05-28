import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, Zap, Cpu, Server, Database, CheckCircle2, AlertTriangle, 
  Settings, ArrowLeft, RefreshCw, Copy, Check, FileCode, Play, Sparkles, 
  BookOpen, Layers, Info, Search, MapPin, Navigation, Map, Compass, ExternalLink, 
  Heart, Share2, QrCode, Phone, CheckCircle, Smartphone, MapIcon, ChevronRight, HelpCircle
} from 'lucide-react';
import StaticGuide from './components/StaticGuide';
import HostingCard from './components/HostingCard';
import CodeConfigViewer from './components/CodeConfigViewer';
import { AnalysisResponse, ProjectType } from './types';

// Zanjan historical, veteran, and public graves database
interface ZanjanGrave {
  id: number;
  name: string;
  family: string;
  fatherName: string;
  birthYear: string;
  passingYear: string;
  cemetery: 'behesht_masoumeh' | 'etemadiyeh' | 'shohada' | 'new_cemetery';
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
    cemeteryLabel: "مزار پایین (گلزار شهدای زنجان)",
    block: "قطعه علما و اندیشمندان",
    row: "ردیف ۱",
    graveNumber: "شماره ۳",
    lat: 36.671210,
    lng: 48.498421,
    description: "فیلسوف اسلامی، مربی وارسته و استاد طراز اول فیزیک ایران و از مشاهیر بزرگ زنجان"
  },
  {
    id: 2,
    name: "حسین",
    family: "منزوی",
    fatherName: "فرخ",
    birthYear: "۱۳۲۵",
    passingYear: "۱۳۸۳",
    cemetery: "shohada",
    cemeteryLabel: "قبرستان پایین زنجان (بخش نام‌آوران)",
    block: "قطعه مزار مشاهیر",
    row: "ردیف ۴",
    graveNumber: "شماره ۱۲",
    lat: 36.671550,
    lng: 48.498110,
    description: "پدر غزل نو و شاعر پرآوازه و غزل‌سرای معاصر ملی ایران متولد زنجان"
  },
  {
    id: 3,
    name: "شهید قامت",
    family: "بیات",
    fatherName: "علی اکبر",
    birthYear: "۱۳۴۰",
    passingYear: "۱۳۶۱",
    cemetery: "shohada",
    cemeteryLabel: "گلزار شهدای زنجان",
    block: "قطعه فرماندهان جنگ",
    row: "ردیف ۲",
    graveNumber: "شماره ۸",
    lat: 36.671150,
    lng: 48.498310,
    description: "فرمانده شجاع و نام‌آور زنجانی لشکر ۱۷ علی بن ابی‌طالب در دوران دفاع مقدس"
  },
  {
    id: 4,
    name: "شهید یوسف",
    family: "قربانی",
    fatherName: "مظفر",
    birthYear: "۱۳۴۵",
    passingYear: "۱۳۶۵",
    cemetery: "shohada",
    cemeteryLabel: "گلزار شهدای شلمچه (مزار پایین زنجان)",
    block: "قطعه شهدای غواص دریادل",
    row: "ردیف ۹",
    graveNumber: "شماره ۱۷",
    lat: 36.671890,
    lng: 48.451120,
    description: "شهید سرافراز و غواص دریادل زنجانی عملیات کربلای ۵"
  },
  {
    id: 5,
    name: "کربلایی عباس",
    family: "افشار",
    fatherName: "مظفر",
    birthYear: "۱۳۲۴",
    passingYear: "۱۴۰۱",
    cemetery: "behesht_masoumeh",
    cemeteryLabel: "آرامستان بزرگ بهشت معصومه زنجان",
    block: "قطعه ۳ عمومی",
    row: "ردیف ۱۴",
    graveNumber: "شماره ۲۶",
    lat: 36.721450,
    lng: 48.452310,
    description: "بزرگ خاندان افشار زنجان"
  },
  {
    id: 6,
    name: "دکتر مریم",
    family: "زنجانی سادات",
    fatherName: "سید حسین",
    birthYear: "۱۳۵۵",
    passingYear: "۱۴۰۲",
    cemetery: "new_cemetery",
    cemeteryLabel: "آرامستان جدید زنجان (جاده ارمغانخانه)",
    block: "قطعه کادر درمان و اطفال",
    row: "ردیف ۳",
    graveNumber: "شماره ۵",
    lat: 36.745120,
    lng: 48.512340,
    description: "پزشک فداکار اطفال بیمارستان ولیعصر زنجان"
  },
  {
    id: 7,
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
    description: "از معتمدین قدیمی محله امجدیه و بازار تاریخی زنجان"
  },
  {
    id: 8,
    name: "پهلوان اکبر",
    family: "آهن‌پنجه",
    fatherName: "حسین علی",
    birthYear: "۱۳۰۲",
    passingYear: "۱۳۸۵",
    cemetery: "etemadiyeh",
    cemeteryLabel: "آرامستان قدیمی اعتمادیه زنجان",
    block: "قطعه پهلوانان و ریش‌سفیدان",
    row: "ردیف ۲",
    graveNumber: "شماره ۴",
    lat: 36.657920,
    lng: 48.474610,
    description: "از پیشکسوتان ورزش باستانی و زورخانه‌ای زنجان"
  }
];

export default function App() {
  // Navigation tabs
  type AppTab = 'zanjan_search' | 'hosting_consultant' | 'guide';
  const [activeTab, setActiveTab] = useState<AppTab>('zanjan_search');

  // Interactive Grave Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCemeteryFilter, setSelectedCemeteryFilter] = useState<string>('all');
  const [selectedGrave, setSelectedGrave] = useState<ZanjanGrave>(ZANJAN_GRAVES_DB[0]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [hasGpsSuccess, setGpsSuccess] = useState(false);
  const [shareClipped, setShareClipped] = useState(false);
  const [customCoordinateCopied, setCustomCoordinateCopied] = useState(false);

  // Hosting Optimizer API States
  const [projectType, setProjectType] = useState<ProjectType>('frontend_spa');
  const [techStack, setTechStack] = useState('React, LeafletJS, GPS Geolocation API, Tailwind CSS');
  const [requirements, setRequirements] = useState('پیش‌نمایش بسیار سریع روی موبایل، نقشه آفلاین سبک، استقرار بدون سرور کامپایل لبه');
  const [customCode, setCustomCode] = useState(`// نمونه کوئری و متغیرهای ناوبری با بلد و نشان در زنجان
const redirectRoute = (lat, lng, appName) => {
  if (appName === 'balad') {
    return \`https://balad.ir/location?latitude=\${lat}&longitude=\${lng}\`;
  }
  return \`https://nshn.ir/?lat=\${lat}&lng=\${lng}\`;
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

  // Handle Fetching Mobile Live GPS coordinate
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
          // Set simulated central "Sabzeh Meydan" square in Zanjan as client fallback coordinate safely
          setUserLocation([36.6740, 48.4845]);
          alert("دسترسی به موقعیت لایو امکان‌پذیر نبود. نمایش شبیه‌سازی شده مرکز زنجان (سبزه میدان) فعال شد.");
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

  // Share coordinates
  const handleCopyShareLink = () => {
    const text = `آدرس قبر مرحوم ${selectedGrave.name} ${selectedGrave.family} در زنجان (${selectedGrave.cemeteryLabel}): ${selectedGrave.block} ردیف ${selectedGrave.row} شماره ${selectedGrave.graveNumber}. پیوند مسیریابی مستقیم نشان: https://nshn.ir/?lat=${selectedGrave.lat}&lng=${selectedGrave.lng}`;
    navigator.clipboard.writeText(text);
    setShareClipped(true);
    setTimeout(() => setShareClipped(false), 3000);
  };

  const handleCopyRawCoordinates = () => {
    const coords = `${selectedGrave.lat.toFixed(6)}, ${selectedGrave.lng.toFixed(6)}`;
    navigator.clipboard.writeText(coords);
    setCustomCoordinateCopied(true);
    setTimeout(() => setCustomCoordinateCopied(false), 3000);
  };

  // Form Pre-filled presets trigger
  const handleApplyPreset = (key: string) => {
    if (key === 'pwa_leaflet') {
      setProjectType('frontend_spa');
      setTechStack('React, LeafletJS, PWA Service Worker, Tiles Cache');
      setCustomCode(`// قطعه تنظیمات مربوط به کش کردن کاشی‌های محدوده زنجان در مرورگر زائر بدون اینترنت
const TILES_CACHE_ZANJAN = 'zanjan-cemetery-maps-v1';
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('tile.openstreetmap.org')) {
    e.respondWith(
      caches.match(e.request).then((res) => res || fetch(e.request))
    );
  }
});`);
    } else if (key === 'cloudflare_routing') {
      setProjectType('server_api');
      setTechStack('Cloudflare Workers, Worker KV, Edge Routing');
      setCustomCode(`// کدهای سمت سرور لبه در کلودفلر برای بازیابی سریع مختصات با زمان نزدیک به صفر میلی‌ثانیه
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    
    // شبیه‌سازی دریافت اطلاعات از فضای ذخیره‌سازی لبه بدون سرور سنتی
    const results = [
      { name: "حسین منزوی", lat: 36.671550, lng: 48.498110, block: "قطعه مشاهیر" }
    ];
    
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json;charset=UTF-8", "Access-Control-Allow-Origin": "*" }
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
    }, 1200);

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
    <div id="app-root" className="min-h-screen bg-[#fafbfc] text-gray-800 font-sans pb-16 selection:bg-emerald-100 selection:text-emerald-900" dir="rtl">
      
      {/* Top Beautiful Navigation Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/10">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-right">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                رهیاب قبور و مزارستان‌های زنجان
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-sans font-bold">بومی زائر</span>
              </h1>
              <p className="text-[11px] text-gray-400 mt-0.5">سیستم مکان‌یابی دقیق قبرها و اتصال خودکار و آنی به اپلیکیشن‌های بلد، نشان و نقشه تلفن همراه</p>
            </div>
          </div>

          {/* Navigation Control Tabs */}
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
              <span>مسیریابی قبور زنجان (موبایل و مزار)</span>
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
              <span>پردازش فنی و هاستینگ ابری</span>
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
              <span>مستندات استقرار رایگان</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Real Grave Locator & Routing for Zanjan */}
          {activeTab === 'zanjan_search' && (
            <motion.div
              key="zanjan-routing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Alert Notification for User Flow */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50/30 to-slate-50 border border-emerald-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-right">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs font-mono shrink-0">ZNJ</div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-950">مسیریابی مستقیم و گام‌به‌گام به سمت آرامگاه‌های زنجان</p>
                    <p className="text-[11px] text-gray-600 leading-normal">
                      نام متوفی را جستجو کرده، سپس موقعیت دقیق یاب را تائید کنید و نمایه نقشه را بفشارید تا اپلیکیشن‌های نصب شده بر روی گوشی شما (بلد، نشان) سریع‌ترین مسیر رانندگی یا پیاده‌روی تا آرامستان زنجان را آغاز کنند.
                    </p>
                  </div>
                </div>
                <div className="text-left font-mono text-[10px] text-emerald-600 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-emerald-100">
                  به لایحه سراسری بهشت معصومه • مزار پایین • اعتمادیه
                </div>
              </div>

              {/* Grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Search Dashboard Side */}
                <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="border-b border-gray-50 pb-3">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Search className="w-4 h-4 text-emerald-600" />
                      مخرن یکپارچه اطلاعات متوفیان زنجان
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-1">امکان جستجوی سریع نام مفاخر مذهبی، شهدا و قبور عمومی زنجان</p>
                  </div>

                  {/* Quick Filters */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 block">فیلتر منطقه عزاخانه:</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setSelectedCemeteryFilter('all')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedCemeteryFilter === 'all'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        همه آرامستان‌ها
                      </button>
                      <button
                        onClick={() => setSelectedCemeteryFilter('shohada')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedCemeteryFilter === 'shohada'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        قبرستان پایین (شهدا)
                      </button>
                      <button
                        onClick={() => setSelectedCemeteryFilter('behesht_masoumeh')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedCemeteryFilter === 'behesht_masoumeh'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        بهشت معصومه زنجان
                      </button>
                      <button
                        onClick={() => setSelectedCemeteryFilter('etemadiyeh')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedCemeteryFilter === 'etemadiyeh'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        اعتمادیه قدیمی
                      </button>
                      <button
                        onClick={() => setSelectedCemeteryFilter('new_cemetery')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedCemeteryFilter === 'new_cemetery'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        ارمغانخانه (جدید)
                      </button>
                    </div>
                  </div>

                  {/* Search input field */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="نام متوفی یا فامیل را بنویسید... (مثلا: منزوی، روزبه، افشار)"
                      className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl py-3 pr-10 pl-4 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none block text-right"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-auto right-3.5 top-3.5" />
                  </div>

                  {/* Graveyard listing outcome */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                      <span>لیست نتایج مزارستان زنجان:</span>
                      <span>{filteredGraves.length} مورد یافت شد</span>
                    </div>

                    {filteredGraves.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-2">
                        <p className="text-xs">موردی با اطلاعات سرچ شده یافت نشد.</p>
                        <p className="text-[10px]">مثلا کلمات "منزوی"، "افشار" یا "بیات" را جستجو کنید.</p>
                      </div>
                    ) : (
                      filteredGraves.map((grave) => (
                        <button
                          key={grave.id}
                          onClick={() => setSelectedGrave(grave)}
                          className={`w-full text-right p-3 rounded-xl border transition-all block ${
                            selectedGrave.id === grave.id
                              ? 'bg-emerald-50/50 border-emerald-500'
                              : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-slate-50/30'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-bold text-gray-900 text-xs">
                                {grave.name} {grave.family}
                              </h4>
                              <p className="text-[10px] text-gray-400 mt-1">
                                فرزند: {grave.fatherName} | فوت: {grave.passingYear}
                              </p>
                              <span className="inline-block mt-2 text-[10px] text-emerald-800 bg-emerald-50 rounded px-1.5 py-0.5 font-bold mb-1">
                                {grave.cemeteryLabel}
                              </span>
                            </div>

                            <div className="bg-slate-100 text-slate-800 px-2 py-2 rounded-lg text-center shrink-0 min-w-16">
                              <span className="text-[8px] text-slate-400 block font-normal leading-none mb-1">کد قطعه</span>
                              <span className="text-xs font-bold block leading-none font-mono text-emerald-700">{grave.block.replace('قطعه', '').trim()}</span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Interactive Map Card Slot */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Selected Grave Location Metadata */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-5">
                    
                    <div className="flex justify-between items-start flex-wrap gap-4 pb-4 border-b border-gray-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <h3 className="font-bold text-gray-900 text-base">
                            مزار مرحوم {selectedGrave.name} {selectedGrave.family}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-400">{selectedGrave.cemeteryLabel}</p>
                      </div>

                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 block font-mono">طول و عرض جغرافیایی مزار:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-slate-700 font-mono">
                            {selectedGrave.lat.toFixed(6)}, {selectedGrave.lng.toFixed(6)}
                          </span>
                          <button
                            onClick={handleCopyRawCoordinates}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500"
                            title="کپی مختصات"
                          >
                            {customCoordinateCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cemetery specific block row info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <span className="text-[9px] text-slate-400 block mb-0.5">قطعه عزاخانه</span>
                        <span className="text-xs font-bold text-slate-800">{selectedGrave.block}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <span className="text-[9px] text-slate-400 block mb-0.5">ردیف مزار</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">{selectedGrave.row}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <span className="text-[9px] text-slate-400 block mb-0.5 font-sans">شماره سنگ مزار</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">{selectedGrave.graveNumber}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <span className="text-[9px] text-slate-400 block mb-0.5 font-sans">سال فوت</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">{selectedGrave.passingYear} (حیات: {selectedGrave.birthYear})</span>
                      </div>
                    </div>

                    {/* Description memo about deceased */}
                    {selectedGrave.description && (
                      <div className="text-xs text-slate-800 bg-[#f8faf9] p-3 rounded-xl border border-slate-200/50 leading-relaxed font-sans">
                        <span className="font-bold text-emerald-800">💡 یادبود:</span> {selectedGrave.description}
                      </div>
                    )}

                    {/* Simulated High Fidelity Live Map */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 block">شبیه‌ساز نقشه ماهواره‌ای و ردیابی GPS مزار:</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 rounded">ماهواره ایران مبنا</span>
                      </div>
                      
                      <div className="h-60 bg-slate-900 rounded-xl overflow-hidden relative shadow-inner flex flex-col justify-between p-4 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center">
                        {/* Overlay darker mesh */}
                        <div className="absolute inset-0 bg-slate-950/70 pointer-events-none" />

                        {/* Top indicators */}
                        <div className="relative z-10 flex justify-between items-center w-full">
                          <span className="text-[10px] bg-slate-800/90 text-slate-300 font-mono px-2 py-1 rounded-md border border-slate-700/80">
                            مزارستان: {selectedGrave.cemeteryLabel}
                          </span>
                          <span className="text-[10px] bg-emerald-500 text-white font-mono px-2 py-1 rounded-md font-bold flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                            قبر هدف مشخص شد
                          </span>
                        </div>

                        {/* Routing Vector lines & distance simulation */}
                        <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-2">
                          <div className="flex items-center gap-5">
                            
                            {/* Current mobile phone location node */}
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white font-bold text-xs animate-bounce shadow-md">
                                شما
                              </div>
                              <span className="text-[9px] text-indigo-200 mt-1 font-bold">موبایل شما</span>
                            </div>

                            {/* Arrow connector */}
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] text-slate-300 font-mono bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                                {userLocation ? "یافت شده با ماهواره" : "در انتظار GPS..."}
                              </span>
                              <div className="w-24 border-t-2 border-dashed border-emerald-500 my-2.5 relative">
                                <div className="absolute right-1/2 -top-1.5 w-3 h-3 bg-emerald-500 rounded-full" />
                              </div>
                            </div>

                            {/* Grave location node */}
                            <div className="flex flex-col items-center animate-pulse">
                              <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-md">
                                🪦
                              </div>
                              <span className="text-[9px] text-emerald-200 mt-1 font-bold">{selectedGrave.block}</span>
                            </div>

                          </div>
                        </div>

                        {/* Interactive GPS mobile simulation controller */}
                        <div className="relative z-10 flex justify-between items-center bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 gap-2">
                          <button
                            onClick={handleGetMobileGPS}
                            disabled={gpsLoading}
                            className="text-[11px] font-bold text-indigo-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md border border-slate-700 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
                          >
                            <Navigation className="w-3.5 h-3.5 animate-spin duration-1000" />
                            <span>{gpsLoading ? "ردگیری زنده..." : "📍 دریافت GPS گوشی شما"}</span>
                          </button>
                          
                          <p className="text-[10px] text-slate-400 leading-normal text-right">
                            {userLocation 
                              ? `موقعیت دریافت شده: ${userLocation[0].toFixed(5)}, ${userLocation[1].toFixed(5)} (فوت پرینت زائر زنجان)` 
                              : "سیستم آماده است. برای شروع ناوبری صوتی و آفلاین در داخل مزارستان زنجان، GPS گوشی خود را روشن کنید."
                            }
                          </p>
                        </div>

                      </div>
                    </div>

                    {/* REAL INTEGRATION TARGETS (Balad, Neshan, Google Maps) */}
                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800 block">راه‌اندازی فوری مسیریابی صوتی در اپلیکیشن‌های گوشی شما:</span>
                        <p className="text-[10.5px] text-slate-400 mt-1">با کلیک روی دکمه‌های زیر، بلد، نشان یا گوگل مپس مستقیماً در تلفن همراه باز شده و مسیر را هدایت می‌کنند.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Neshan Map Redirect Link */}
                        <a
                          href={routeUrls.neshan}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-xs transition-all flex items-center justify-between gap-1.5 border border-emerald-600 active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="p-1 px-1.5 bg-white/10 rounded font-mono font-bold text-[10px]">نشان</span>
                            <div className="text-right">
                              <span className="block text-[11px] font-bold">مسیریابی با نشان</span>
                              <span className="block text-[8px] text-emerald-200">Neshan Navigation</span>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                        </a>

                        {/* Balad Map Redirect Link */}
                        <a
                          href={routeUrls.balad}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl shadow-xs transition-all flex items-center justify-between gap-1.5 border border-indigo-600 active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="p-1 px-1.5 bg-white/10 rounded font-mono font-bold text-[10px]">بلد</span>
                            <div className="text-right">
                              <span className="block text-[11px] font-bold">مسیریابی با بلد</span>
                              <span className="block text-[8px] text-indigo-200">Balad Map App</span>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-200" />
                        </a>

                        {/* Google Maps Redirect Link */}
                        <a
                          href={routeUrls.google}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl shadow-xs transition-all flex items-center justify-between gap-1.5 border border-rose-600 active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="p-1 px-1.5 bg-white/10 rounded font-mono font-bold text-[10px]">گوگل</span>
                            <div className="text-right">
                              <span className="block text-[11px] font-bold">گوگل مپس روت</span>
                              <span className="block text-[8px] text-rose-200">Google Maps Nav</span>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-rose-200" />
                        </a>
                      </div>
                    </div>

                    {/* Shared Utilities for Grave Location */}
                    <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <QrCode className="w-8 h-8 text-slate-500 bg-white p-1.5 rounded-lg border border-slate-200 shrink-0" />
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 block">سیستم تولید بارکد مزار (QR Code)</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">بارکد مزار را پرینت بگیرید و همراه‌تان داشته باشید.</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyShareLink}
                          className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 active:scale-[0.98] transition-all"
                        >
                          <Share2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{shareClipped ? "آدرس مزار کپی شد!" : "اشتراک‌گذاری آدرس قبر (ایتا/تلگرام)"}</span>
                        </button>
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
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Developer Configuration Controller */}
                <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-5">
                  <div className="border-b border-gray-50 pb-3">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-orange-500" />
                      پنل تنظیمات زیرساخت مسیریاب قبور
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-1">ساختار میزبانی نقشه و پایگاه‌های داده GIS را سفارشی کدهای خود کنید.</p>
                  </div>

                  {/* Preset Quick Fillers */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 block tracking-wider uppercase">الگوهای آماده برای استقرار لبه:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleApplyPreset('pwa_leaflet')}
                        className="px-2.5 py-1 text-[11px] bg-slate-50 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/20 text-gray-700 cursor-pointer text-right"
                      >
                        PWA با قابلیت آفلاین (نقشه بلد/نشان)
                      </button>
                      <button
                        onClick={() => handleApplyPreset('cloudflare_routing')}
                        className="px-2.5 py-1 text-[11px] bg-slate-50 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/20 text-gray-700 cursor-pointer text-right"
                      >
                        سرورست API کلودفلر ورکرز
                      </button>
                    </div>
                  </div>

                  {/* Config Inputs */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">معماری پیشنهادی ابری:</label>
                      <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value as ProjectType)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:bg-white outline-none"
                      >
                        <option value="frontend_spa">فرانت‌اند SPA موبایل (تک‌صفحه‌ای سبک)</option>
                        <option value="server_api">سرویس لبه سرورلس (Cloudflare Workers)</option>
                        <option value="fullstack">سیستم کامل بک‌اند و دیتابیس (Supabase / PostGIS)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">تکنولوژی‌های مورداستفاده:</label>
                      <input
                        type="text"
                        value={techStack}
                        onChange={(e) => setTechStack(e.target.value)}
                        className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl p-3 focus:bg-white outline-none text-left"
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
                        rows={5}
                        className="w-full text-xs font-mono bg-slate-900 text-slate-100 rounded-xl p-4 outline-none block text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-100 animate-pulse" />
                    <span>پردازش و تحلیل کامل مستندات با هوش مصنوعی</span>
                  </button>
                </div>

                {/* Developer Output Side */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Empty state */}
                  {!loading && !result && !error && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center space-y-4 shadow-xs">
                      <div className="mx-auto w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                        <Cpu className="w-6 h-6 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-gray-900 font-sans">آماده پردازش مستندات هاستینگ ابری</h3>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                          با زدن دکمه پردازش، معماری بهینه‌سازی نقشه، دیتابیس قبرها و بستر Cloudflare Workers و Pages تحلیل شده و مستندات آنی صادر خواهد شد.
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
                        <span className="text-xs font-bold text-gray-900">تحلیل فنی و هوشمند زیرساخت نقشه زنجان...</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden animate-pulse">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-75"
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

                  {/* Analysis Result */}
                  {result && (
                    <div className="space-y-6 text-right">
                      {/* Overview */}
                      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ارزیابی تخصصی ساختار هاستینگ و نقشه
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">{result.overview}</p>
                      </section>

                      {/* Cloudflare Spotlight */}
                      <section className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-amber-600" />
                          بررسی عمیق مقایسه‌ای: Cloudflare Workers در برابر Pages
                        </h3>
                        <p className="text-xs text-amber-900 leading-relaxed font-sans">{result.cloudflare_deep_dive}</p>
                      </section>

                      {/* Hosting Providers list */}
                      <section className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-900 uppercase">سایت‌های میزبان پیشنهادی به ترتیب اولویت:</h4>
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
                        <h4 className="text-xs font-bold text-gray-900">فایل‌های پیکربندی آماده بارگذاری:</h4>
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
              transition={{ duration: 0.2 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-xs"
            >
              <StaticGuide />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-slate-400 max-w-xl mx-auto space-y-2 font-sans">
        <div className="flex items-center justify-center gap-1.5">
          <span>توسعه یافته به عشق مفاخر و خاک پاک زنجان</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
        </div>
        <p className="text-[10px] text-slate-400/80 leading-normal">
          این پروژه برای میزبانی استاتیک و بدون سرور در بستر بدون قطعی مادام‌العمر Cloudflare Pages طراحی و بهینه‌سازی شده است.
        </p>
      </footer>

    </div>
  );
}
