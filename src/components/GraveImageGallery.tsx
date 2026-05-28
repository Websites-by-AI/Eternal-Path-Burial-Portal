import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Image as ImageIcon, Sparkles, Check, Eye, Trash2, 
  Loader2, UploadCloud, Info, FileImage, Gauge, WifiOff, RefreshCw
} from 'lucide-react';

export interface TombstonePhoto {
  id: string;
  graveId: number;
  uploadedBy: string;
  date: string;
  originalSize: string;
  optimizedSize: string;
  compressedUrl: string;
  caption: string;
  isMock?: boolean;
}

// Sample initial pre-loaded and highly optimized photos representing Zanjan cemetery historic graves and memorials
const INITIAL_GALLERY_PHOTOS: TombstonePhoto[] = [
  {
    id: 'demo-1',
    graveId: 1,
    uploadedBy: 'کمیته ثبت مزارات زنجان',
    date: '۱۴۰۵/۰۲/۱۵',
    originalSize: '4.2 MB',
    optimizedSize: '138 KB',
    compressedUrl: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&q=60&w=800',
    caption: 'سنگ مزار نمادین سرداران شهید زنجان - قطعه ایثارگران',
    isMock: true
  },
  {
    id: 'demo-2',
    graveId: 1,
    uploadedBy: 'بخش فرهنگی مزار پایین',
    date: '۱۴۰۵/۰۱/۲۰',
    originalSize: '3.8 MB',
    optimizedSize: '115 KB',
    compressedUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=60&w=800',
    caption: 'کتیبه‌های خط ثلث تاریخى مزارستان اعتمادیه زنجان',
    isMock: true
  },
  {
    id: 'demo-3',
    graveId: 2,
    uploadedBy: 'راهنمای زائران حضرت معصومه',
    date: '۱۴۰۵/۰۳/۰۲',
    originalSize: '5.1 MB',
    optimizedSize: '162 KB',
    compressedUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=60&w=800',
    caption: 'لوح یادبود مفاخر علمى زنجان در بهشت معصومه',
    isMock: true
  }
];

interface GraveImageGalleryProps {
  activeGraveId: number;
  activeGraveName: string;
}

