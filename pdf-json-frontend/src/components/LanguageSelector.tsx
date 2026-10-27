import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { LanguageCode } from '../i18n/translations.js';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { language, setLanguage, languages, currentLanguageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left z-30" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 text-slate-200 hover:text-white hover:border-slate-500 transition shadow-sm text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 whitespace-nowrap flex-shrink-0"
        title="Select Language / Seleccionar idioma / Sprache wählen"
        aria-label="Language selector"
      >
        <Globe className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
        {!compact ? (
          <span className="font-semibold">{currentLanguageOption.nativeName}</span>
        ) : (
          <span className="font-mono uppercase font-bold text-[11px]">{currentLanguageOption.code}</span>
        )}
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl glass-card border border-slate-700 dark:border-slate-700 light:border-slate-200 bg-slate-900/98 dark:bg-slate-900/98 light:bg-white backdrop-blur-xl z-[100] py-1.5 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/10">
          <div className="px-3 py-1.5 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center space-x-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            <Globe className="w-3 h-3 text-brand-400" />
            <span>Select Language</span>
          </div>

          <div className="py-1">
            {languages.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                    isSelected
                      ? 'bg-brand-500/15 text-brand-400 font-semibold'
                      : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-800/60 dark:hover:bg-slate-800/60 light:hover:bg-slate-100 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-7 text-center font-mono uppercase font-bold text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.code}
                    </span>
                    <div className="flex flex-col">
                      <span className="leading-tight">{item.nativeName}</span>
                      <span className="text-[10px] text-slate-400">{item.label}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
