import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, Heart, Sparkles, Image as ImageIcon } from 'lucide-react';

interface GravestonePortraitProps {
  fullName: string;
  fatherName?: string;
  birthDate: string;
  deathDate: string;
  inscription: string;
  photoUrl?: string;
  className?: string;
}

export default function GravestonePortrait({
  fullName,
  fatherName = "نامشخص",
  birthDate,
  deathDate,
  inscription,
  photoUrl,
  className = ""
}: GravestonePortraitProps) {
  const [imageError, setImageError] = useState(false);

  // If a photo exists and hasn't failed to load, render the organic photo
  if (photoUrl && !imageError) {
    return (
      <img 
        src={photoUrl} 
        onError={() => setImageError(true)} 
        className={`${className} w-full h-full object-cover grayscale transition-all duration-700 hover:grayscale-0`} 
        alt={fullName} 
      />
    );
  }

  // Elegant offline-safe procedural SVG Grave tablet representing Zanjan's classic stone carvings
  return (
    <div className={`relative w-full h-full bg-stone-900 border-4 border-stone-800 p-8 rounded shadow-inner flex flex-col justify-between overflow-hidden text-center text-white font-sans ${className}`}>
      {/* Intricate Islamic border design */}
      <div className="absolute inset-4 border border-stone-700 opacity-40 pointer-events-none" />
      <div className="absolute inset-5 border-2 border-double border-stone-700 opacity-60 pointer-events-none" />
      
      {/* Glistening marble grain background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      
      {/* Top Header Quran Calligraphy representation */}
      <div className="relative z-10 flex flex-col items-center mt-2">
        <span className="text-[10px] tracking-widest text-[#1abc9c]/80 font-semibold font-mono">بسم الله الرحمن الرحیم</span>
        <h3 className="text-xl md:text-2xl font-bold text-stone-300 mt-2 font-serif italic">هو الباقی</h3>
        <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-[#1abc9c] to-transparent mt-2" />
      </div>

      {/* Main Grave Engraving */}
      <div className="relative z-10 my-4 space-y-4">
        <span className="text-[10px] uppercase text-stone-500 font-bold tracking-widest block">آرامگاه ابدی مرحوم مغفور</span>
        
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-wide font-sans leading-tight">
          {fullName}
        </h2>
        
        <p className="text-xs text-stone-400 font-medium">
          فرزند گرانقدر: <span className="text-stone-200 font-bold">{fatherName}</span>
        </p>
      </div>

      {/* Persian Inscription */}
      <div className="relative z-10 px-4">
        <p className="text-[11px] md:text-xs text-stone-300 italic leading-relaxed max-w-sm mx-auto opacity-90 line-clamp-3">
          "{inscription || 'روحت شاد و یادت تا ابد گرامی باد.'}"
        </p>
      </div>

      {/* Date Plates (Traditional circular/oval plates) */}
      <div className="relative z-10 flex justify-center items-center gap-6 mt-4 mb-2">
        <div className="flex flex-col items-center bg-stone-800/80 px-4 py-2 border border-stone-700 rounded-sm">
          <span className="text-[8px] text-stone-500 font-bold block uppercase">ولادت / پیدایش</span>
          <span className="text-sm font-bold text-stone-200 font-mono mt-0.5">{birthDate || 'نامشخص'}</span>
        </div>
        
        <div className="w-4 h-[1px] bg-stone-700" />
        
        <div className="flex flex-col items-center bg-stone-800/80 px-4 py-2 border border-stone-700 rounded-sm">
          <span className="text-[8px] text-emerald-500 font-bold block uppercase">وفات / عروج</span>
          <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{deathDate || 'نامشخص'}</span>
        </div>
      </div>

      {/* Bottom status line */}
      <div className="relative z-10 text-[8px] text-stone-600 font-mono uppercase tracking-[0.2em]">
        آرامستان عمومی بهشت زهرا (س) زنجان • آفلاین تبلت
      </div>
    </div>
  );
}
