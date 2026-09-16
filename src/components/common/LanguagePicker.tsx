import React from 'react';
import { useApp } from '../../context/AppContext';
import { languageList } from '../../i18n/translations';
import { createRipple } from './MaterialRipple';
import { Globe, Check, X } from 'lucide-react';

interface LanguagePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded shadow-elevation-8 w-full max-w-sm overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-[#4285F4] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center border border-white/30">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white tracking-wide">Select Language / भाषा चुनें</h3>
              <p className="text-xs text-white/80">Choose your preferred Indian language</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              createRipple(e);
              onClose();
            }}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors ripple-surface"
            aria-label="Close language selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="google-accent-bar" />

        {/* List of Languages */}
        <div className="p-4 grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
          {languageList.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                onClick={(e) => {
                  createRipple(e);
                  setLanguage(item.code);
                  onClose();
                }}
                className={`flex items-center justify-between px-4 py-3 rounded border text-left transition-all min-h-[52px] ripple-surface ${
                  isSelected
                    ? 'border-[#4285F4] bg-[#E8F0FE] text-[#1A73E8] font-medium ring-1 ring-[#4285F4] shadow-elevation-1'
                    : 'border-[#DADCE0] hover:border-gray-400 hover:bg-gray-50 text-[#202124] font-normal'
                }`}
                aria-label={`Select ${item.name}`}
              >
                <div>
                  <span className="text-base font-medium block">{item.nativeName}</span>
                  <span className="text-xs text-[#5F6368]">{item.name}</span>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#4285F4] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F8F9FA] border-t border-[#DADCE0] text-center">
          <p className="text-[11px] text-[#5F6368]">
            Voice-to-text and UI labels automatically adapt to your chosen language.
          </p>
        </div>
      </div>
    </div>
  );
};
