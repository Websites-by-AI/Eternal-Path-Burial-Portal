import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, FileCode, CheckCircle } from 'lucide-react';
import { ConfigFile } from '../types';

interface CodeConfigViewerProps {
  configs: ConfigFile[];
}

export default function CodeConfigViewer({ configs }: CodeConfigViewerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for iframe restrictions
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  if (!configs || configs.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-xl font-sans">
        هیچ فایل تنظیماتی تولید نشده است. فرآیند بهینه‌سازی را مجدداً اجرا کنید.
      </div>
    );
  }

  const currentConfig = configs[activeTab];

  return (
    <div id="code-config-viewer" className="space-y-4 font-sans text-right" dir="rtl">
      {/* File Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-gray-100 scroller-thin">
        {configs.map((config, index) => (
          <button
            key={index}
            onClick={() => {
              setActiveTab(index);
              setCopied(false);
            }}
            className={`px-3 py-1.5 text-xs rounded-lg font-mono transition-all duration-200 shrink-0 border ${
              activeTab === index
                ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
            }`}
          >
            {config.filename}
          </button>
        ))}
      </div>

      {/* Description and location info */}
      <div className="bg-indigo-50/50 border border-indigo-100/50 p-4 rounded-xl flex items-start gap-3">
        <div className="p-1 px-2 bg-indigo-100 text-indigo-700 rounded-md font-mono text-[10px] font-bold mt-0.5 uppercase">
          LOC
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-indigo-900 block">راهنمای استقرار فایل:</span>
          <p className="text-xs text-indigo-700 leading-normal">
            {currentConfig.description_fa}
          </p>
        </div>
      </div>

      {/* Editor Frame */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
        {/* Editor Top Bar */}
        <div className="bg-gray-950 px-4 py-2 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-gray-500 font-mono ml-2">{currentConfig.filename}</span>
          </div>

          <button
            onClick={() => handleCopy(currentConfig.content)}
            className={`flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 active:bg-white/20 text-gray-300 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              copied ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'border border-transparent'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>کپی کردن کد</span>
              </>
            )}
          </button>
        </div>

        {/* Code Block Wrapper */}
        <div className="p-5 font-mono text-[11px] md:text-xs leading-relaxed overflow-x-auto text-left" dir="ltr">
          <pre className="text-blue-300">
            <code>{currentConfig.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
