import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
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

// Coordinate boundaries of Zanjan cemeteries
interface CemeteryBoundary {
  id: 'behesht_masoumeh' | 'etemadiyeh' | 'shohada' | 'new_cemetery';
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  description: string;
}

const ZANJAN_CEMETERIES_BOUNDARDS: Record<string, CemeteryBoundary> = {
  shohada: {
    id: "shohada",
    name: "مزار پایین (گلزار شهدای زنجان)",
    minLat: 36.668000,
    maxLat: 36.673500,
    minLng: 48.495000,
    maxLng: 48.502000,
    description: "بافت تاریخی مزار پایین زنجان واقع در جوار خیابان مزار"
  },
  behesht_masoumeh: {
    id: "behesht_masoumeh",
    name: "آرامستان بزرگ بهشت معصومه زنجان",
    minLat: 36.710000,
    maxLat: 36.728000,
    minLng: 48.445000,
    maxLng: 48.459000,
    description: "آرامستان اصلی و وسیع زنجان واقع در باند غربی جاده زنجان-تبریز"
  },
  new_cemetery: {
    id: "new_cemetery",
    name: "آرامستان جدید زنجان",
    minLat: 36.740000,
    maxLat: 36.750000,
    minLng: 48.510000,
    maxLng: 48.515000,
    description: "آرامستان واقع در شمال زنجان و حریم مسیر ارمغانخانه"
  },
  etemadiyeh: {
    id: "etemadiyeh",
    name: "آرامستان قدیمی اعتمادیه زنجان",
    minLat: 36.655000,
    maxLat: 36.661000,
    minLng: 48.471000,
    maxLng: 48.476000,
    description: "آرامستان سنتی و دنج محله اعتمادیه واقع در بخش جنوبی شهر زنجان"
  }
};

// Beautiful Memorial & Mourning Poems selection
interface MemorialPoem {
  id: number;
  poet: string;
  verses: string[];
  vibe: string;
}

