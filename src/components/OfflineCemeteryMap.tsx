import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Compass, ZoomIn, ZoomOut, Info, User, Crosshair, ExternalLink, Map as MapIcon, Navigation, Activity, Clock, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Bounding box mapping for Zanjan Behesht-e-Zahra Coordinates
const ZANJAN_CENTER: [number, number] = [36.6585, 48.4918];

export interface MapMarker {
  id: string;
  fullName: string;
  location: { lat: number; lng: number };
  block?: string;
  row?: string;
  number?: string;
}

interface OfflineCemeteryMapProps {
  graveLocation?: { lat: number; lng: number } | null;
  originLocation?: { lat: number; lng: number } | null;
  targetGraveName?: string;
  targetGraveInfo?: string;
  markers?: MapMarker[];
  selectedMarkerId?: string | null;
  onMarkerClick?: (marker: MapMarker) => void;
  onLocationSelect?: (loc: { lat: number; lng: number }) => void;
  isManualSelectMode?: boolean;
  mapStyle?: 'historical' | 'satellite';
}

// Custom Marker Icons for high-fidelity interactive map
const createCustomIcon = (color: string, size: number = 36, isSelected: boolean = false) => {
  const glowValue = isSelected ? 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.6))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))';
  const scale = isSelected ? 1.3 : 1;
  const pulseClass = isSelected ? 'animate-pulse' : '';
  
  return L.divIcon({
    html: `<div class="${pulseClass}" style="color: ${color}; filter: ${glowValue}; transform: scale(${scale}); transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" fill="white" />
            </svg>
          </div>`,
    className: 'custom-marker-icon-container',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const userIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping"></div>
          <div class="relative bg-white p-0.5 rounded-full shadow-2xl">
            <div class="bg-blue-600 rounded-full w-4 h-4 border-2 border-white"></div>
          </div>
        </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapEventsHandler({ onLocationSelect, active }: { onLocationSelect?: (loc: { lat: number; lng: number }) => void, active: boolean }) {
  useMapEvents({
    click(e) {
      if (active && onLocationSelect) {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

interface TrafficRoad {
  name: string;
  path: [number, number][];
  colors: {
    heavy: string;
    moderate: string;
    smooth: string;
  };
  weight: number;
}

const TRAFFIC_ROADS: TrafficRoad[] = [
  {
    name: "بزرگراه دسترسی جنوبی (تهران-زنجان)",
    path: [
      [36.6510, 48.4750],
      [36.6522, 48.4830],
      [36.6538, 48.4900],
      [36.6550, 48.4970],
      [36.6565, 48.5050],
      [36.6580, 48.5140]
    ],
    colors: { heavy: '#f59e0b', moderate: '#10b981', smooth: '#10b981' },
    weight: 6
  },
  {
    name: "بلوار اصلی ورودی بهشت زهرا (ع)",
    path: [
      [36.6530, 48.4885],
      [36.6548, 48.4901],
      [36.6565, 48.4910],
      [36.6582, 48.4919]
    ],
    colors: { heavy: '#ef4444', moderate: '#f59e0b', smooth: '#10b981' },
    weight: 5
  },
  {
    name: "بلوار شرقی قطعات مزارات قدیمی",
    path: [
      [36.6582, 48.4919],
      [36.6592, 48.4932],
      [36.6605, 48.4918],
      [36.6620, 48.4902]
    ],
    colors: { heavy: '#ef4444', moderate: '#f59e0b', smooth: '#10b981' },
    weight: 4
  },
  {
    name: "رینگ غربی قطعات عمومی جدید",
    path: [
      [36.6582, 48.4919],
      [36.6575, 48.4895],
      [36.6590, 48.4880],
      [36.6608, 48.4895],
      [36.6620, 48.4902]
    ],
    colors: { heavy: '#f59e0b', moderate: '#10b981', smooth: '#10b981' },
    weight: 4
  }
];

const isValidCoord = (c: any) => typeof c === 'number' && !isNaN(c);
const isValidLatLng = (loc: any): loc is { lat: number; lng: number } => 
  !!loc && isValidCoord(loc.lat) && isValidCoord(loc.lng);

export default function OfflineCemeteryMap({
  graveLocation,
  originLocation,
  targetGraveName,
  targetGraveInfo,
  markers = [],
  selectedMarkerId,
  onMarkerClick,
  onLocationSelect,
  isManualSelectMode = false,
  mapStyle = 'satellite'
}: OfflineCemeteryMapProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [isTrafficEnabled, setIsTrafficEnabled] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [trafficDay, setTrafficDay] = useState<number>(new Date().getDay());
  const [trafficHour, setTrafficHour] = useState<number>(new Date().getHours());

  const getTrafficStatus = (dayValue: number, hourValue: number) => {
    const persianDays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
    const dayName = persianDays[dayValue] || "روز عادی";

    let level: 'smooth' | 'moderate' | 'heavy' = 'smooth';
    let label = "روان";
    let message = "مسیرها روان و تردد بسیار آزاد است.";
    let recommendation = "🟢 بسیار خلوت: بهترین بازه زمانی جهت حضور و زیارت اهل قبور در فضایی آرام.";
    let percent = 12;
    let badgeColor = "bg-emerald-500 text-white";

    if (dayValue === 4) { // Thursday
      if (hourValue >= 14 && hourValue <= 19) {
        level = 'heavy';
        label = 'سنگین';
        message = 'بار ترافیکی بسیار بالا در بلوار اصلی ورودی و پارک‌های منتهی به مزارات قدیمی سنگین است.';
        recommendation = '🔴 زمان اوج ترافیک هفتگی آرامستان. پیشنهاد می‌شود زیارت خود را به فردا صبح یا ساعات اولیه روز موکول کنید.';
        percent = 88;
        badgeColor = "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30";
      } else if (hourValue >= 10 && hourValue < 14) {
        level = 'moderate';
        label = 'نیمه‌سنگین';
        message = 'تردد در ورودی غربی متوفیات و قطعات جدید رو به افزایش است.';
        recommendation = '🟡 ازدحام متوسط. حرکت روان است اما یافتن جای پارک مناسب کمی زمان‌بر است.';
        percent = 52;
        badgeColor = "bg-amber-500 text-stone-900";
      }
    } else if (dayValue === 5) { // Friday
      if (hourValue >= 8 && hourValue <= 13) {
        level = 'moderate';
        label = 'نیمه‌سنگین';
        message = 'ترافیک ملایم زائران روز جمعه بر سر مزار شهدا و بازماندگان.';
        recommendation = '🟡 تراکم خودرو در بلوار شرقی. رانندگی با احتیاط و سرعت مطمئنه پیشنهاد می‌شود.';
        percent = 58;
        badgeColor = "bg-amber-500 text-stone-900";
      }
    } else { // Weekdays
      if (hourValue >= 17 && hourValue <= 19) {
        level = 'moderate';
        label = 'روان تا نیمه‌سنگین';
        message = 'افزایش جزیی تردد عصرگاهی همزمان با غروب آفتاب.';
        recommendation = '🟢 ترافیک متوسط عصرانه. تردد در قطعات بدون معطلی مقدور است.';
        percent = 32;
        badgeColor = "bg-emerald-400 text-emerald-950";
      }
    }

    return { level, label, message, recommendation, percent, dayName, badgeColor };
  };

  const activeTraffic = getTrafficStatus(
    isSimulationMode ? trafficDay : new Date().getDay(),
    isSimulationMode ? trafficHour : new Date().getHours()
  );

  useEffect(() => {
    if (map && isValidLatLng(graveLocation)) {
      map.flyTo([graveLocation.lat, graveLocation.lng], 18, {
        duration: 1.8,
        easeLinearity: 0.25
      });
    }
  }, [map, graveLocation]);

  const handleZoomIn = () => map?.zoomIn();
  const handleZoomOut = () => map?.zoomOut();
  const handleRecenter = () => {
    if (isValidLatLng(graveLocation)) {
      map?.flyTo([graveLocation.lat, graveLocation.lng], 18);
    } else {
      map?.flyTo(ZANJAN_CENTER, 16);
    }
  };

  const openRouting = (platform: 'neshan' | 'balad' | 'google') => {
    if (!isValidLatLng(graveLocation)) return;
    const { lat, lng } = graveLocation;
    
    // Check if we have user location to provide "From -> To" routing
    const hasOrigin = isValidLatLng(originLocation);
    const originStr = hasOrigin ? `${originLocation.lat},${originLocation.lng}` : null;
    const destStr = `${lat},${lng}`;

    const urls = {
      // Neshan Intent Links (Official Docs: https://nshn.ir/...)
      neshan: hasOrigin 
        ? `https://nshn.ir?origin=${originStr}&destination=${destStr}&vehicle=d`
        : `https://nshn.ir/?lat=${lat}&lng=${lng}`,
      
      // Balad Intent Links
      balad: `https://balad.ir/location?latitude=${lat}&longitude=${lng}`,
      
      // Google Fallback
      google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    };

    window.open(urls[platform], '_blank');
  };

  return (
    <div className="relative w-full h-full bg-stone-950 overflow-hidden group">
      <MapContainer
        center={isValidLatLng(graveLocation) ? [graveLocation.lat, graveLocation.lng] : ZANJAN_CENTER}
        zoom={17}
        minZoom={14}
        maxZoom={19}
        scrollWheelZoom={true}
        className="w-full h-full z-0 font-sans"
        zoomControl={false}
        ref={setMap}
      >
        <MapResizer />
        <MapEventsHandler active={isManualSelectMode} onLocationSelect={onLocationSelect} />

        {/* Live Traffic Overlay Roads */}
        {isTrafficEnabled && TRAFFIC_ROADS.map((road, idx) => {
          const roadColor = road.colors[activeTraffic.level];
          return (
            <Polyline
              key={`traffic-road-${idx}`}
              positions={road.path}
              pathOptions={{
                color: roadColor,
                weight: road.weight,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: activeTraffic.level === 'heavy' ? '6, 6' : activeTraffic.level === 'moderate' ? '12, 12' : undefined
              }}
            >
              <Popup>
                <div className="text-right font-sans text-xs p-1">
                  <span className="font-extrabold text-stone-900 block">{road.name}</span>
                  <span className="text-[10px] text-stone-500 mt-0.5 block">وضعیت فعلی: {activeTraffic.label}</span>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {mapStyle === 'satellite' ? (
          <>
            {/* Esri World Imagery - Pro Grade Satellite Engine */}
            <TileLayer
              attribution='&copy; Esri World Imagery'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            {/* Stamen Toner Labels - High contrast labels for better visibility in Iran */}
            <TileLayer
              url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png"
              className="opacity-80 mix-blend-screen pointer-events-none brightness-110"
              attribution='&copy; Stamen'
            />
          </>
        ) : (
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
        )}

        {isValidLatLng(graveLocation) && (
          <Marker position={[graveLocation.lat, graveLocation.lng]} icon={createCustomIcon('#10b981', 42, true)}>
            <Popup className="custom-popup" offset={[0, -10]}>
              <div className="text-right font-sans p-2 min-w-[160px]">
                <div className="flex items-center gap-2 justify-end mb-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">هدف</span>
                  <p className="font-black text-emerald-900 text-sm">{targetGraveName || 'مزار انتخابی'}</p>
                </div>
                {targetGraveInfo && (
                  <div className="flex items-center gap-1.5 justify-end text-[10px] text-stone-500 mb-3 bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                    <span>قطعه: {targetGraveInfo}</span>
                    <MapPin className="w-3 h-3 text-stone-400" />
                  </div>
                )}
                <div className="flex items-center gap-2 text-[9px] text-emerald-600 font-bold justify-end border-t border-emerald-50 pt-2.5">
                  <span>آماده هدایت ناوبری</span>
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {isValidLatLng(originLocation) && (
          <Marker position={[originLocation.lat, originLocation.lng]} icon={userIcon}>
            <Popup><div className="text-right text-xs font-black font-sans">شما اینجا هستید</div></Popup>
          </Marker>
        )}

        {isValidLatLng(originLocation) && isValidLatLng(graveLocation) && (
          <Polyline 
            positions={[[originLocation.lat, originLocation.lng], [graveLocation.lat, graveLocation.lng]]}
            pathOptions={{ color: '#10b981', weight: 4, dashArray: '12, 16', opacity: 0.8 }}
          />
        )}

        {markers.map((mk) => (
          selectedMarkerId !== mk.id && isValidLatLng(mk.location) && (
            <Marker 
              key={mk.id} 
              position={[mk.location.lat, mk.location.lng]} 
              icon={createCustomIcon('#ffffff', 28, false)}
              eventHandlers={{ click: () => onMarkerClick?.(mk) }}
            >
              <Popup>
                <div className="text-right font-sans p-1">
                  <p className="font-bold text-stone-900">{mk.fullName}</p>
                  {mk.block && <p className="text-[10px] text-stone-500 mt-1">قطعه {mk.block}</p>}
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      {/* Floating Live Traffic Trigger Tool */}
      <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5 max-w-[calc(100%-60px)] pointer-events-auto">
        <motion.button
          onClick={() => setIsTrafficEnabled(!isTrafficEnabled)}
          className={`flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-xl shadow-lg transition-all border font-sans font-black text-[10px] active:scale-95 ${
            isTrafficEnabled 
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' 
              : 'bg-white text-stone-700 border-stone-200/80 hover:bg-stone-50'
          }`}
          whileHover={{ y: -1 }}
        >
          <Activity className={`w-3.5 h-3.5 ${isTrafficEnabled ? 'text-emerald-400 animate-pulse' : 'text-stone-400'}`} />
          <span className="leading-none mt-0.5">ترافیک زنده</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isTrafficEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-stone-300'}`} />
        </motion.button>

        {/* Dynamic traffic summary panel */}
        <AnimatePresence>
          {isTrafficEnabled && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              className="bg-white/95 backdrop-blur-xl border border-emerald-100 p-3 rounded-2xl shadow-2xl w-64 sm:w-72 text-right text-stone-800 flex flex-col gap-2.5 font-sans"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-1.5 flex-row-reverse gap-3">
                <div className="flex items-center gap-1.5 flex-row-reverse">
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${activeTraffic.badgeColor}`}>
                    {activeTraffic.label}
                  </span>
                  <span className="text-[10px] font-black text-stone-900">تردد آرامستان</span>
                </div>
                <button 
                  onClick={() => {
                    setIsSimulationMode(!isSimulationMode);
                    if (!isSimulationMode) {
                      setTrafficDay(new Date().getDay());
                      setTrafficHour(new Date().getHours());
                    }
                  }}
                  className="text-[9px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md transition-colors border border-emerald-100/30"
                >
                  {isSimulationMode ? "زنده" : "شبیه‌ساز"}
                </button>
              </div>

              <div className="text-[10px] leading-relaxed font-bold text-stone-600 space-y-0.5">
                <p className="font-extrabold text-stone-800 flex items-center gap-1 flex-row-reverse mb-0.5">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>
                    {isSimulationMode 
                      ? `${activeTraffic.dayName} ساعت ${trafficHour}:00` 
                      : `کنونی (${activeTraffic.dayName} - ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })})`
                    }
                  </span>
                </p>
                <p className="text-[10px] text-stone-500 leading-normal">{activeTraffic.message}</p>
              </div>

              {/* Congestion Meter Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black text-stone-400 flex-row-reverse">
                  <span>شاخص ازدحام ورودی‌ها</span>
                  <span>{activeTraffic.percent}%</span>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${activeTraffic.percent}%` }}
                    className={`h-full rounded-full ${
                      activeTraffic.level === 'heavy' ? 'bg-red-500' : activeTraffic.level === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Simulation controls when active */}
              {isSimulationMode && (
                <div className="bg-stone-50/80 p-2 rounded-xl border border-stone-100/60 space-y-1.5 text-[10px] mt-0.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-black text-stone-400 text-[8px] mb-0.5">شبیه‌سازی روز:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { day: 4, name: "پنجشنبه" },
                        { day: 5, name: "جمعه" },
                        { day: 1, name: "عادی" }
                      ].map((d) => (
                        <button
                          key={d.day}
                          onClick={() => setTrafficDay(d.day)}
                          className={`py-0.5 px-0.5 rounded-md text-[8px] font-black transition-all ${
                            (d.day === 4 && trafficDay === 4) || (d.day === 5 && trafficDay === 5) || (d.day === 1 && trafficDay !== 4 && trafficDay !== 5)
                              ? 'bg-emerald-900 text-white shadow-sm' 
                              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 pt-0.5">
                    <div className="flex justify-between items-center text-[8px] font-black flex-row-reverse text-stone-400">
                      <span>ساعت مراجعه:</span>
                      <span className="font-mono text-emerald-950 font-black text-[10px]">{trafficHour}:00</span>
                    </div>
                    <input 
                      type="range"
                      min="8"
                      max="20"
                      value={trafficHour}
                      onChange={(e) => setTrafficHour(parseInt(e.target.value))}
                      className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-800"
                    />
                  </div>
                </div>
              )}

              {/* Expert Advisory Guidance Box */}
              <div className="bg-emerald-50/40 rounded-xl p-2 border border-emerald-100/50 text-[9px] font-bold text-emerald-950 leading-relaxed text-right md:leading-normal">
                {activeTraffic.recommendation}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {graveLocation && !isManualSelectMode && (
          <motion.div 
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-xl p-1.5 rounded-2xl shadow-xl border border-white/60"
          >
            <div className="px-3 border-r border-stone-100 hidden md:block text-right">
              <p className="text-[8px] font-black text-emerald-950/45 tracking-wider">NAVIGATION SYSTEM</p>
              <p className="text-[10px] font-black text-emerald-950">مسیریاب‌های بومی</p>
            </div>
            <button onClick={() => openRouting('balad')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all shadow-md active:scale-95 group/btn">
              <MapIcon className="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform" />
              <span className="text-[10px] font-black">بلد</span>
            </button>
            <button onClick={() => openRouting('neshan')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95 group/btn">
              <Navigation className="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform" />
              <span className="text-[10px] font-black">نشان</span>
            </button>
            <button onClick={() => openRouting('google')} className="w-8 h-8 flex items-center justify-center bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all active:scale-90" title="Google Maps">
              <ExternalLink className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        <div className="bg-white/90 backdrop-blur-2xl p-1 rounded-2xl shadow-2xl border border-white/40 flex flex-col gap-1">
          <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center hover:bg-stone-50 rounded-xl transition-all text-stone-800 active:scale-90"><ZoomIn className="w-5 h-5" /></button>
          <div className="h-px bg-stone-100 mx-3" />
          <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center hover:bg-stone-50 rounded-xl transition-all text-stone-800 active:scale-90"><ZoomOut className="w-5 h-5" /></button>
        </div>
        <button onClick={handleRecenter} className="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:shadow-emerald-500/20 active:scale-95 border border-emerald-500/50 group/compass">
          <Compass className="w-6 h-6 group-hover/compass:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 z-10 hidden lg:block group/legend">
        <div className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-white/50 text-right font-sans transition-all w-48 group-hover/legend:w-56 overflow-hidden">
          <h6 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 flex items-center justify-end gap-1.5 flex-row-reverse">
             راهنمای نقشه
             <Info className="w-3 h-3" />
          </h6>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-row-reverse text-[9px] font-bold text-stone-700">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              <span>مزار انتخابی شما</span>
            </div>
            <div className="flex items-center gap-2 flex-row-reverse text-[9px] font-bold text-stone-700">
              <div className="w-2.5 h-2.5 bg-white border border-stone-300 rounded-full" />
              <span>مزارات عمومی</span>
            </div>
            <div className="flex items-center gap-2 flex-row-reverse text-[9px] font-bold text-stone-700">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full outline outline-2 outline-white" />
              <span>موقعیت کنونی شما</span>
            </div>
            <div className="flex items-center gap-2 flex-row-reverse text-[9px] font-bold text-stone-700 border-t border-stone-100 pt-1.5 mt-1.5">
              <div className="w-3 h-0.5 bg-emerald-500 border-t border-dashed border-emerald-500/50" />
              <span>مسیر مستقیم به هدف</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isManualSelectMode && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-x-8 top-10 z-10 bg-emerald-600 text-white p-4 rounded-2xl shadow-4xl flex items-center justify-center gap-4 border border-white/20 backdrop-blur-xl">
            <div className="w-3 h-3 bg-white rounded-full animate-ping" />
            <span className="text-sm font-black tracking-tight">جهت ثبت موقعیت جدید متوفی، روی نقشه ماهواره‌ای کلیک کنید</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 left-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 hidden md:block">
        <div className="bg-stone-900/40 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-white/80 tracking-widest uppercase border border-white/5 shadow-2xl">
          ZANJAN SATELLITE ENGINE v4.5 | ESRI + STAMEN HUB
        </div>
      </div>
    </div>
  );
}
