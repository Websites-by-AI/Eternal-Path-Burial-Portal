// Preloaded/Fallback dataset of graves in Zanjan, Iran for high-fidelity testing
// Centered around Zanjan Behesht-e Zahra Cemetery coordinates: ~36.6585, 48.4918

export interface Grave {
  id: string;
  fullName: string;
  fatherName: string;
  birthDate: string;
  deathDate: string;
  inscription: string;
  location: { lat: number; lng: number };
  photoUrl: string;
  block: string;
  row: string;
  number: string;
  createdAt?: any;
}

export const fallbackZanjanGraves: Grave[] = [
  {
    id: "zanjan-grave-monzavi",
    fullName: "حسین منزوی (سلطان غزل معاصر)",
    fatherName: "محمد",
    birthDate: "۱۳۲۵",
    deathDate: "۱۳۸۳",
    inscription: "نام من عشق است آیا می‌شناسیدم؟ زخمی‌ام زخمی سراپا می‌شناسیدم؟ غزل‌سرای بی‌تکرار ادبیات معاصر ایران",
    location: { lat: 36.6582, lng: 48.4912 },
    photoUrl: "https://images.unsplash.com/photo-1544436070-079730594aa1?auto=format&fit=crop&q=80&w=400",
    block: "قطعه مشاهیر و هنرمندان",
    row: "ردیف ۱",
    number: "مزار ۵"
  },
  {
    id: "zanjan-grave-amid",
    fullName: "آیت‌الله عباسعلی عمید زنجانی",
    fatherName: "عباسعلی",
    birthDate: "۱۳۱۶",
    deathDate: "۱۳۹۰",
    inscription: "استاد برجسته حقوق اسلامی، رئیس اسبق دانشگاه تهران و چهره برتر علمی و فقهی زنجان",
    location: { lat: 36.6589, lng: 48.4925 },
    photoUrl: "https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&q=80&w=400",
    block: "بخش علماء و فرزانگان",
    row: "ردیف ۳",
    number: "مزار ۱"
  },
  {
    id: "zanjan-grave-mosavi",
    fullName: "آیت‌الله سید عزالدین حسینی زنجانی",
    fatherName: "میرزا محمود",
    birthDate: "۱۲۹۹",
    deathDate: "۱۳۹۲",
    inscription: "از مراجع عظام تقلید و مفسران گرانقدر قرآن کریم، از مفاخر علمی و معنوی جهان اسلام",
    location: { lat: 36.6587, lng: 48.4919 },
    photoUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400",
    block: "بخش فرزانگان قدیم",
    row: "ردیف ۱",
    number: "مزار ۲"
  },
  {
    id: "zanjan-grave-mesgar",
    fullName: "استاد حبیب‌الله مس‌گر زنجانی",
    fatherName: "عباس",
    birthDate: "۱۳۰۸",
    deathDate: "۱۳۹۵",
    inscription: "پدر صنعت مسگری زنجان، احیاکننده و معتمد کهن بازار تاریخی بزرگ زنجان",
    location: { lat: 36.6575, lng: 48.4905 },
    photoUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400",
    block: "قطعه ۴ عمومی",
    row: "ردیف ۸",
    number: "مزار ۱۲"
  },
  {
    id: "zanjan-grave-malileh",
    fullName: "استاد جمیله محمدی (بانوی ملیله‌کار)",
    fatherName: "علیرضا",
    birthDate: "۱۳۲۰",
    deathDate: "۱۳۹۹",
    inscription: "مادر صنایع دستی و احیاگر هنر ملیله‌کاری نقره در استان زنجان",
    location: { lat: 36.6595, lng: 48.4930 },
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
    block: "قطعه ۹ هنرمندان",
    row: "ردیف ۲",
    number: "مزار ۱۴"
  },
  {
    id: "zanjan-grave-maghfoor",
    fullName: "حاج مغفور زنجانی (مداح شهیر)",
    fatherName: "رحیم",
    birthDate: "۱۳۰۲",
    deathDate: "۱۳۷۸",
    inscription: "پیرغلام بااخلاص آستان اباعبدالله الحسین و ثناخوان نام‌آشنای حسینیه اعظم زنجان",
    location: { lat: 36.6580, lng: 48.4901 },
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    block: "قطعه ۱ قدیم",
    row: "ردیف ۱۵",
    number: "مزار ۶"
  }
];
