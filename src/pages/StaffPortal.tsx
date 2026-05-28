import React, { useState, useEffect, useRef } from 'react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { extractGraveInfo, ExtractedGraveInfo } from '../lib/gemini';
import { User as FirebaseUser } from 'firebase/auth';
import { Camera, MapPin, Upload, FileCheck, CheckCircle2, AlertCircle, Loader2, Save, Wand2, RefreshCw, Plus, Map as MapIcon, Navigation, Database, Download, Trash2, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import OfflineCemeteryMap from '../components/OfflineCemeteryMap';

import Papa from 'papaparse';

interface StaffPortalProps {
  user: FirebaseUser;
}

type Step = 'photo' | 'ai' | 'location' | 'confirm' | 'success';
type ViewMode = 'individual' | 'bulk';

export default function StaffPortal({ user }: StaffPortalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [step, setStep] = useState<Step>('photo');
  const [photo, setPhoto] = useState<string | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedGraveInfo | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cemeteryId, setCemeteryId] = useState('');
  const [cemeteries, setCemeteries] = useState<any[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 36.6769, lng: 48.4963 });

  // Bulk Upload State
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    fetchCemeteries();
  }, []);

  const fetchCemeteries = async () => {
    const snap = await getDocs(collection(db, 'cemeteries'));
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCemeteries(list);
    if (list.length > 0) setCemeteryId(list[0].id);
  };

  const handleBulkCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const required = ['fullName', 'lat', 'lng'];
        const missing = required.filter(col => !results.meta.fields?.includes(col));
        
        if (missing.length > 0) {
          setBulkError(`ستون‌های ضروری یافت نشدند: ${missing.join(', ')}`);
          return;
        }

        const formatted = results.data.map((row: any) => ({
          fullName: row.fullName || '',
          fatherName: row.fatherName || '',
          birthDate: row.birthDate || '',
          deathDate: row.deathDate || '',
          inscription: row.inscription || '',
          block: row.block || '',
          row: row.row || '',
          number: row.number || '',
          location: {
            lat: parseFloat(row.lat),
            lng: parseFloat(row.lng)
          },
          cemeteryId: cemeteryId,
          photoUrl: row.photoUrl || 'https://images.unsplash.com/photo-1544436070-079730594aa1?auto=format&fit=crop&q=80&w=400',
          createdAt: new Date(),
          createdBy: user.uid
        }));

        setBulkData(formatted);
      },
      error: (err) => setBulkError(`خطا در پردازش فایل: ${err.message}`)
    });
  };

  const saveBulkData = async () => {
    if (bulkData.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);

    let successCount = 0;
    try {
      for (let i = 0; i < bulkData.length; i++) {
        await addDoc(collection(db, 'graves'), {
          ...bulkData[i],
          createdAt: serverTimestamp()
        });
        successCount++;
        setUploadProgress(Math.round(((i + 1) / bulkData.length) * 100));
      }
      setStep('success');
      setBulkData([]);
    } catch (err) {
      setBulkError(`تنها ${successCount} مورد با موفقیت ثبت شد. خطا: ${err instanceof Error ? err.message : 'نامشخص'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "fullName,fatherName,birthDate,deathDate,inscription,block,row,number,lat,lng,photoUrl\n" + 
                     "نام متوفی,نام پدر,۱۳۰۰,۱۴۰۰,متن کتیبه,قطعه ۱,ردیف ۱,شماره ۱,۳۶.۶۵۸۲,۴۸.۴۹۱۲,URL_PHOTO";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "cemetery_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setStep('ai');
      };
      reader.readAsDataURL(file);
    }
  };

  const processWithAI = async () => {
    if (!photo) return;
    setIsLoading(true);
    setError(null);
    try {
      const base64 = photo.split(',')[1];
      const data = await extractGraveInfo(base64);
      setExtractedInfo(data);
      setStep('location');
    } catch (err) {
      setError("AI analysis failed. Please enter details manually.");
      setExtractedInfo({ fullName: '', fatherName: '', birthDate: '', deathDate: '', inscription: '' });
      setStep('location');
    } finally {
      setIsLoading(false);
    }
  };

  const captureLocation = () => {
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);
        setStep('confirm');
      },
      (err) => {
        setError("دسترسی به موقعیت مکانی انجام نشد. لطفاً به صورت دستی روی نقشه انتخاب کنید.");
        setIsLoading(false);
        setIsManualMode(true);
      }
    );
  };

  const handleSave = async () => {
    if (!extractedInfo || !location) return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'graves'), {
        ...extractedInfo,
        location,
        photoUrl: photo, // In production, upload to Firebase Storage first
        cemeteryId,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setStep('success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'graves');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setPhoto(null);
    setExtractedInfo(null);
    setLocation(null);
    setStep('photo');
    setError(null);
  };

  const steps = [
    { id: 'photo', label: 'بارگذاری عکس', icon: Camera },
    { id: 'ai', label: 'پردازش هوشمند', icon: Wand2 },
    { id: 'location', label: 'ثبت موقعیت', icon: MapPin },
    { id: 'confirm', label: 'تایید نهایی', icon: FileCheck },
  ];

  return (
    <div className="max-w-4xl mx-auto px-8 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight mb-4 uppercase">پنل مدیریت آرامستان</h2>
        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-relaxed">رابط کاربری ثبت اطلاعات میدانی و بایگانی دیجیتال.</p>
      </div>

      <div className="flex justify-center mb-8 gap-1 p-1 bg-stone-100 rounded-lg w-fit mx-auto">
        <button 
          onClick={() => setViewMode('individual')}
          className={cn(
            "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
            viewMode === 'individual' ? "bg-white text-stone-900 shadow-sm" : "text-stone-900 shadow-none"
          )}
        >
          ثبت تکی (هوشمند)
        </button>
        <button 
          onClick={() => setViewMode('bulk')}
          className={cn(
            "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
            viewMode === 'bulk' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
          )}
        >
          بارگذاری دسته‌جمعی (CSV)
        </button>
      </div>

      {/* Guide Section */}
      <div className="max-w-4xl mx-auto mb-12 bg-amber-50/50 border border-amber-100 rounded-xl p-6 text-right font-sans">
        <div className="flex items-center gap-3 flex-row-reverse mb-4 text-amber-900">
          <AlertCircle className="w-5 h-5" />
          <h4 className="text-sm font-black uppercase tracking-widest">راهنمای بارگذاری و بایگانی دیجیتال</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h5 className="text-[11px] font-black text-amber-800">۱. ثبت در محل (تکی)</h5>
            <p className="text-[10px] text-amber-700/80 leading-relaxed font-bold">از سنگ مزار عکس بگیرید؛ هوش مصنوعی متن را استخراج کرده و GPS گوشی شما محل دقیق را ثبت می‌کند.</p>
          </div>
          <div className="space-y-2">
            <h5 className="text-[11px] font-black text-amber-800">۲. بارگذاری انبوه (CSV)</h5>
            <p className="text-[10px] text-amber-700/80 leading-relaxed font-bold">اطلاعات بایگانی کاغذی را در فایل اکسل وارد کرده و با فرمت CSV ذخیره و بارگذاری کنید.</p>
          </div>
          <div className="space-y-2">
            <h5 className="text-[11px] font-black text-amber-800">۳. همگام‌سازی نهایی</h5>
            <p className="text-[10px] text-amber-700/80 leading-relaxed font-bold">پس از تایید اطلاعات، داده‌ها در پایگاه داده ابری (Firebase/Cloudflare) ذخیره و در نقشه عمومی فعال می‌شوند.</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-2xl overflow-hidden border border-stone-100 rounded-sm">
        {/* Progress Bar (Only for individual) */}
        {viewMode === 'individual' && (
          <div className="bg-stone-900 h-20 flex justify-between items-center px-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,#fff,#fff_1px,transparent_1px,transparent_10px)]" />
            {steps.map((s, i) => {
              const Icon = s.icon;
              const active = i <= ['photo', 'ai', 'location', 'confirm'].indexOf(step);
              return (
                <div key={s.id} className={cn("relative z-10 flex flex-col items-center gap-1 transition-opacity", !active && "opacity-30")}>
                  <div className={cn("w-8 h-8 rounded-sm flex items-center justify-center border-2 transition-all", active ? "bg-white border-white text-stone-900" : "border-white/30 text-white")}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] text-white font-bold uppercase tracking-widest">{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'bulk' && (
          <div className="bg-emerald-900 h-20 flex items-center px-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,#fff,#fff_1px,transparent_1px,transparent_10px)]" />
            <div className="relative z-10 flex items-center gap-3">
              <Database className="text-white w-6 h-6 border-2 border-white/30 p-1 rounded-sm" />
              <div>
                <h3 className="text-white text-xs font-black uppercase tracking-widest">مدیریت کلان داده‌ها</h3>
                <p className="text-[8px] text-emerald-300 font-bold uppercase tracking-[0.2em]">Bulk Data Entry System</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-12">
          {viewMode === 'bulk' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border-2 border-dashed border-stone-200 rounded-xl p-10 bg-stone-50/50 hover:border-emerald-500 transition-all text-center group cursor-pointer relative">
                  <input type="file" accept=".csv" onChange={handleBulkCSV} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="w-12 h-12 bg-white rounded-md mx-auto mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-stone-400 group-hover:text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-black uppercase mb-1">بارگذاری فایل CSV</h4>
                  <p className="text-[10px] text-stone-400 font-bold">فایل اکسل با فرمت CSV را اینجا بکشید یا کلیک کنید</p>
                </div>

                <div className="bg-white border border-stone-100 rounded-xl p-8 flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-4 flex-row-reverse text-right">
                    <Download className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-black uppercase">الگوی استاندارد یونیکد</h4>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-relaxed text-right mb-6">برای جلوگیری از تداخل کاراکترهای فارسی، حتماً از الگو استفاده کرده و فایل را در حالت UTF-8 ذخیره کنید.</p>
                  <button 
                    onClick={downloadTemplate}
                    className="w-full py-3 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-stone-600 hover:bg-stone-100 transition-all flex items-center justify-center gap-2"
                  >
                    <span>دریافت فایل الگو (Template)</span>
                  </button>
                </div>
              </div>

              {bulkData.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="border border-emerald-100 rounded-xl overflow-hidden bg-white shadow-lg"
                >
                  <div className="bg-emerald-50 px-6 py-3 flex items-center justify-between flex-row-reverse font-sans">
                    <div className="flex items-center gap-2 text-emerald-900">
                      <FileJson className="w-4 h-4" />
                      <span className="text-xs font-black">{bulkData.length} مورد برای بارگذاری شناسایی شد</span>
                    </div>
                    <button onClick={() => setBulkData([])} className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" />
                      پاکسازی لیست
                    </button>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200">
                    <table className="w-full text-right text-[10px] font-bold">
                      <thead className="bg-stone-50 sticky top-0 uppercase tracking-widest text-stone-400 border-b border-stone-100">
                        <tr>
                          <th className="px-6 py-2">نام متوفی</th>
                          <th className="px-6 py-2">بلوک / ردیف / شماره</th>
                          <th className="px-6 py-2">مختصات</th>
                          <th className="px-6 py-2">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {bulkData.map((row, i) => (
                          <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                            <td className="px-6 py-3 text-stone-900">{row.fullName}</td>
                            <td className="px-6 py-3 text-stone-500">{row.block || '-'} / {row.row || '-'} / {row.number || '-'}</td>
                            <td className="px-6 py-3 font-mono text-[9px] text-stone-400">{row.location.lat.toFixed(4)}, {row.location.lng.toFixed(4)}</td>
                            <td className="px-6 py-3 text-emerald-600">آماده ثبت</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-6 bg-stone-50 border-t border-stone-100 italic text-[9px] text-stone-400">
                    * توجه: تصاویر باید بصورت URL معتبر در فایل CSV قرار بگیرند. در غیر این صورت تصویر پیش‌فرض جایگزین خواهد شد.
                  </div>

                  <div className="p-6 bg-stone-50 border-t border-stone-100 text-right">
                    <h5 className="text-[10px] font-black uppercase mb-2">راهنمای بارگذاری</h5>
                    <ul className="list-disc list-inside space-y-1 text-stone-500 leading-relaxed pr-2">
                       <li>فایل را حتماً با فرمت CSV ذخیره کنید.</li>
                       <li>مختصات (lat, lng) باید اعداد اعشاری باشند.</li>
                       <li>نام ستون‌ها باید دقیقاً مطابق الگو باشد.</li>
                    </ul>
                  </div>

                  <div className="p-6 bg-stone-50 border-t border-stone-100">
                    <button 
                      onClick={saveBulkData}
                      disabled={isUploading}
                      className="w-full py-4 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>در حال بارگذاری... ({uploadProgress}%)</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>شروع همگام‌سازی با پایگاه داده</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {bulkError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[10px] font-bold flex items-center gap-3 flex-row-reverse text-right">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
            {step === 'photo' && (
              <motion.div 
                key="photo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="border-2 border-dashed border-stone-200 rounded-xl p-12 hover:border-brand-primary transition-all cursor-pointer group bg-stone-50/50">
                  <div className="w-16 h-16 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-stone-400 group-hover:text-brand-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 uppercase tracking-tight">ارسال تصویر مزار</h3>
                  <p className="text-[11px] text-stone-500 mb-8 max-w-[240px] mx-auto uppercase tracking-wide font-medium leading-relaxed">لطفاً یک تصویر واضح و عمودی از سنگ مزار متوفی بگیرید.</p>
                  
                  <label className="inline-block bg-stone-900 text-white px-8 py-3 rounded-sm font-bold uppercase tracking-widest cursor-pointer hover:bg-brand-primary shadow-sm transition-all text-[10px]">
                    انتخاب فایل تصویر
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </motion.div>
            )}

            {step === 'ai' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="relative w-64 aspect-[3/4] mx-auto mb-12 rounded-sm overflow-hidden shadow-2xl border-8 border-white">
                  <img src={photo || ''} className="w-full h-full object-cover" alt="Preview" />
                  {isLoading && (
                    <div className="absolute inset-0 bg-stone-900/80 backdrop-blur shadow-inner flex flex-col items-center justify-center text-white p-8">
                      <div className="w-12 h-12 border-t-2 border-white rounded-full animate-spin mb-6" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">در حال استخراج اطلاعات...</p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={processWithAI}
                  disabled={isLoading}
                  className="bg-brand-primary text-white px-10 py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-stone-800 disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-3 mx-auto"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>تحلیل هوشمند سنگ مزار</span>
                </button>
              </motion.div>
            )}

            {step === 'location' && (
              <motion.div 
                key="location"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-stone-50 border border-stone-100 rounded-sm flex items-center justify-center mx-auto mb-8 text-stone-900 transition-all">
                  {isManualMode ? <MapIcon className="w-8 h-8 text-brand-secondary" /> : <MapPin className="w-8 h-8 text-brand-primary" />}
                </div>
                <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">
                  {isManualMode ? 'انتخاب دستی موقعیت' : 'نشانه‌گذاری جغرافیایی'}
                </h3>
                <p className="text-[11px] text-stone-500 mb-12 max-w-[280px] mx-auto uppercase tracking-wide font-medium leading-relaxed">
                  {isManualMode 
                    ? 'لطفاً محل دقیق مزار را روی نقشه زیر لمس یا کلیک کنید.' 
                    : 'لطفاً مستقیماً در مقابل مزار بایستید تا مختصات دقیق ثبت شود.'}
                </p>
                
                <div className="flex flex-col gap-6 max-w-lg mx-auto">
                  <div className="text-right">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1 block">آرامستان مربوطه</label>
                    <select 
                      value={cemeteryId}
                      onChange={(e) => setCemeteryId(e.target.value)}
                      className="w-full p-3 border border-stone-200 rounded-md font-bold text-stone-800 outline-none text-xs bg-white"
                    >
                      {cemeteries.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {isManualMode ? (
                    <div className="space-y-6 text-right">
                      <div className="h-[360px] rounded-sm border border-stone-200 overflow-hidden relative shadow-inner">
                        <OfflineCemeteryMap 
                          isManualSelectMode={true}
                          onLocationSelect={(loc) => setLocation(loc)}
                          graveLocation={location}
                        />
                      </div>
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setIsManualMode(false)}
                          className="flex-1 py-4 border border-stone-200 rounded-sm font-bold uppercase tracking-widest text-[10px] text-stone-400 hover:text-stone-800 transition-all font-mono"
                        >
                          بازگشت به GPS
                        </button>
                        <button 
                          disabled={!location}
                          onClick={() => setStep('confirm')}
                          className="flex-[2] bg-brand-primary text-white py-4 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-stone-800 transition-all shadow-sm"
                        >
                          تایید موقعیت انتخابی
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <button 
                        onClick={captureLocation}
                        disabled={isLoading}
                        className="bg-stone-900 text-white py-4 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-brand-primary transition-all flex items-center justify-center gap-3 shadow-sm"
                      >
                        {isLoading ? <div className="w-3 h-3 border-t-2 border-white rounded-full animate-spin" /> : <MapPin className="w-3 h-3" />}
                        <span>ثبت مختصات فعلی (GPS)</span>
                      </button>
                      
                      <button 
                        onClick={() => setIsManualMode(true)}
                        className="text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
                      >
                        <MapIcon className="w-3 h-3" />
                        یا انتخاب دستی روی نقشه
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded text-red-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div 
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400 flex items-center gap-2 border-b border-stone-100 pb-3">
                       <FileCheck className="w-4 h-4" />
                       تایید اطلاعات بایگانی
                    </h3>
                    <div className="space-y-4 text-right">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-1">نام متوفی</label>
                          <input 
                            type="text" 
                            value={extractedInfo?.fullName || ''} 
                            onChange={(e) => setExtractedInfo(prev => prev ? {...prev, fullName: e.target.value} : null)}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-md font-semibold text-xs outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-1">نام پدر</label>
                          <input 
                            type="text" 
                            value={extractedInfo?.fatherName || ''} 
                            onChange={(e) => setExtractedInfo(prev => prev ? {...prev, fatherName: e.target.value} : null)}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-md font-semibold text-xs outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-1">تاریخ تولد</label>
                          <input 
                            type="text" 
                            value={extractedInfo?.birthDate || ''} 
                            onChange={(e) => setExtractedInfo(prev => prev ? {...prev, birthDate: e.target.value} : null)}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-md font-semibold text-xs outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-1">تاریخ وفات</label>
                          <input 
                            type="text" 
                            value={extractedInfo?.deathDate || ''} 
                            onChange={(e) => setExtractedInfo(prev => prev ? {...prev, deathDate: e.target.value} : null)}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-md font-semibold text-xs outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-1">متن کتیبه یا یادداشت</label>
                        <textarea 
                          rows={3}
                          value={extractedInfo?.inscription || ''} 
                          onChange={(e) => setExtractedInfo(prev => prev ? {...prev, inscription: e.target.value} : null)}
                          className="w-full p-3 bg-stone-50 border border-stone-200 rounded-md font-semibold text-xs outline-none focus:ring-1 focus:ring-brand-primary resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                     <div className="rounded border border-stone-200 overflow-hidden shadow-inner aspect-[4/3] bg-stone-100">
                        <img src={photo || ''} className="w-full h-full object-cover grayscale" alt="Final" />
                     </div>
                     <div className="p-4 bg-emerald-50 border border-emerald-100 rounded flex items-center justify-between">
                        <div className="text-right">
                           <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-800 block mb-1">مختصات ثبت شد</span>
                           <p className="font-mono text-[10px] text-emerald-600">{location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                     </div>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-12 pt-8 border-t border-stone-100">
                   <button onClick={reset} className="flex-1 py-3 border border-stone-200 rounded-sm font-bold uppercase tracking-widest text-[10px] text-stone-400 hover:text-stone-800 hover:bg-stone-50 transition-all">لغو عملیات</button>
                   <button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    className="flex-[2] py-3 bg-stone-900 text-white rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-brand-primary shadow-sm transition-all flex items-center justify-center gap-3"
                   >
                     {isLoading ? <div className="w-3 h-3 border-t-2 border-white rounded-full animate-spin" /> : <Save className="w-3 h-3" />}
                     <span>ثبت نهایی در بایگانی</span>
                   </button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
               <motion.div 
                 key="success"
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="text-center py-12"
               >
                 <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="w-12 h-12" />
                 </div>
                 <h3 className="text-3xl font-bold mb-4">ثبت اطلاعات با موفقیت انجام شد</h3>
                 <p className="text-stone-500 mb-12">پرونده دیجیتال متوفی اکنون در سامانه عمومی قابل جستجو و مسیریابی است.</p>
                 <button onClick={reset} className="px-12 py-4 bg-stone-900 text-white rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-brand-primary shadow-sm transition-all flex items-center gap-3 mx-auto">
                    <Plus className="w-4 h-4 ml-2" />
                    ثبت پرونده جدید
                 </button>
               </motion.div>
            )}
          </AnimatePresence>
        )}
        </div>
      </div>
    </div>
  );
}
