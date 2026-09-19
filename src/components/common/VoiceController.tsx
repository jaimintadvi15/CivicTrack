import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, X, Play } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  speakWelcomeGreeting,
  stopWelcomeGreeting,
  isVoiceSpeaking,
  isVoiceMuted,
  setVoiceMuted,
  initAutoWelcomeGreeting,
  getWelcomeText,
} from '../../utils/voiceGreeting';
import { createRipple } from './MaterialRipple';

interface VoiceControllerProps {
  compact?: boolean;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({ compact = false }) => {
  const { language } = useApp();
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(isVoiceMuted());
  const [showToast, setShowToast] = useState<boolean>(false);

  useEffect(() => {
    // Check if voice is speaking periodically or on state change
    const interval = setInterval(() => {
      setSpeaking(isVoiceSpeaking());
    }, 300);

    return () => clearInterval(interval);
  }, []);

  // Initialize auto-welcome on mount
  useEffect(() => {
    initAutoWelcomeGreeting(language, (isSpeakingNow) => {
      setSpeaking(isSpeakingNow);
      if (isSpeakingNow) {
        setShowToast(true);
      }
    });
  }, [language]);

  const handleToggleVoice = async (e: React.MouseEvent) => {
    createRipple(e, 'rgba(66, 133, 244, 0.25)');

    if (speaking) {
      stopWelcomeGreeting();
      setSpeaking(false);
      setShowToast(false);
    } else {
      setMuted(false);
      setVoiceMuted(false);
      setShowToast(true);
      setSpeaking(true);

      await speakWelcomeGreeting({
        lang: language,
        force: true, // User manually tapped button
        onStart: () => setSpeaking(true),
        onEnd: () => {
          setSpeaking(false);
          setTimeout(() => setShowToast(false), 2000);
        },
        onError: () => {
          setSpeaking(false);
          setShowToast(false);
        },
      });
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMutedState = !muted;
    setMuted(newMutedState);
    setVoiceMuted(newMutedState);
    if (newMutedState) {
      stopWelcomeGreeting();
      setSpeaking(false);
      setShowToast(false);
    }
  };

  return (
    <>
      {/* 1. Header Voice Action Pill Button */}
      <div className="relative flex items-center">
        <button
          onClick={handleToggleVoice}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ripple-surface ${
            speaking
              ? 'bg-[#E8F0FE] text-[#1A73E8] border-[#AECBFA] shadow-xs animate-pulse ring-2 ring-[#4285F4]/30'
              : muted
              ? 'bg-[#F1F3F4] text-[#70757A] border-[#DADCE0] hover:bg-[#E8EAED]'
              : 'bg-[#F8F9FA] hover:bg-[#E8F0FE] text-[#3C4043] hover:text-[#1A73E8] border-[#DADCE0] hover:border-[#AECBFA]'
          }`}
          title={
            speaking
              ? 'Voice greeting playing... Click to stop.'
              : 'Listen to Urban Fix voice greeting'
          }
          aria-label="Voice greeting toggle"
        >
          {speaking ? (
            <>
              {/* Animated Equalizer Sound Bars */}
              <div className="flex items-center space-x-0.5 h-3.5 px-0.5" aria-hidden="true">
                <span className="w-0.5 bg-[#1A73E8] rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
                <span className="w-0.5 bg-[#1A73E8] rounded-full animate-[bounce_0.6s_infinite_300ms] h-3.5" />
                <span className="w-0.5 bg-[#1A73E8] rounded-full animate-[bounce_0.6s_infinite_200ms] h-2.5" />
              </div>
              <span className="hidden sm:inline font-semibold">Welcome Voice</span>
            </>
          ) : (
            <>
              {muted ? (
                <VolumeX className="w-3.5 h-3.5 text-[#70757A]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#1A73E8]" />
              )}
              {!compact && <span className="hidden sm:inline">Voice Greeting</span>}
            </>
          )}
        </button>

        {/* Mute toggle button */}
        {!speaking && (
          <button
            onClick={handleToggleMute}
            className="ml-1 p-1 text-[#70757A] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors"
            title={muted ? 'Unmute automatic greetings' : 'Mute automatic greetings'}
            aria-label="Mute voice greeting"
          >
            {muted ? (
              <span className="text-[10px] font-bold text-[#EA4335] bg-[#FCE8E6] px-1 rounded">MUTED</span>
            ) : null}
          </button>
        )}
      </div>

      {/* 2. Floating Audio Toast Banner when Voice is Active */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-white border border-[#34A853]/40 rounded-2xl shadow-elevation-3 p-4 flex items-start space-x-3.5 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A73E8] to-[#34A853] flex items-center justify-center shrink-0 text-white shadow-xs">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#34A853] flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34A853] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34A853]"></span>
                </span>
                Voice Announcement
              </span>
              <button
                onClick={() => {
                  stopWelcomeGreeting();
                  setSpeaking(false);
                  setShowToast(false);
                }}
                className="text-[#5F6368] hover:text-[#202124] p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-medium text-[#202124] mt-1 leading-relaxed italic">
              "{getWelcomeText(language)}"
            </p>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#5F6368]">
              <div className="flex items-center space-x-1">
                <Volume2 className="w-3.5 h-3.5 text-[#1A73E8] animate-pulse" />
                <span className="font-semibold text-[#1A73E8]">Urban Fix HD Voice</span>
              </div>
              <button
                onClick={handleToggleVoice}
                className="text-[#1A73E8] hover:underline font-bold"
              >
                {speaking ? 'Stop Voice' : 'Replay Voice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
