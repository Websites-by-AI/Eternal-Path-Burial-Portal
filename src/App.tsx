import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, googleProvider, db, OperationType, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Search, MapPin, User as UserIcon, LogIn, LogOut, Camera, Home as HomeIcon, Map as MapIcon, Plus, WifiOff } from 'lucide-react';
import HomePage from './pages/HomePage';
import StaffPortal from './pages/StaffPortal';
import GraveDetails from './pages/GraveDetails';
import CemeteryMap from './pages/CemeteryMap';
import KioskPage from './pages/KioskPage';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    <Router>
      <div className="flex flex-col h-screen overflow-hidden font-sans text-stone-800">
        <header className="h-16 border-b border-stone-200 flex items-center justify-between px-8 bg-white shrink-0 z-50">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-brand-primary rounded-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              <MapPin className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight uppercase">سامانه نقشه آرامستان</span>
          </Link>

          <nav className="flex gap-8 text-sm font-medium text-stone-500 uppercase tracking-widest">
            <NavLink to="/">جستجوی متوفی</NavLink>
            <NavLink to="/kiosk">باجه هوشمند</NavLink>
            <NavLink to="/map">نقشه تعاملی</NavLink>
            {user && <NavLink to="/staff">ثبت اطلاعات (کارمند)</NavLink>}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-left rtl:text-right">
                  <p className="text-xs font-bold leading-none">{user.displayName}</p>
                  <button onClick={logout} className="text-[10px] text-stone-400 hover:text-red-500 transition-colors uppercase tracking-wider font-bold">خروج</button>
                </div>
                <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-10 h-10 rounded-full border border-stone-300" />
              </div>
            ) : (
              <button 
                onClick={login}
                className="flex items-center gap-2 px-5 py-2 bg-stone-900 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-brand-primary transition-all active:scale-95 shadow-sm"
              >
                <LogIn className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
                <span>ورود کارمند</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#FDFCFB] flex flex-col">
          <AnimatePresence>
            {!isOnline && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-amber-50 border-b border-amber-200 text-amber-800 text-[11px] font-bold py-3 px-8 flex items-center justify-between z-40 shrink-0 select-none flex-row-reverse"
              >
                <div className="flex items-center gap-2 flex-row-reverse">
                  <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-right">حالت آفلاین فعال است. اطلاعات قبرها و نقشه آرامستان در برابر ضعف آنتن‌دهی در محل به طور خودکار از کش بارگذاری می‌شوند.</span>
                </div>
                <span className="text-[8px] font-mono uppercase bg-amber-100/80 text-amber-900 border border-amber-200 px-2 py-0.5 rounded shrink-0">Offline Local</span>
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

        <footer className="h-12 border-t border-stone-200 bg-white flex items-center justify-between px-8 text-[10px] text-stone-400 shrink-0 uppercase tracking-tighter z-40">
          <div className="flex gap-6">
            <span>آمار کل: ۱۲۴,۵۹۱ مورد ثبت شده</span>
            <span>وضعیت سامانه: عملیاتی</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></span>
              موتور هوش مصنوعی فعال است
            </span>
            <span className="text-stone-300">|</span>
            <span>نسخه ۲.۱.۰</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

function NavLink({ to, children }: { to: string, children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={cn(
        "py-5 transition-all text-sm tracking-widest font-bold",
        isActive ? "text-brand-primary border-b-2 border-brand-primary" : "text-stone-400 hover:text-stone-800"
      )}
    >
      {children}
    </Link>
  );
}