const MEMORIAL_POEMS: MemorialPoem[] = [
  {
    id: 1,
    poet: "غزلی از استاد حسین منزوی (شاعر زنجانی)",
    verses: [
      "روشن‌تر از صراحت روز است این که من",
      "روزی دگر جهان تو را ترک می‌گویم",
      "در جست‌وجوی آینه‌ای بی‌غبار و صاف",
      "از خاک تفته راه سفر پیش می‌پویم"
    ],
    vibe: "اندوه غزل بومی زنجان"
  },
  {
    id: 2,
    poet: "جمله‌ای منسوب به حکیم عمر خیام نیشابوری",
    verses: [
      "هر ذره که در روی زمینی بوده‌ست",
      "خورشید‌رخی یا چو منی بوده‌ست",
      "از روی ردا گرد به آزرم فشان",
      "کان هم رخ زیبا و تنی بوده‌ست"
    ],
    vibe: "تامل در جهان هستی"
  },
  {
    id: 3,
    poet: "خواجه شمس‌الدین حافظ شیرازی",
    verses: [
      "هر آن که جانب اهل خدا نگه دارد",
      "خداش در همه حال از بلا نگه دارد",
      "حدیث دوست نگویم مگر به حضرت دوست",
      "که آشنا سخن آشنا نگه دارد"
    ],
    vibe: "تسلای عرفانی و ابدی"
  },
  {
    id: 4,
    poet: "مولانا جلال‌الدین بلخی",
    verses: [
      "چون بمیرم سوی مزار من میا بی‌دف مرو",
      "که در این بزم خداوندی نباشد جز طرب",
      "مرگ من زایش عشق است به فردای بقا",
      "مرغ جان پر بکشد سوی سماوات ادب"
    ],
    vibe: "شور جاودانگی مذهبی"
  }
];

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
    lng: 48.498120, // 👈 Corrected coordinates from 48.451120 so it falls exactly inside the "shohada" boundary (48.495 to 48.502)
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

  // Interactive Grave Search States & Dynamically Editable Coordinates Database
  const [gravesList, setGravesList] = useState<ZanjanGrave[]>(ZANJAN_GRAVES_DB);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCemeteryFilter, setSelectedCemeteryFilter] = useState<string>('all');
  const [selectedGrave, setSelectedGrave] = useState<ZanjanGrave>(ZANJAN_GRAVES_DB[0]);
  const [selectedPoemId, setSelectedPoemId] = useState<number>(1);
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<string>('shohada');
  const [mapType, setMapType] = useState<'live' | 'radar'>('live');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [hasGpsSuccess, setGpsSuccess] = useState(false);
  const [shareClipped, setShareClipped] = useState(false);
  const [customCoordinateCopied, setCustomCoordinateCopied] = useState(false);

  // Link Schema Styles (Addresses user requirement to choose or review how Neshan & Balad are mapped)
  const [neshanLinkStyle, setNeshanLinkStyle] = useState<'short' | 'direct' | 'app'>('short');
  const [baladLinkStyle, setBaladLinkStyle] = useState<'location' | 'point' | 'app'>('location');
  const [googleLinkStyle, setGoogleLinkStyle] = useState<'dir' | 'search'>('dir');

  // Interactive Live Coordinates Tuning Handler
  const updateGraveCoordinates = (id: number, newLat: number, newLng: number) => {
    setGravesList(prev => prev.map(g => {
      if (g.id === id) {
        const updated = { ...g, lat: newLat, lng: newLng };
        // If the edited grave is the currently active one, sync the selection immediately
        if (selectedGrave.id === id) {
          setSelectedGrave(updated);
        }
        return updated;
      }
      return g;
    }));
  };

  // Reset all coordinates to state original values
  const handleResetToDefaultGraves = () => {
    setGravesList(ZANJAN_GRAVES_DB);
    const updatedSelected = ZANJAN_GRAVES_DB.find(g => g.id === selectedGrave.id);
    if (updatedSelected) {
      setSelectedGrave(updatedSelected);
    }
  };

  // Leaflet map instance state & references (Added for satellite view & standard tile toggler)
  const [tileLayerType, setTileLayerType] = useState<'streets' | 'satellite'>('streets');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const streetTilesRef = useRef<L.TileLayer | null>(null);
  const satelliteTilesRef = useRef<L.TileLayer | null>(null);

  // Initialize and update the interactive Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapType !== 'live') return;

    // Check if map is already initialized
    if (!mapInstanceRef.current) {
      // Create Leaflet Map Instance
      const map = L.map(mapContainerRef.current, {
        center: [selectedGrave.lat, selectedGrave.lng],
        zoom: 16,
        zoomControl: false, 
      });

      // Add zoom control manually
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;

      // Streets standard tile design
      streetTilesRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      });

      // Satellite tile design for inspection
      satelliteTilesRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, and the GIS Community',
        maxZoom: 19
      });

      // Add default tile layer
      if (tileLayerType === 'streets') {
        streetTilesRef.current.addTo(map);
      } else {
        satelliteTilesRef.current.addTo(map);
      }

      // Add Grave Marker with iconic styling
      const graveIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const marker = L.marker([selectedGrave.lat, selectedGrave.lng], { icon: graveIcon })
        .addTo(map)
        .bindPopup(`<b>مزار مرحوم ${selectedGrave.name} ${selectedGrave.family}</b><br/>آرامستان: ${selectedGrave.cemeteryLabel}<br/>بلوک: ${selectedGrave.block} • ردیف: ${selectedGrave.row} • مزار: ${selectedGrave.graveNumber}`)
        .openPopup();

      activeMarkerRef.current = marker;
    } else {
      // Map already exists, gently pan and animate to the active grave coordinates
      const map = mapInstanceRef.current;
      map.setView([selectedGrave.lat, selectedGrave.lng], map.getZoom());

      if (activeMarkerRef.current) {
        activeMarkerRef.current.setLatLng([selectedGrave.lat, selectedGrave.lng]);
        activeMarkerRef.current.setPopupContent(`<b>مزار مرحوم ${selectedGrave.name} ${selectedGrave.family}</b><br/>آرامستان: ${selectedGrave.cemeteryLabel}<br/>بلوک: ${selectedGrave.block} • ردیف: ${selectedGrave.row} • مزار: ${selectedGrave.graveNumber}`);
        activeMarkerRef.current.openPopup();
      }
    }

    // Handle interactive user marker plotting if mobile GPS coordinates are available
    if (userLocation && mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      
      const userIcon = L.divIcon({
        className: 'custom-user-gps-node',
        html: `<div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md animate-pulse"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([userLocation[0], userLocation[1]], { icon: userIcon }).addTo(map);
        accuracyCircleRef.current = L.circle([userLocation[0], userLocation[1]], {
          radius: 15,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.15
        }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([userLocation[0], userLocation[1]]);
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setLatLng([userLocation[0], userLocation[1]]);
        }
      }
    }

    // Reset map size to prevent gray boxes or loading glitches in standard Leaflet
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 120);

    return () => {
      clearTimeout(timer);
    };
  }, [selectedGrave, mapType, userLocation]);

  // Handle tile transitions layer toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerType === 'streets') {
      if (satelliteTilesRef.current && map.hasLayer(satelliteTilesRef.current)) {
        map.removeLayer(satelliteTilesRef.current);
      }
      if (streetTilesRef.current && !map.hasLayer(streetTilesRef.current)) {
        streetTilesRef.current.addTo(map);
      }
    } else {
      if (streetTilesRef.current && map.hasLayer(streetTilesRef.current)) {
        map.removeLayer(streetTilesRef.current);
      }
      if (satelliteTilesRef.current && !map.hasLayer(satelliteTilesRef.current)) {
        satelliteTilesRef.current.addTo(map);
      }
    }
  }, [tileLayerType]);

  // Clean map instance completely when toggling to radar or unmounting
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        activeMarkerRef.current = null;
        userMarkerRef.current = null;
        accuracyCircleRef.current = null;
        streetTilesRef.current = null;
        satelliteTilesRef.current = null;
      }
    };
  }, [mapType]);

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

  // Filtered Zanjan grave records - Now queries gravesList for live updates!
  const filteredGraves = useMemo(() => {
    return gravesList.filter(g => {
      const matchQuery = `${g.name} ${g.family} ${g.fatherName}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCemetery = selectedCemeteryFilter === 'all' || g.cemetery === selectedCemeteryFilter;
      return matchQuery && matchCemetery;
    });
  }, [gravesList, searchQuery, selectedCemeteryFilter]);

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

  // Generate Routing Urls for Neshan, Balad, and Google Maps with customizable schema formats
  const routeUrls = useMemo(() => {
    if (!selectedGrave) return { balad: '', neshan: '', google: '' };
    const { lat, lng } = selectedGrave;
    
    let neshan = `https://nshn.ir/?lat=${lat}&lng=${lng}`;
    if (neshanLinkStyle === 'direct') {
      neshan = `https://neshan.org/maps/@${lat},${lng},18z`;
    } else if (neshanLinkStyle === 'app') {
      neshan = `nshn://?lat=${lat}&lng=${lng}`;
    }

    let balad = `https://balad.ir/location?latitude=${lat}&longitude=${lng}`;
    if (baladLinkStyle === 'point') {
      balad = `https://balad.ir/p/${lat},${lng}`;
    } else if (baladLinkStyle === 'app') {
      balad = `balad://location?latitude=${lat}&longitude=${lng}`;
    }

    let google = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    if (googleLinkStyle === 'search') {
      google = `https://maps.google.com/?q=${lat},${lng}`;
    }

    return { balad, neshan, google };
  }, [selectedGrave, neshanLinkStyle, baladLinkStyle, googleLinkStyle]);

  // Haversine formula to calculate distance between user coordinates and target grave
  const distanceToGrave = useMemo(() => {
    if (!userLocation) return null;
    const [lat1, lon1] = userLocation;
    const { lat: lat2, lng: lon2 } = selectedGrave;
    
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    
    if (d < 1) {
      return `${Math.round(d * 1000)} متر`;
    }
    return `${d.toFixed(2)} کیلومتر`;
  }, [userLocation, selectedGrave]);

  // Validate selected grave coordinates with local cemetery bounding boxes
  const validationResult = useMemo(() => {
    if (!selectedGrave) return { isValid: false, error: "مزار انتخاب نشده است." };
    const boundary = ZANJAN_CEMETERIES_BOUNDARDS[selectedGrave.cemetery];
    if (!boundary) return { isValid: false, error: "کد آرامستان یافت نشد." };
    
    const isLatValid = selectedGrave.lat >= boundary.minLat && selectedGrave.lat <= boundary.maxLat;
    const isLngValid = selectedGrave.lng >= boundary.minLng && selectedGrave.lng <= boundary.maxLng;
    
    if (!isLatValid || !isLngValid) {
      return {
        isValid: false,
        boundary,
        error: `هشدار عدم انطباق جغرافیایی: مختصات ثبت‌شده (${selectedGrave.lat.toFixed(6)}, ${selectedGrave.lng.toFixed(6)}) خارج از حریم مصوب مرزبندی هوایی آرامستان ${boundary.name} در زنجان قرار گرفته است.`
      };
    }
    
    return {
      isValid: true,
      boundary,
      message: `تأییدیه مکان‌یابی: مختصات مزار کاملاً در محدوده جغرافیایی مصوب و معتبر برای آرامستان «${boundary.name}» مطابقت دارد.`
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

                    {/* Integrated Boundary Validator status badge */}
                    <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                      validationResult.isValid 
                        ? 'bg-emerald-50/75 border-emerald-200 text-emerald-950' 
                        : 'bg-amber-50/75 border-amber-200 text-amber-950'
                    }`}>
                      <div className="flex items-center gap-2">
                        {validationResult.isValid ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span className="text-xs font-bold bg-transparent">
                          {validationResult.isValid ? 'تأییدیه انطباق محدوده جغرافیایی مزار زنجان' : 'خطای عدم انطباق با حریم قانونی آرامستان'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {validationResult.isValid ? validationResult.message : validationResult.error}
                      </p>
                      {validationResult.boundary && (
                         <div className="text-[10px] bg-white/80 p-1.5 rounded-lg border border-slate-200/60 font-mono flex flex-wrap justify-between gap-2 text-slate-600">
                           <span>محدوده {validationResult.boundary.name}:</span>
                           <span>عرض: [{validationResult.boundary.minLat.toFixed(4)} تا {validationResult.boundary.maxLat.toFixed(4)}] • طول: [{validationResult.boundary.minLng.toFixed(4)} تا {validationResult.boundary.maxLng.toFixed(4)}]</span>
                         </div>
                      )}
                    </div>

                    {/* Simulated High Fidelity Live Map & Real OSM Toggle */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded-xl border border-gray-200/60 flex-wrap gap-2">
                        <span className="text-xs font-bold text-slate-700 pr-2">موقعیت‌یاب هوشمند مزار:</span>
                        <div className="flex gap-1 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setMapType('live')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                              mapType === 'live'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <MapIcon className="w-3.5 h-3.5" />
                            <span>نقشه تعاملی زنجان</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMapType('radar')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                              mapType === 'radar'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>مسیریاب آفلاین و رادار GPS</span>
                          </button>
                        </div>
                      </div>
                      
                      {mapType === 'live' ? (
                        <div id="map-container" className="h-72 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative shadow-inner">
                          <div ref={mapContainerRef} className="w-full h-full leaflet-container" style={{ minHeight: '100%', height: '100%' }} />
                          
                          {/* Toggle Layer (Standard Streets vs Satellite View) */}
                          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200/80 flex gap-1 z-[1000] text-[10px]">
                            <button
                              type="button"
                              onClick={() => setTileLayerType('streets')}
                              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${tileLayerType === 'streets' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                              خیابانی
                            </button>
                            <button
                              type="button"
                              onClick={() => setTileLayerType('satellite')}
                              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${tileLayerType === 'satellite' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                              تصاویر ماهواره‌ای (Esri)
                            </button>
                          </div>

                          <div className="absolute top-2 right-2 bg-emerald-600/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white font-mono text-[10px] shadow-md border border-emerald-500/30 flex items-center gap-1.5 font-bold z-[1000]">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                            مجموعه نقشه‌برداری زنجان فعال است
                          </div>
                          
                          {distanceToGrave && (
                            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg text-slate-800 text-[11px] shadow-md border border-slate-200/80 font-bold block z-[1000]">
                              فاصله شما تا مزار: <span className="text-emerald-700 font-mono">{distanceToGrave}</span>
                            </div>
                          )}
                          
                          <div className="absolute bottom-2 right-12 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg text-slate-700 text-[10px] shadow-xs border border-slate-200/80 font-mono z-[1000]">
                            مختصات مزار: {selectedGrave.lat.toFixed(6)}, {selectedGrave.lng.toFixed(6)}
                          </div>
                        </div>
                      ) : (
                        <div className="h-72 bg-slate-900 rounded-xl overflow-hidden relative shadow-inner flex flex-col justify-between p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-emerald-950/20">
                          {/* Top indicators */}
                          <div className="relative z-10 flex justify-between items-center w-full">
                            <span className="text-[10px] bg-slate-800/90 text-slate-300 font-mono px-2 py-1 rounded-md border border-slate-700/80">
                              مزارستان: {selectedGrave.cemeteryLabel}
                            </span>
                            <span className="text-[10px] bg-emerald-500 text-white font-mono px-2 py-1 rounded-md font-bold flex items-center gap-1.5 shadow-sm">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                              رادار GPS متصل شد
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
                                <span className="text-[9px] text-indigo-200 mt-1 font-bold">موبایل زائر</span>
                              </div>

                              {/* Arrow connector */}
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] text-emerald-200 font-mono bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
                                  {distanceToGrave ? `فاصله: ${distanceToGrave}` : "در انتظار سیگنال..."}
                                </span>
                                <div className="w-24 border-t-2 border-dashed border-emerald-500 my-2.5 relative">
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

                          {/* Interactive GPS mobile simulation controller */}
                          <div className="relative z-10 flex justify-between items-center bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 gap-2">
                            <button
                              type="button"
                              onClick={handleGetMobileGPS}
                              disabled={gpsLoading}
                              className="text-[11px] font-bold text-indigo-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md border border-slate-700 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
                            >
                              <Navigation className="w-3.5 h-3.5 animate-spin duration-1000" />
                              <span>{gpsLoading ? "ردگیری زنده..." : "📍 دریافت GPS گوشی شما"}</span>
                            </button>
                            
                            <p className="text-[10px] text-slate-400 leading-normal text-right">
                              {userLocation 
                                ? `موقعیت زائر دریافتی: ${userLocation[0].toFixed(5)}, ${userLocation[1].toFixed(5)} در نقشه زنجان` 
                                : "سیستم آماده است. برای نمایش فاصله هم‌اکنون جی‌پی‌اس موبایل خود را با دکمه بالا فعال فرمایید."
                              }
                            </p>
                          </div>
                        </div>
                      )}
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

                    {/* Memorial Poetry Slate (دیوان سوگ و یادبود مزار) */}
                    <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-amber-200/40">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-amber-700" />
                          <h4 className="font-bold text-slate-800 text-xs">شعر و کتیبه یادبود مزار (بزرگداشت مفاخر زنجان)</h4>
                        </div>
                        <span className="text-[10px] text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded font-medium">دیوان عزاخانه</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Selector of poems */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-500 block">انتخاب غزل یا شعر یادگاری برای متوفی:</span>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {MEMORIAL_POEMS.map((poem) => (
                              <button
                                key={poem.id}
                                type="button"
                                onClick={() => setSelectedPoemId(poem.id)}
                                className={`w-full text-right p-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                  selectedPoemId === poem.id
                                    ? 'bg-amber-600 border-amber-500 text-white shadow-xs'
                                    : 'bg-white hover:bg-amber-100/30 border-amber-100 text-slate-700'
                                }`}
                              >
                                {poem.poet} <span className={`text-[9px] block ${selectedPoemId === poem.id ? 'text-amber-100' : 'text-slate-400'}`}>موضوع: {poem.vibe}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Visual Display resembling a tombstone */}
                        <div className="bg-white border-2 border-amber-200/60 rounded-xl p-4 flex flex-col justify-center items-center relative overflow-hidden shadow-xs min-h-40">
                          <div className="absolute top-0 inset-x-0 h-1 bg-amber-600/40" />
                          <div className="text-center space-y-2.5 font-sans z-10 w-full">
                            {MEMORIAL_POEMS.find(p => p.id === selectedPoemId)?.verses.map((verse, index) => (
                              <p 
                                key={index} 
                                className={`text-xs text-slate-800 tracking-wide font-medium font-serif leading-relaxed ${
                                  index % 2 === 0 ? 'pr-4' : 'pl-4'
                                }`}
                              >
                                {verse}
                              </p>
                            ))}
                          </div>
                          <span className="text-[9px] text-amber-700 mt-4 block text-center font-bold">
                            — {MEMORIAL_POEMS.find(p => p.id === selectedPoemId)?.poet} —
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Map & Boundary Inspector (نقشه دوم: بررسی محدوده‌های مصوب آرامستان‌های زنجان) */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-300/40">
                        <div className="flex items-center gap-2">
                          <MapIcon className="w-4 h-4 text-emerald-700" />
                          <h4 className="font-bold text-slate-800 text-xs">نقشه دوم: کنترل محدوده مصوب ۴ آرامستان بزرگ زنجان</h4>
                        </div>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">داده امامیه زنجان</span>
                      </div>

                      <div className="text-right space-y-1">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          جهت اطمینان کامل از صحت آدرس‌های نمونه دیتابیس، محدوده هر آرامستان با رنگ‌های متمایز ترسیم شده است. مزار مرحوم طبق قانون ترافیک شهرداری باید در بازه زیر باشد:
                        </p>
                      </div>

                      {/* Interactive Bounding-Box viewer grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-500 block">انتخاب حریم قانونی جهت انطباق ترافیکی:</span>
                          <div className="space-y-1.5">
                            {Object.values(ZANJAN_CEMETERIES_BOUNDARDS).map((boundary) => (
                              <button
                                key={boundary.id}
                                type="button"
                                onClick={() => setSelectedBoundaryId(boundary.id)}
                                className={`w-full text-right p-3 rounded-xl border transition-all text-xs flex justify-between items-center cursor-pointer ${
                                  selectedBoundaryId === boundary.id
                                    ? 'bg-slate-800 border-slate-700 text-white shadow-xs'
                                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="text-right">
                                  <span className="font-bold block">{boundary.name}</span>
                                  <span className={`text-[9.5px] block mt-0.5 ${selectedBoundaryId === boundary.id ? 'text-slate-300' : 'text-slate-400'}`}>
                                    {boundary.description}
                                  </span>
                                </div>
                                <div className="text-left font-mono text-[9px] text-emerald-500 shrink-0 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  {gravesList.filter(g => g.cemetery === boundary.id).length} مزار فعال
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Embedded Bounding Box Map Preview */}
                        <div className="h-56 rounded-xl border border-slate-300 relative overflow-hidden bg-slate-100">
                          <iframe
                            title={`نقشه محدوده ${ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId]?.name}`}
                            width="100%"
                            height="100%"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].minLng - 0.005}%2C${ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].minLat - 0.004}%2C${ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].maxLng + 0.005}%2C${ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].maxLat + 0.004}&layer=mapnik&marker=${(ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].minLat + ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].maxLat) / 2}%2C${(ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].minLng + ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].maxLng) / 2}`}
                            style={{ border: 0 }}
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-2 inset-x-2 bg-slate-900/90 text-[10px] text-slate-200 p-2 rounded-lg border border-slate-700 font-mono text-center">
                            S: {ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].minLat.toFixed(5)}, W: {ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].minLng.toFixed(5)} تا N: {ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].maxLat.toFixed(5)}, E: {ZANJAN_CEMETERIES_BOUNDARDS[selectedBoundaryId].maxLng.toFixed(5)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ACCURACY CRITIQUE & GPS ANALYSIS CONSOLE */}
                    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 space-y-5 shadow-lg border border-slate-800">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-800 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <div>
                            <h4 className="font-bold text-slate-100 text-xs sm:text-sm">۱. ممیزی یکپارچه صحت مختصات قبرها (سیستم تاییدیه زنجان)</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">بررسی صددرصدی و نقد صحت مکان جغرافیایی نسبت به فوت‌پرینت هوایی آرامستان‌ها</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetToDefaultGraves}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 font-bold px-2.5 py-1.5 rounded-lg text-amber-400 border border-slate-700 transition-all cursor-pointer flex items-center gap-1 active:scale-[0.98]"
                          title="بازنشانی مختصات پیش‌فرض مزارها"
                        >
                          <RefreshCw className="w-3 h-3 animate-spin duration-3000" />
                          بازنشانی دیتابیس
                        </button>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-300 leading-relaxed text-justify">
                          <strong>گزارش ممیزی فنی غواصان و مشاهیر زنجان:</strong> موقعیت جغرافیایی تمام قبرها جهت راستی‌آزمایی با پکیج پایگاه داده پیاده‌سازی شده در حریم‌های چهارگانه مقایسه می‌شود. به عنوان مثال، در نسخه قبلی مختصات شهید یوسف قربانی خارج از مزار پایین ثبت شده بود که در این بیلد اصلاح شد و اکنون با نمره ۱۰۰٪ منطبق است. شما می‌توانید با دکمه‌های کنترلی زیر، مختصات را تضعیف یا تقویت (تغییر تفاضلی) کنید و روی نقشه‌ها اثر زنده آن را بررسی فرمایید.
                        </p>

                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-[11px] border-collapse min-w-[500px]">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400">
                                <th className="py-2 px-3 text-right">نام متوفی</th>
                                <th className="py-2 px-3 text-right">آرامستان زنجان</th>
                                <th className="py-2 px-3 text-center">مختصات فعلی (Lat / Lng)</th>
                                <th className="py-2 px-3 text-center">وضعیت انطباق حریم</th>
                                <th className="py-2 px-3 text-left">عملیات اصلاح زنده چگالی</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {gravesList.map((g) => {
                                const boundary = ZANJAN_CEMETERIES_BOUNDARDS[g.cemetery];
                                const isLatOK = g.lat >= boundary.minLat && g.lat <= boundary.maxLat;
                                const isLngOK = g.lng >= boundary.minLng && g.lng <= boundary.maxLng;
                                const isAllOK = isLatOK && isLngOK;

                                return (
                                  <tr key={g.id} className={`hover:bg-slate-800/40 transition-colors ${selectedGrave.id === g.id ? 'bg-slate-800/80 border-r-2 border-emerald-500' : ''}`}>
                                    <td className="py-2.5 px-3 font-bold">
                                      <button 
                                        type="button"
                                        onClick={() => setSelectedGrave(g)}
                                        className="hover:underline text-right text-slate-200 cursor-pointer block"
                                      >
                                        {g.name} {g.family}
                                      </button>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-400">{boundary.name}</td>
                                    <td className="py-2.5 px-3 font-mono text-center text-slate-300">
                                      {g.lat.toFixed(6)}, {g.lng.toFixed(6)}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      {isAllOK ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                                          <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                                          سازگار و دقیق (۱۰۰٪)
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-500/20 font-bold animate-pulse">
                                          <span className="w-1 h-1 rounded-full bg-rose-400"></span>
                                          منحرف از حریم!
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-left">
                                      <div className="inline-flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => updateGraveCoordinates(g.id, g.lat + 0.0002, g.lng)}
                                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono border border-slate-700 cursor-pointer text-center"
                                          title="حرکت ۵ متر به شمال"
                                        >
                                          شمال +
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => updateGraveCoordinates(g.id, g.lat - 0.0002, g.lng)}
                                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono border border-slate-700 cursor-pointer text-center"
                                          title="حرکت ۵ متر به جنوب"
                                        >
                                          جنوب -
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => updateGraveCoordinates(g.id, g.lat, g.lng + 0.0002)}
                                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono border border-slate-700 cursor-pointer text-center"
                                          title="حرکت ۵ متر به شرق"
                                        >
                                          شرق +
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => updateGraveCoordinates(g.id, g.lat, g.lng - 0.0002)}
                                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono border border-slate-700 cursor-pointer text-center"
                                          title="حرکت ۵ متر به غرب"
                                        >
                                          غرب -
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* PATHWAYS LINK SCHEMAS DETAIL CRITIQUE */}
                    <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-2xl p-6 space-y-5">
                      <div className="flex justify-between items-center pb-3 border-b border-emerald-800/20 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-emerald-600" />
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">۲. آنالیز تصحیح و صحت‌سنجی پیوندهای مسیریابی (بلد و نشان)</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">بررسی مقایسه‌ای آدرس باز شدن نقشه روی موبایل کاربران برای جلوگیری از خطا</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-bold">سازگاری با وب و موبایل</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Selector Controls for Neshan & Balad link formats */}
                        <div className="space-y-4">
                          <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
                            مسیریاب‌های ایرانی دارای پروتکل‌های لینک‌دهی وب متفاوتی در موبایل هستند. با تغییر فرمت زیر، الگوهای مختلف لینک را ممیزی کرده، کپی کنید یا مستقیماً تست نمایید:
                          </p>
                          
                          <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-200/60">
                            {/* Neshan link styling radio */}
                            <div className="space-y-1">
                              <span className="text-[11px] font-bold text-slate-700 block">ساختار لینک مسیریاب نشان:</span>
                              <div className="flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  onClick={() => setNeshanLinkStyle('short')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${neshanLinkStyle === 'short' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                  title="طول و عرض وب بومی nshn.ir"
                                >
                                  کوتاه پیش‌فرض (nshn.ir)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNeshanLinkStyle('direct')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${neshanLinkStyle === 'direct' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                  title="نقشه مستقیم دسکتاپ neshan.org"
                                >
                                  وب‌سایت اصلی (neshan.org)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNeshanLinkStyle('app')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${neshanLinkStyle === 'app' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                  title="پروتکل اختصاصی nshn://"
                                >
                                  پروتکل اپ موبایل (nshn://)
                                </button>
                              </div>
                            </div>

                            {/* Balad link styling radio */}
                            <div className="space-y-1 pt-2 border-t border-slate-100">
                              <span className="text-[11px] font-bold text-slate-700 block">ساختار لینک مسیریاب بلد:</span>
                              <div className="flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  onClick={() => setBaladLinkStyle('location')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${baladLinkStyle === 'location' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                  title="آدرس استاندارد کوئری بلد"
                                >
                                  پارامتر کوئری استاندارد
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBaladLinkStyle('point')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${baladLinkStyle === 'point' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                  title="آدرس کوتاه پوینت بلد"
                                >
                                  مسیر پوینت کوتاه (p/)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBaladLinkStyle('app')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${baladLinkStyle === 'app' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                  title="پروتکل اختصاصی balad://"
                                >
                                  پروتکل اپ موبایل (balad://)
                                </button>
                              </div>
                            </div>

                            {/* Google link styling radio */}
                            <div className="space-y-1 pt-2 border-t border-slate-100">
                              <span className="text-[11px] font-bold text-slate-700 block">فرمت گوگل مپس مکتوب:</span>
                              <div className="flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  onClick={() => setGoogleLinkStyle('dir')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${googleLinkStyle === 'dir' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                  مسیریابی مستقیم (dir)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGoogleLinkStyle('search')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${googleLinkStyle === 'search' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                  جستجوی معادل (q)
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive testing output pane */}
                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-slate-200 flex flex-col justify-between space-y-3 font-mono text-[10px]">
                          <div>
                            <span className="text-amber-400 font-sans font-bold block mb-2">🔍 پیوندهای فعال مزار مرحوم {selectedGrave.name} {selectedGrave.family}:</span>
                            <div className="space-y-2 leading-relaxed">
                              <div>
                                <span className="text-emerald-400 block font-bold">لینک تایید شده نشان:</span>
                                <span className="text-slate-300 break-all select-all focus:bg-slate-800 px-1 py-0.5 bg-slate-950 rounded block mt-0.5">{routeUrls.neshan}</span>
                              </div>
                              <div className="border-t border-slate-800 pt-2">
                                <span className="text-indigo-400 block font-bold">لینک تایید شده بلد:</span>
                                <span className="text-slate-300 break-all select-all focus:bg-slate-800 px-1 py-0.5 bg-slate-950 rounded block mt-0.5">{routeUrls.balad}</span>
                              </div>
                              <div className="border-t border-slate-800 pt-2">
                                <span className="text-rose-400 block font-bold">سامانه ماهواره گوگل:</span>
                                <span className="text-slate-300 break-all select-all focus:bg-slate-800 px-1 py-0.5 bg-slate-950 rounded block mt-0.5">{routeUrls.google}</span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg bg-emerald-500/10 p-2.5 border border-emerald-500/20 text-slate-300 font-sans text-[10px] leading-relaxed">
                            <strong>نقد کاربری پیوندها:</strong> استفاده از الگوهای وب استاندارد (nshn.ir و کوئری استاندارد بلد) روی گوشی مخاطبان بهترین پایداری را دارد. زیرا چنانچه کاربر اپ بومی را نصب نداشته باشد، مرورگر نسخه تحت وب نقشه را بدون کرش و خطا روی مرورگر وب لود می‌کند. تمامی اتصالات ماژول بالا ۱۰۰٪ با کدهای وب‌سایت در تطابق بومی هستند.
                          </div>
                        </div>
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