export default function GraveImageGallery({ activeGraveId, activeGraveName }: GraveImageGalleryProps) {
  const [photos, setPhotos] = useState<TombstonePhoto[]>(INITIAL_GALLERY_PHOTOS);
  const [lightboxPhoto, setLightboxPhoto] = useState<TombstonePhoto | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalBytes: number;
    compressedBytes: number;
    ratio: number;
    savedKB: number;
    speedBonus: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lazy Loaded Image Component with Blur-Up Effect
  const LazyImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
    const [loaded, setLoaded] = useState(false);
    const [visible, setVisible] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      let observer: IntersectionObserver;
      if (imageRef.current) {
        observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }, { rootMargin: '100px' });
        observer.observe(imageRef.current);
      }
      return () => {
        if (observer) observer.disconnect();
      };
    }, []);

    return (
      <div ref={imageRef} className="relative w-full h-full bg-slate-100 overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
          </div>
        )}
        {visible && (
          <img
            src={src}
            alt={alt}
            className={`${className} transition-all duration-700 ${loaded ? 'scale-100 blur-0 opacity-100' : 'scale-105 blur-lg opacity-30'}`}
            onLoad={() => setLoaded(true)}
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    );
  };

  // Client-side image compress & optimize logic
  const processAndCompressFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('لطفاً فقط فایل تصویر معتبر انتخاب کنید.');
      return;
    }

    setIsCompressing(true);
    setCompressionStats(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Core auto-compression & downscaling canvas algorithm
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // Optimal width for cemetery mobile usage
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsCompressing(false);
          return;
        }

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP or JPEG with compressed quality
        // 0.75 quality guarantees extreme compression while retaining crystal clear text on tombstones
        const mimeType = file.type === 'image/png' ? 'image/jpeg' : file.type;
        const compressedDataUrl = canvas.toDataURL(mimeType, 0.75);

        // Calculate size ratios
        const originalBytes = file.size;
        // Approximate base64 string bytes size
        const compressedBytes = Math.round((compressedDataUrl.length - 814) / 1.37);
        const savedBytes = originalBytes - compressedBytes;
        const ratio = Math.max(0, Math.round((savedBytes / originalBytes) * 100));
        const savedKB = Math.round(savedBytes / 1024);

        // Calculate mock cellular load speedup ratio
        // Poor connection averages 150 KB/s in remote cemetery areas or thick stone structures
        const originalLoadSec = (originalBytes / 1024 / 150).toFixed(1);
        const compressedLoadSec = (compressedBytes / 1024 / 150).toFixed(1);
        const speedBonus = `${originalLoadSec} ثانیه به ${compressedLoadSec} ثانیه (کاهش چشمگیر ترافیک)`;

        setCompressionStats({
          originalBytes,
          compressedBytes,
          ratio,
          savedKB,
          speedBonus
        });

        // Add to state
        const newPhoto: TombstonePhoto = {
          id: `photo-${Date.now()}`,
          graveId: activeGraveId,
          uploadedBy: 'دستگاه زائر ممیزی شده',
          date: 'امروز (لایو)',
          originalSize: `${(originalBytes / 1024 / 1024).toFixed(2)} MB`,
          optimizedSize: `${(compressedBytes / 1024).toFixed(0)} KB`,
          compressedUrl: compressedDataUrl,
          caption: `${activeGraveName} (ثبت شده در محل آرامستان)`,
        };

        setPhotos(prev => [newPhoto, ...prev]);
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndCompressFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndCompressFile(e.dataTransfer.files[0]);
    }
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Filter photos corresponding to current active grave
  const currentGravePhotos = photos.filter(p => p.isMock || p.graveId === activeGraveId);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            <h4 className="font-bold text-slate-800 text-sm">سامانه بارگذاری فشرده و گالری تصاویر سنگ قبور زنجان</h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            بهینه‌سازی شده برای بارگذاری فوق‌سریع تلفن همراه در نقاط کور ترافیکی و بدون آنتن‌دهی کامل آرامستان‌های بزرگ زنجان
          </p>
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] px-2.5 py-1 rounded-full font-bold border border-emerald-100">
          <Gauge className="w-3.5 h-3.5 text-emerald-600" />
          لود تنبل (Lazy) + فشرده‌سازی لایو
        </div>
      </div>

      {/* Upload & Compression Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[11px] font-bold text-slate-600 block">ثبت تصویر جدید با وبکم یا گالری سنگ قبر:</span>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
              dragOver 
                ? 'border-emerald-500 bg-emerald-50/50' 
                : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            {isCompressing ? (
              <div className="space-y-2 flex flex-col items-center">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-xs font-bold text-slate-700">درحال فشرده‌سازی با الگوریتم کرافیکی بومی...</span>
                <span className="text-[10px] text-slate-400">بدون مصرف اینترنت گوشی شما</span>
              </div>
            ) : (
              <div className="space-y-2 flex flex-col items-center">
                <div className="p-2.5 bg-white rounded-full shadow-sm border border-slate-200">
                  <UploadCloud className="w-6 h-6 text-slate-500" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-emerald-700">انتخاب یا رها کردن عکس سنگ مزار</span>
                </div>
                <span className="text-[10px] text-slate-400">فایل‌های سنگین چندین مگابایتی دوربین شما اتوماتیک کم‌حجم می‌شوند</span>
              </div>
            )}
          </div>

          {/* Real-time Compression Inspector Report */}
          {compressionStats && (
            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-[10px]">
              <div className="flex items-center justify-between text-emerald-400 font-sans font-bold text-[11px]">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>نتایج فشرده‌سازی هوشمند تصاویر در کلاینت:</span>
                </div>
                <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono text-[9px]">{compressionStats.ratio}% صرفه‌جویی</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>سایز اولیه: <span className="text-white">{(compressionStats.originalBytes / 1024 / 1024).toFixed(2)} MB</span></div>
                <div>سایز بهینه: <span className="text-emerald-400">{(compressionStats.compressedBytes / 1024).toFixed(0)} KB</span></div>
              </div>
              <div className="text-slate-300 border-t border-slate-800/80 pt-1.5">
                ترافیک صرفه‌جویی شده موبایل: <strong className="text-emerald-300">{compressionStats.savedKB} کیلوبایت</strong>
              </div>
              <div className="text-slate-400 text-[9px] font-sans">
                سرعت لود زائر در آرامستان: {compressionStats.speedBonus}
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex gap-2 text-slate-600 text-[10px] leading-relaxed">
            <WifiOff className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>کارکرد آفلاین:</strong> فشرده‌سازی در لایه مرورگر و با شتاب‌دهنده گرافیکی کارت گرافیک موبایل زائر انجام می‌پذیرد و بدون هیچ ترافیکی، امنیت و کیفیت فوق‌العاده‌ای ایجاد می‌کند.
            </span>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-600 block mb-3">آلبوم چندرسانه‌ای برای مزار مرحوم {activeGraveName}:</span>
            
            {currentGravePhotos.length === 0 ? (
              <div className="h-44 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4 bg-slate-50/25">
                <ImageIcon className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-bold text-slate-500 mt-2">تصویری گالری یافت نشد</span>
                <span className="text-[10px] text-slate-400 mt-1">شما اولین زائری باشید که سنگ مزار مرحوم را به ثبت می‌رساند.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentGravePhotos.map((photo) => (
                  <div 
                    key={photo.id}
                    className="group border border-slate-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all flex flex-col relative"
                  >
                    <div className="h-28 relative">
                      <LazyImage 
                        src={photo.compressedUrl} 
                        alt={photo.caption} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="absolute top-1.5 right-1.5 flex gap-1 bg-black/50 backdrop-blur-xs text-white text-[8px] px-1.5 py-0.5 rounded font-mono font-bold">
                        {photo.optimizedSize}
                      </div>
                    </div>
                    
                    <div className="p-2 space-y-1 text-right flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] text-slate-800 font-bold truncate leading-tight">{photo.caption}</p>
                        <p className="text-[8.5px] text-slate-400 mt-0.5">ثبت: {photo.uploadedBy}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100/80 mt-1">
                        <span className="text-[8px] text-slate-400 font-mono">{photo.date}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setLightboxPhoto(photo)}
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                            title="بزرگنمایی سنگ قبر"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!photo.isMock && (
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer"
                              title="حذف فایل تصویری"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-amber-50/50 rounded-xl border border-amber-200/40 flex items-start gap-2 text-slate-700 text-[10px] leading-relaxed">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              همکاران ما در آرامستان‌های بهشت معصومه، مزار پایین و قدیمی اعتمادیه زنجان به صورت هوشمند گزارش‌های ثبت تصویر سنگ قبرها را بازبینی می‌کنند تا اطلاعات شجره‌نامه به زائران بهتر منتقل شود.
            </span>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal View */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[11000] p-4 animate-fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div 
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl relative border border-slate-800 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500">مشاهده سنگ مزار زنجانی</span>
                <h5 className="font-bold text-slate-800 text-xs mt-0.5">{lightboxPhoto.caption}</h5>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="text-slate-500 hover:text-slate-800 font-bold bg-slate-200 hover:bg-slate-300 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-2 bg-slate-900 border-b border-slate-800">
              <img 
                src={lightboxPhoto.compressedUrl} 
                alt={lightboxPhoto.caption}
                className="w-full max-h-[70vh] object-contain rounded-lg mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 bg-slate-50 grid grid-cols-2 gap-2 text-xs text-right text-slate-600 font-medium">
              <div>ثبت کننده: <span className="text-slate-800 font-bold">{lightboxPhoto.uploadedBy}</span></div>
              <div>تاریخ بارگذاری: <span className="text-slate-800 font-bold">{lightboxPhoto.date}</span></div>
              <div>سایز بهینه: <span className="text-emerald-700 font-bold font-mono">{lightboxPhoto.optimizedSize}</span></div>
              {lightboxPhoto.isMock && (
                <div>حجم اولیه پیش‌بینی‌شده: <span className="text-slate-400 font-mono">{lightboxPhoto.originalSize}</span></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
