import { motion } from 'motion/react';
import { Star, ShieldAlert, BadgeInfo, CheckCircle2, XCircle } from 'lucide-react';
import { HostingProvider } from '../types';

interface HostingCardProps {
  provider: HostingProvider;
  index: number;
}

export default function HostingCard({ provider, index }: HostingCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (score >= 65) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-rose-500 bg-rose-50 border-rose-100';
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 65) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <motion.div
      id={`hosting-card-${provider.name.toLowerCase().replace(/\s+/g, '-')}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)' }}
      className="bg-white border border-gray-100 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
    >
      {/* Decorative top border representing compatibility color */}
      <div 
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          provider.suitability_score >= 85 ? 'bg-emerald-500' : provider.suitability_score >= 65 ? 'bg-amber-500' : 'bg-rose-500'
        }`}
      />

      <div className="space-y-4">
        {/* Title and Rating Info */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-1.5 font-sans">
              {provider.name}
            </h3>
            <span className="inline-block px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-medium mt-1 uppercase tracking-wider font-mono">
              {provider.type}
            </span>
          </div>

          {/* Compatibility Score Circle */}
          <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl border ${getScoreColor(provider.suitability_score)}`}>
            <span className="text-2xl font-bold font-mono tracking-tight">{provider.suitability_score}%</span>
            <span className="text-[10px] font-medium font-sans">تطابق</span>
          </div>
        </div>

        {/* Free Tier Limit Section */}
        <div className="bg-gray-50/70 border border-gray-100/50 rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-medium text-gray-400 block tracking-wider">سقف پلن رایگان (Free Limits)</span>
          <span className="text-xs font-semibold text-gray-700 font-mono block text-left" dir="ltr">
            {provider.free_tier_limits}
          </span>
        </div>

        {/* Suitability explanation */}
        <p className="text-xs text-gray-600 leading-relaxed text-right font-sans pt-1 border-t border-gray-100">
          {provider.match_explanation_fa}
        </p>

        {/* Pros & Cons list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Pros */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مزایا</span>
            </span>
            <ul className="space-y-1">
              {provider.pros_fa.map((pro, i) => (
                <li key={i} className="text-xs text-gray-500 flex items-start gap-1 leading-normal">
                  <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-gray-400" />
              <span>معایب و محدودیت‌ها</span>
            </span>
            <ul className="space-y-1">
              {provider.cons_fa.map((con, i) => (
                <li key={i} className="text-xs text-gray-500 flex items-start gap-1 leading-normal">
                  <span className="text-gray-300 shrink-0 mt-0.5">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div className="mt-5 pt-3 border-t border-gray-100">
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full ${getScoreProgressColor(provider.suitability_score)}`} 
            style={{ width: `${provider.suitability_score}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
