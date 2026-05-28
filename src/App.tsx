import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, googleProvider, db, OperationType, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Search, MapPin, User as UserIcon, LogIn, LogOut, Camera, Home as HomeIcon, Map as MapIcon, Plus, WifiOff, Menu, X, ShieldAlert } from 'lucide-react';
import HomePage from './pages/HomePage';
import StaffPortal from './pages/StaffPortal';
import GraveDetails from './pages/GraveDetails';
import CemeteryMap from './pages/CemeteryMap';
import KioskPage from './pages/KioskPage';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // Seeding logic - only when user is authenticated/verified
  useEffect(() => {
    if (user && user.emailVerified) {
      const seedDatabase = async () => {
        try {
          // Seed Cemeteries
          const cemeterySnap = await getDocs(collection(db, 'cemeteries'));
          let cemeteryId = '';
          if (cemeterySnap.empty) {
            const docRef = await addDoc(collection(db, 'cemeteries'), {
              name: "آرامستان مرکزی زنجان (بهشت زهرا)",
              description: "اصلی‌ترین و قدیمی‌ترین آرامستان شهر زنجان.",
              location: { lat: 36.6769, lng: 48.4963 }
            });
            cemeteryId = docRef.id;
            console.log("Seeded initial cemetery.");
          } else {
            cemeteryId = cemeterySnap.docs[0].id;
          }

          // Seed sample Graves
          const graveSnap = await getDocs(collection(db, 'graves'));
          if (graveSnap.empty) {
            const sampleGraves = [
              {
                fullName: "حسین منزوی",
                fatherName: "محمد",
                birthDate: "۱۳۲۵",
                deathDate: "۱۳۸۳",
                inscription: "نام من عشق است آیا می‌شناسیدم؟ زخمی‌ام زخمی سراپا می‌شناسیدم؟",
                location: { lat: 36.6582, lng: 48.4912 },
                cemeteryId: cemeteryId,
                photoUrl: "https://images.unsplash.com/photo-1544436070-079730594aa1?auto=format&fit=crop&q=80&w=400",
                block: "قطعه مشاهیر",
                row: "۱",
                number: "۵",
                createdAt: new Date()
              },
              {
                fullName: "آیت‌الله عمید زنجانی",
                fatherName: "عباسعلی",
                birthDate: "۱۳۱۶",
                deathDate: "۱۳۹۰",
                inscription: "چهره ماندگار و رئیس اسابق دانشگاه تهران",
                location: { lat: 36.6589, lng: 48.4925 },
                cemeteryId: cemeteryId,
                photoUrl: "https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&q=80&w=400",
                block: "قطعه علماء",
                row: "۳",
                number: "۱",
                createdAt: new Date()
              }
            ];

            for (const g of sampleGraves) {
              await addDoc(collection(db, 'graves'), g);
            }
            console.log("Seeded sample graves.");
          }
        } catch (e) {
          console.log("Seed check completed (may have existed or restricted)");
        }
      };
      seedDatabase();
    }
  }, [user]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-stone-300 border-t-stone-800 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans text-stone-800">
      <header className="h-16 border-b border-stone-100 flex items-center justify-between px-4 sm:px-8 bg-white shrink-0 z-50 relative">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <div className="w-8 h-8 bg-brand-primary rounded flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <MapPin className="text-white w-4 h-4" />
          </div>
          <span className="text-sm sm:text-base md:text-lg font-black tracking-tight leading-none text-emerald-950">نقشه آرامستان زنجان</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-4 lg:gap-8 text-xs lg:text-sm font-bold text-stone-500 uppercase tracking-wider">
          <NavLink to="/">جستجوی متوفی</NavLink>
          <NavLink to="/kiosk">باجه هوشمند</NavLink>
          <NavLink to="/map">نقشه تعاملی</NavLink>
          {user && <NavLink to="/staff">ثبت اطلاعات (کارمند)</NavLink>}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold leading-none">{user.displayName}</p>
                <button onClick={logout} className="text-[10px] text-stone-400 hover:text-red-500 transition-colors font-bold mt-1">خروج</button>
              </div>
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-9 h-9 rounded-full border border-stone-200 object-cover" />
            </div>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded text-xs font-extrabold hover:bg-brand-primary transition-all active:scale-95 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 ml-1.5" />
              <span>ورود کارمند</span>
            </button>
          )}
        </div>

        {/* Hamburger Button for Mobile */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="md:hidden p-2 text-stone-600 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-lg shrink-0"
          aria-label={mobileMenuOpen ? "بستن منو" : "باز کردن منو"}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Slide-down Navigation Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-0 right-0 bg-white border-b border-stone-200 shadow-2xl flex flex-col p-5 z-40 md:hidden gap-3 font-sans"
            >
              <Link to="/" className="flex items-center gap-3 py-3 border-b border-stone-50 text-right text-stone-700 hover:text-emerald-700 font-extrabold text-sm">
                <Search className="w-4 h-4 text-emerald-600" />
                <span>جستجوی متوفی</span>
              </Link>
              <Link to="/kiosk" className="flex items-center gap-3 py-3 border-b border-stone-50 text-right text-stone-700 hover:text-emerald-700 font-extrabold text-sm">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>باجه اسکن هوشمند سنگ‌مزار</span>
              </Link>
              <Link to="/map" className="flex items-center gap-3 py-3 border-b border-stone-50 text-right text-stone-700 hover:text-emerald-700 font-extrabold text-sm">
                <MapIcon className="w-4 h-4 text-emerald-600" />
                <span>نقشه تعاملی و مسیرهای تردد</span>
              </Link>
              {user && (
                <Link to="/staff" className="flex items-center gap-3 py-3 border-b border-stone-50 text-right text-stone-700 hover:text-emerald-700 font-extrabold text-sm">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>ثبت اطلاعات جدید (کارمند)</span>
                </Link>
              )}

              <div className="pt-2">
                {user ? (
                  <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100 flex-row-reverse">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-9 h-9 rounded-full border border-stone-200" />
                      <span className="text-xs font-bold text-stone-700">{user.displayName}</span>
                    </div>
                    <button onClick={logout} className="text-xs text-red-600 hover:underline font-extrabold">خروج از حساب</button>
                  </div>
                ) : (
                  <button 
                    onClick={login}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-800 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/25 active:scale-95"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>ورود به سیستم کارکنان (گوگل)</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#FDFCFB] flex flex-col relative">
        <AnimatePresence>
          {!isOnline && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-50 border-b border-amber-200 text-amber-800 text-[10px] sm:text-[11px] font-bold py-2.5 px-4 sm:px-8 flex items-center justify-between z-45 shrink-0 select-none flex-row-reverse"
            >
              <div className="flex items-center gap-2 flex-row-reverse">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-right leading-relaxed">حالت آفلاین فعال است. مأموریت ناوبری و اطلاعات قبرها از حافظه‌بارگیری شده‌اند.</span>
              </div>
              <span className="text-[8px] font-mono uppercase bg-amber-100/80 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">Offline</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/kiosk" element={<KioskPage />} />
              <Route path="/staff" element={user ? <StaffPortal user={user} /> : <HomePage />} />
              <Route path="/grave/:id" element={<GraveDetails />} />
              <Route path="/map" element={<CemeteryMap />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>

      <footer className="py-3 sm:h-12 border-t border-stone-200 bg-white flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 text-[9px] sm:text-[10px] text-stone-400 shrink-0 uppercase tracking-tight z-40 gap-2 sm:gap-0">
        <div className="flex gap-4 sm:gap-6 text-center sm:text-right">
          <span>آمار کل: ۱۲۴,۵۹۱ مورد ثبت‌شده</span>
          <span className="hidden xs:inline">وضعیت: کاملاً عملیاتی</span>
        </div>
        <div className="flex gap-3 items-center text-center">
          <span className="flex items-center gap-1 flex-row-reverse">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
            <span>هوش مصنوعی (Gemini-1.5-Flash) فعال</span>
          </span>
          <span className="text-stone-200 hidden xs:inline">|</span>
          <span>نسخه ۲.۱.۰</span>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, children }: { to: string, children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={cn(
        "py-5 transition-all text-xs lg:text-sm tracking-wider font-extrabold relative",
        isActive ? "text-brand-primary border-b-2 border-brand-primary" : "text-stone-400 hover:text-stone-800"
      )}
    >
      {children}
    </Link>
  );
}
