import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AIChat } from './AIChat';
import {
  Bot,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Shield,
  Activity,
} from 'lucide-react';

interface CivicTrackAIProps {
  onSelectTicket?: (ticketNumber: string) => void;
  initialQuery?: string;
  activeTicketNumber?: string;
  isOpenControlled?: boolean;
  onToggleOpen?: (open: boolean) => void;
}

export const CivicTrackAI: React.FC<CivicTrackAIProps> = ({
  onSelectTicket,
  initialQuery,
  activeTicketNumber,
  isOpenControlled,
  onToggleOpen,
}) => {
  const { role, session } = useApp();
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;

  const setIsOpen = (next: boolean) => {
    if (onToggleOpen) {
      onToggleOpen(next);
    } else {
      setInternalIsOpen(next);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // When initialQuery is provided from outside, auto-open the panel
  useEffect(() => {
    if (initialQuery) {
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [initialQuery]);

  return (
    <>
      {/* 1. Floating Circular Trigger Button (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 animate-fade-in group">
          {/* Subtle pulse ambient ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#4285F4] to-[#34A853] opacity-40 blur-xs group-hover:opacity-75 transition duration-300 animate-pulse" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#1A73E8] to-[#4285F4] text-white shadow-elevation-4 hover:shadow-elevation-8 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white focus:outline-none focus:ring-4 focus:ring-[#4285F4]/30"
            aria-label="Open CivicTrack AI Assistant"
            title="Chat with CivicTrack AI"
          >
            <Bot className="w-7 h-7 animate-bounce-subtle" />

            {/* Online Green Indicator Dot */}
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#34A853] border-2 border-white rounded-full shadow-xs" />

            {/* Tooltip on hover */}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#202124] text-white text-xs font-medium rounded-lg shadow-elevation-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none hidden sm:block">
              CivicTrack AI • Smart Municipal Assistant
            </span>
          </button>
        </div>
      )}

      {/* 2. Floating AI Assistant Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-white shadow-elevation-8 border border-[#DADCE0] overflow-hidden ${
            // Mobile full screen vs desktop floating box
            'inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[420px] sm:rounded-2xl ' +
            (isMinimized ? 'sm:h-14 h-14' : 'sm:h-[640px] sm:max-h-[85vh] h-full')
          }`}
          role="dialog"
          aria-labelledby="civictrack-ai-title"
          aria-modal="true"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A73E8] to-[#4285F4] text-white px-4 py-3 sm:py-3.5 flex items-center justify-between shrink-0 shadow-xs select-none">
            <div className="flex items-center space-x-2.5 min-w-0">
              {/* Bot Icon with active badge */}
              <div className="relative w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#34A853] border border-white rounded-full" />
              </div>

              {/* Title & Subtitle */}
              <div className="min-w-0 pr-2">
                <div className="flex items-center space-x-1.5">
                  <h2 id="civictrack-ai-title" className="font-bold text-sm text-white truncate">
                    CivicTrack AI
                  </h2>
                  <span className="text-[10px] bg-white/20 text-white font-mono px-1.5 py-0.2 rounded border border-white/25 shrink-0">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-white/80 truncate">
                  Your smart civic assistance agent
                </p>
              </div>
            </div>

            {/* Controls (Minimize, Close) */}
            <div className="flex items-center space-x-1 shrink-0">
              {/* Role badge */}
              <span className="hidden sm:inline-block text-[10px] bg-black/20 text-white font-medium px-2 py-0.5 rounded capitalize">
                {role}
              </span>

              {/* Minimize button (desktop) */}
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
                title={isMinimized ? 'Expand panel' : 'Minimize panel'}
                aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Close AI Assistant"
                aria-label="Close AI Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Body (hidden if minimized) */}
          {!isMinimized && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <AIChat
                onSelectTicket={(t) => {
                  onSelectTicket?.(t);
                  // On mobile, keep chat accessible or close if desired
                }}
                initialQuery={initialQuery}
                activeTicketNumber={activeTicketNumber}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CivicTrackAI;
