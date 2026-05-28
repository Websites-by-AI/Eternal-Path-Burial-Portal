import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Compass, ZoomIn, ZoomOut, Info, User, Crosshair, ExternalLink, Map as MapIcon, Navigation } from 'lucide-react';
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
const createCustomIcon = (color: string, size: number = 32, isSelected: boolean = false) => {
  const glowValue = isSelected ? 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))' : '';
  const scale = isSelected ? 1.4 : 1;
  const bounceClass = isSelected ? 'animate-bounce' : '';
  
  return L.divIcon({
    html: `<div class="${bounceClass}" style="color: ${color}; filter: ${glowValue}; transform: scale(${scale}); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>`,
    className: 'custom-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

const userIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping"></div>
          <div class="relative bg-blue-600 border-[3px] border-white rounded-full w-5 h-5 shadow-2xl"></div>
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

  useEffect(() => {
    if (map && graveLocation) {
      map.flyTo([graveLocation.lat, graveLocation.lng], 18, {
        duration: 1.8,
        easeLinearity: 0.25
      });
    }
  }, [map, graveLocation]);

  const handleZoomIn = () => map?.zoomIn();
  const handleZoomOut = () => map?.zoomOut();
  const handleRecenter = () => {
    if (graveLocation) {
      map?.flyTo([graveLocation.lat, graveLocation.lng], 18);
    } else {
      map?.flyTo(ZANJAN_CENTER, 16);
    }
  };

  const openRouting = (platform: 'neshan' | 'balad' | 'google') => {
    if (!graveLocation) return;
    const { lat, lng } = graveLocation;
    const urls = {
      neshan: `https://nshn.ir/?lat=${lat}&lng=${lng}&center=${lat},${lng}`,
      balad: `https://balad.ir/location?latitude=${lat}&longitude=${lng}`,
      google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    };
    window.open(urls[platform], '_blank');
  };

  return (
    <div className="relative w-full h-full bg-stone-950 overflow-hidden group">
      <MapContainer
        center={graveLocation ? [graveLocation.lat, graveLocation.lng] : ZANJAN_CENTER}
        zoom={17}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false}
        ref={setMap}
      >
        <MapResizer />
        <MapEventsHandler active={isManualSelectMode} onLocationSelect={onLocationSelect} />

        {mapStyle === 'satellite' ? (
          <>
            <TileLayer
              attribution='&copy; Esri World Imagery'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <TileLayer
              url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png"
              className="opacity-70 mix-blend-screen pointer-events-none"
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

        {graveLocation && (
          <Marker position={[graveLocation.lat, graveLocation.lng]} icon={createCustomIcon('#10b981', 42, true)}>
            <Popup className="custom-popup">
              <div className="text-right font-sans p-2 min-w-[140px]">
                <p className="font-black text-emerald-900 text-sm mb-1">{targetGraveName || 'مزار انتخابی'}</p>
                {targetGraveInfo && <p className="text-[10px] text-stone-500 mb-2 leading-relaxed">{targetGraveInfo}</p>}
                <div className="flex items-center gap-2 text-[9px] text-emerald-600 font-bold justify-end border-t border-emerald-50 pt-2">
                  <span>آماده هدایت ناوبری</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {originLocation && (
          <Marker position={[originLocation.lat, originLocation.lng]} icon={userIcon}>
            <Popup><div className="text-right text-xs font-black font-sans">شما اینجا هستید</div></Popup>
          </Marker>
        )}

        {originLocation && graveLocation && (
          <Polyline 
            positions={[[originLocation.lat, originLocation.lng], [graveLocation.lat, graveLocation.lng]]}
            pathOptions={{ color: '#10b981', weight: 4, dashArray: '12, 16', opacity: 0.8 }}
          />
        )}

        {markers.map((mk) => (
          selectedMarkerId !== mk.id && (
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

      <AnimatePresence>
        {graveLocation && !isManualSelectMode && (
          <motion.div 
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-white/95 backdrop-blur-2xl p-3 rounded-[28px] shadow-4xl border border-white/40"
          >
            <div className="px-5 border-r border-stone-100 hidden sm:block text-right">
              <p className="text-[9px] font-black text-emerald-950/40 uppercase tracking-widest mb-0.5">OPEN IN NAVIGATION APPS</p>
              <p className="text-xs font-black text-emerald-950">مسیریابی هوشمند با مپ‌های بومی</p>
            </div>
            <button onClick={() => openRouting('balad')} className="flex items-center gap-2 px-5 py-3 bg-emerald-700 text-white rounded-2xl hover:bg-emerald-800 transition-all shadow-xl active:scale-95 group/btn">
              <MapIcon className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
              <span className="text-xs font-black">بلد</span>
            </button>
            <button onClick={() => openRouting('neshan')} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl active:scale-95 group/btn">
              <Navigation className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
              <span className="text-xs font-black">نشان</span>
            </button>
            <button onClick={() => openRouting('google')} className="w-12 h-12 flex items-center justify-center bg-stone-100 text-stone-600 rounded-2xl hover:bg-stone-200 transition-all active:scale-90" title="Google Maps">
              <ExternalLink className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-8 right-8 flex flex-col gap-4 z-10">
        <div className="bg-emerald-950/90 backdrop-blur-2xl p-2 rounded-[22px] shadow-4xl border border-white/10 flex flex-col gap-2">
          <button onClick={handleZoomIn} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all text-white active:scale-90"><ZoomIn className="w-6 h-6" /></button>
          <div className="h-px bg-white/10 mx-3" />
          <button onClick={handleZoomOut} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all text-white active:scale-90"><ZoomOut className="w-6 h-6" /></button>
        </div>
        <button onClick={handleRecenter} className="w-16 h-16 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl shadow-3xl flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95 border border-white/20"><Compass className="w-8 h-8" /></button>
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
