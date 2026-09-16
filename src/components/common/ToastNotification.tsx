import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, X, CheckCircle2, Award } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        const isXP = toast.type === 'xp';
        const isBadge = toast.type === 'badge';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start space-x-3 p-3.5 rounded shadow-elevation-4 border border-[#3c4043] bg-[#202124] text-white transform transition-all duration-300 animate-in slide-in-from-bottom-5"
            role="alert"
          >
            {/* Icon */}
            <div
              className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                isXP
                  ? 'bg-[#FBBC05] text-[#202124] font-black'
                  : isBadge
                  ? 'bg-[#34A853] text-white font-black'
                  : 'bg-[#4285F4] text-white'
              }`}
            >
              {isXP ? (
                <Sparkles className="w-4 h-4 fill-[#202124] stroke-[2.5]" />
              ) : isBadge ? (
                <Award className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-medium text-white leading-tight truncate">{toast.title}</h4>
                {toast.xp && (
                  <span className="bg-[#FBBC05] text-[#202124] font-bold text-[10px] px-1.5 py-0.2 rounded">
                    +{toast.xp} XP
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-300 mt-0.5 line-clamp-2 leading-relaxed">
                {toast.message}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
