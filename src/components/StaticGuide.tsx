import { Cloud, Zap, Cpu, Server, Database, CheckCircle, ExternalLink, RefreshCw, FileText } from 'lucide-react';

export default function StaticGuide() {
  return (
    <div id="static-guide-container" className="space-y-8 text-right font-sans" dir="rtl">
      {/* Header section with design philosophy */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-medium text-gray-900 tracking-tight flex items-center gap-2">
          <Cloud className="w-5 h-5 text-indigo-500" />
          راهنمای مرجع هاست‌های ابری رایگان در سال ۲۰۲۶
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          بررسی جزییات معماری، سخت‌گیرانه‌ترین محدودیت‌ها و الگوهای بهینه‌سازی برای پلتفرم‌های مدرن ابری بدون پرداخت هزینه.
        </p>
      </div>

      {/* Cloudflare Spotlight - Workers vs Pages */}
      <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-100/70 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500 text-white rounded-lg block font-mono font-bold text-xs">CF</span>
            <div>
              <h3 className="text-base font-semibold text-gray-900">تمرکز ویژه: Cloudflare Pages در مقابل Cloudflare Workers</h3>
              <p className="text-xs text-gray-500 mt-0.5">اکوسیستم کلودفلر خارق‌العاده است، اما کدام مدل برای شما مناسب‌تر است؟</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">مقایسه کلیدی</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Cloudflare Pages */}
          <div className="bg-white/90 border border-amber-100 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">کلودفلر پیچ (Cloudflare Pages)</h4>
            </div>
            
            <p className="text-xs text-gray-600 leading-relaxed">
              برای میزبانی وب‌سایت‌های کاملاً استاتیک (Jamstack) یا وب‌اپلیکیشن‌های تک‌صفحه‌ای (React, Vue, SPA) مناسب است. مستقیماً به گیت‌هاب متصل می‌شود و هر بیلد را به صورت توزیع‌شده سرو می‌کند.
            </p>

            <ul className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>محدودیت ترافیک:</strong> نامحدود و رایگان در شبکه CDN کلودفلر</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>محدودیت بیلد:</strong> ۵۰۰ بیلد (Build) موفق در ماه</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>بخش پویا:</strong> امکان ایجاد فولدر <code className="font-mono bg-amber-50 px-1 py-0.5 text-amber-700 text-[10px] rounded">/functions</code> برای کدهای سمت سرور</span>
              </li>
            </ul>
            <div className="text-[11px] bg-orange-50 text-orange-800 p-2.5 rounded-lg border border-orange-100 font-mono">
              <strong>چه زمان استفاده کنیم؟</strong> وقتی یک سایت SPA یا استاتیک سنتی دارید و می‌خواهید بدون دغدغه ترافیک بالا، آن را ابدی بالا نگه دارید.
            </div>
          </div>

          {/* Cloudflare Workers */}
          <div className="bg-white/90 border border-amber-100 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">کلودفلر ورکرز (Cloudflare Workers)</h4>
            </div>
            
            <p className="text-xs text-gray-600 leading-relaxed">
              بر پایه V8 Isolates کار می‌کند که فاقد سیستم‌فایل سنتی (Filesystem) است. کدها مستقیماً در نزدیک‌ترین وب‌سرورهای لبه (Edge) در سراسر دنیا در زمان نزدیک به صفر بارگذاری و اجرا می‌شوند.
            </p>

            <ul className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>سقف رایگان:</strong> ۱۰۰,۰۰۰ درخواست (Requests) در هر روز</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>محدودیت پردازش:</strong> حداکثر ۱۰ میلی‌ثانیه زمان فعال CPU برای هر درخواست</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>زمان اجرا:</strong> بارگذاری لبه بدون تاخیر استارت اولیه (Instant 0ms cold starts)</span>
              </li>
            </ul>
            <div className="text-[11px] bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-100 font-mono">
              <strong>چه زمان استفاده کنیم؟</strong> برای ایجاد APIهای با تاخیر فوق‌العاده کم، وب‌هوک‌ها، کارهای ترانسفارم هدرها و ابزارهای پروکسی و روتینگ.
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Other Free Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Vercel */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-3 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-black text-white rounded-md font-bold text-xs font-mono">▲</div>
              <h4 className="font-medium text-gray-900 text-sm">Vercel</h4>
            </div>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-medium rounded">رایگان مادام‌العمر</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            محبوب‌ترین هاست برای فریم‌ورک‌های مدرن نظیر Next.js، Nuxt، و پروژه‌های React. فوق‌العاده سریع و یکپارچه با گیت‌هاب.
          </p>
          <div className="text-xs space-y-1.5 text-gray-600 bg-gray-50 p-2.5 rounded-lg font-mono text-left" dir="ltr">
            <div>• Free Bandwidth: 100 GB / month</div>
            <div>• Build limit: 45m max execution</div>
            <div>• Serverless Timeout: 10 seconds</div>
          </div>
          <p className="text-[11px] text-gray-400">
            ⚠ توجه: محدود به استفاده غیرتجاری (Hobby Tier) است.
          </p>
        </div>

        {/* Netlify */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-3 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-500 text-white rounded-md font-bold text-xs font-mono">N</div>
              <h4 className="font-medium text-gray-900 text-sm">Netlify</h4>
            </div>
            <span className="px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-medium rounded">پیکربندی ساده</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            انتخاب ایده‌آل دیگری برای سایت‌های استاتیک و Jamstack با مدیریت راحت دامنه، فرم‌های تماس و توابع بک‌اند رایگان.
          </p>
          <div className="text-xs space-y-1.5 text-gray-600 bg-teal-50/50 p-2.5 rounded-lg font-mono text-left" dir="ltr">
            <div>• Bandwidth: 100 GB / month</div>
            <div>• Build Minutes: 300 / month</div>
            <div>• Serverless Limits: 125,000 runs</div>
          </div>
          <p className="text-[11px] text-gray-400">
            ⚠ توجه: بیلد‌های بیش از حد مجاز متوقف خواهند شد.
          </p>
        </div>

        {/* Railway & Render */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-3 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500 text-white rounded-md font-bold text-xs font-mono">R</div>
              <h4 className="font-medium text-gray-900 text-sm">Render / Railway</h4>
            </div>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 text-[10px] font-medium rounded">کانتینر بک‌اند</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            برای وقتی که به سرور سنتی Express، پایتون، جنگو یا بک‌اند Stateful نیاز دارید که در پلتفرم‌های بدون سرور (Serverless) کار نمی‌کنند.
          </p>
          <div className="text-xs space-y-1.5 text-gray-600 bg-indigo-50/50 p-2.5 rounded-lg font-mono text-left" dir="ltr">
            <div>• Render: Webservice, spins down</div>
            <div>• Render Postgres: Free for 90 days</div>
            <div>• Railway: $5 trial credit once</div>
          </div>
          <p className="text-[11px] text-gray-400">
            ⚠ توجه: رندور بعد از ۱۵ دقیقه دوری، می‌خوابد و بیدار شدنش ۵۰ ثانیه طول می‌کشد.
          </p>
        </div>

        {/* Supabase */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-3 hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 text-white rounded-md font-bold text-xs font-mono">S</div>
              <h4 className="font-medium text-gray-900 text-sm">Supabase</h4>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-medium rounded">دیتابیس ابری</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            دیتابیس ابری کامل Postgres با همراهی احراز هویت (Auth)، بخش مدیریت فایل‌ها و توابع لبه سرورلس (Edge Functions).
          </p>
          <div className="text-xs space-y-1.5 text-gray-600 bg-emerald-50/50 p-2.5 rounded-lg font-mono text-left" dir="ltr">
            <div>• Database: 500 MB Postgres</div>
            <div>• Active Projects: 2 free projects</div>
            <div>• Assets Storage: 1 GB free tier</div>
          </div>
          <p className="text-[11px] text-gray-400">
            ⚠ توجه: پروژه‌ها بعد از ۱ هفته عدم فعالیت، موقتاً غیرفعال (Paused) می‌شوند.
          </p>
        </div>
      </div>

      {/* Deployment Golden Rules */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">نقشه طلایی انتخاب هاست برای پروژه‌های جدید:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-1">
            <span className="font-semibold text-indigo-700 block text-xs">۱. فرانت‌اند استاتیک (SPA/HTML)</span>
            <p className="text-gray-500 leading-relaxed">
              انتخاب اول شما باید <strong>Cloudflare Pages</strong> یا <strong>Vercel</strong> باشد. کلودفلر پیجز به خاطر پهنای باند نامحدود نهایی‌ترین انتخاب امن است.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-1">
            <span className="font-semibold text-orange-700 block text-xs">۲. کدهای ترانسفرم یا API نوری</span>
            <p className="text-gray-500 leading-relaxed">
              باید از <strong>Cloudflare Workers</strong> استفاده کنید تا از تاخیر مطلقاً صفر در سراسر زمین و استارت‌های فوق‌العاده سریع لذت ببرید.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-1">
            <span className="font-semibold text-emerald-700 block text-xs">۳. سرور سنگین یا دیتابیس نویسی</span>
            <p className="text-gray-500 leading-relaxed">
              استفاده تلفیقی از فرانت‌اند متصل به CDN ورسل با یک دیتابیس ابری رایگان در <strong>Supabase</strong> و یا زمان‌بندی‌های هویت در <strong>Render</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
