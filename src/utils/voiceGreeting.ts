/**
 * Professional Voice Greeting System for Urban Fix.
 * Combines Web Audio API for a soft corporate intro chime with Web Speech API for high-fidelity speech synthesis.
 */

interface SpeakOptions {
  lang?: string;
  customText?: string;
  force?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

// Memory & Session storage key to avoid repeated auto-greetings on soft navigations
const GREETING_SESSION_KEY = 'urbanfix_welcome_voice_played_v1';
const GREETING_MUTED_KEY = 'urbanfix_voice_muted';

let currentUtterance: SpeechSynthesisUtterance | null = null;
let isSpeakingState = false;

/**
 * Plays a warm, subtle 2-note corporate chime (Web Audio API)
 */
export const playWelcomeChime = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        resolve();
        return;
      }

      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Soft dual-tone chord: E5 (659.25Hz) -> A5 (880Hz)
      const notes = [659.25, 880.0];
      const duration = 0.45;

      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        // Gentle volume curve
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });

      setTimeout(() => {
        ctx.close().catch(() => {});
        resolve();
      }, (duration + 0.2) * 1000);
    } catch {
      resolve();
    }
  });
};

/**
 * Gets localized welcome greeting text
 */
export const getWelcomeText = (lang: string = 'en'): string => {
  switch (lang) {
    case 'hi':
      return 'अर्बन फिक्स में आपका स्वागत है। स्वच्छ और सुंदर शहर के लिए आपका मंच।';
    case 'kn':
      return 'ಅರ್ಬನ್ ಫಿಕ್ಸ್ ಗೆ ಸುಸ್ವಾಗತ. ನಿಮ್ಮ ಸ್ವಚ್ಛ ಹಾಗೂ ಸುಂದರ ನಗರಕ್ಕಾಗಿ.';
    case 'mr':
      return 'अर्बन फिक्स मध्ये आपले स्वागत आहे. स्वच्छ आणि सुंदर शहरासाठी.';
    case 'ta':
      return 'அர்பன் பிக்ஸ்-க்கு நல்வரவு. தூய்மையான நகரத்திற்கான உங்கள் தளம்.';
    case 'te':
      return 'అర్బన్ ఫిక్స్ కు స్వాగతం. మీ పరిశుభ్రమైన నగరం కోసం.';
    case 'bn':
      return 'আরবান ফিক্সে আপনাকে স্বাগতম। পরিচ্ছন্ন শহরের জন্য আপনার প্ল্যাটফর্ম।';
    case 'en':
    default:
      return 'Welcome to Urban Fix! Empowering cleaner, smarter, and safer cities.';
  }
};

/**
 * Selects the best available natural/professional voice from browser TTS
 */
const selectBestVoice = (lang: string = 'en'): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const langCode = lang.toLowerCase();
  
  // Map app lang to RFC 5646 codes
  const targetPrefixes: Record<string, string[]> = {
    en: ['en-US', 'en-GB', 'en-IN', 'en-AU', 'en'],
    hi: ['hi-IN', 'hi'],
    kn: ['kn-IN', 'kn'],
    mr: ['mr-IN', 'mr'],
    ta: ['ta-IN', 'ta'],
    te: ['te-IN', 'te'],
    bn: ['bn-IN', 'bn-BD', 'bn'],
  };

  const prefixes = targetPrefixes[langCode] || ['en-US', 'en'];

  // Priority 1: High quality / Natural / Google / Microsoft / Samantha / Neural voice matching language
  const qualityKeywords = ['natural', 'online', 'neural', 'google', 'samantha', 'karen', 'aria', 'jenny', 'guy', 'enhanced', 'premium'];

  for (const prefix of prefixes) {
    const matchingLangVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix.toLowerCase()));
    if (matchingLangVoices.length > 0) {
      // Find one with quality keywords
      const best = matchingLangVoices.find((v) =>
        qualityKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      );
      if (best) return best;
      return matchingLangVoices[0];
    }
  }

  // Fallback: any English natural voice or first available
  const englishNatural = voices.find((v) =>
    v.lang.toLowerCase().startsWith('en') && qualityKeywords.some((kw) => v.name.toLowerCase().includes(kw))
  );
  if (englishNatural) return englishNatural;

  return voices.find((v) => v.lang.toLowerCase().startsWith('en')) || voices[0] || null;
};

/**
 * Stops any active welcome voice speech
 */
export const stopWelcomeGreeting = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isSpeakingState = false;
  currentUtterance = null;
};

/**
 * Returns true if speech synthesis is currently active
 */
export const isVoiceSpeaking = (): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking || isSpeakingState;
};

/**
 * Checks whether user muted voice greetings
 */
export const isVoiceMuted = (): boolean => {
  try {
    return localStorage.getItem(GREETING_MUTED_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Toggles voice mute state
 */
export const setVoiceMuted = (muted: boolean): void => {
  try {
    localStorage.setItem(GREETING_MUTED_KEY, String(muted));
    if (muted) {
      stopWelcomeGreeting();
    }
  } catch (err) {
    console.warn('Failed to save voice mute preference:', err);
  }
};

/**
 * Main function: Speaks the professional "Welcome to Urban Fix" greeting
 */
export const speakWelcomeGreeting = async (options: SpeakOptions = {}): Promise<boolean> => {
  const { lang = 'en', customText, force = false, onStart, onEnd, onError } = options;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.('Speech synthesis not supported');
    return false;
  }

  // Check mute preference unless force trigger
  if (!force && isVoiceMuted()) {
    return false;
  }

  // Avoid playing multiple times automatically per session unless forced
  if (!force && sessionStorage.getItem(GREETING_SESSION_KEY) === 'true') {
    return false;
  }

  stopWelcomeGreeting();

  const messageText = customText || getWelcomeText(lang);

  // Play corporate intro chime first
  await playWelcomeChime();

  return new Promise((resolve) => {
    const doSpeak = () => {
      try {
        const utterance = new SpeechSynthesisUtterance(messageText);
        
        // Professional voice settings
        utterance.rate = 0.94; // Clear, deliberate speed
        utterance.pitch = 1.0; // Warm natural pitch
        utterance.volume = 0.98;

        const bestVoice = selectBestVoice(lang);
        if (bestVoice) {
          utterance.voice = bestVoice;
          utterance.lang = bestVoice.lang;
        }

        utterance.onstart = () => {
          isSpeakingState = true;
          sessionStorage.setItem(GREETING_SESSION_KEY, 'true');
          onStart?.();
        };

        utterance.onend = () => {
          isSpeakingState = false;
          currentUtterance = null;
          onEnd?.();
          resolve(true);
        };

        utterance.onerror = (evt) => {
          isSpeakingState = false;
          currentUtterance = null;
          onError?.(evt);
          resolve(false);
        };

        currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        isSpeakingState = false;
        onError?.(err);
        resolve(false);
      }
    };

    // Ensure voices are loaded
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      const handleVoicesChanged = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        doSpeak();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      // Timeout fallback if event doesn't fire
      setTimeout(doSpeak, 250);
    } else {
      doSpeak();
    }
  });
};

/**
 * Initializes automatic greeting on initial page load / user interaction
 */
export const initAutoWelcomeGreeting = (lang: string = 'en', onSpeakingChange?: (speaking: boolean) => void) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  if (sessionStorage.getItem(GREETING_SESSION_KEY) === 'true' || isVoiceMuted()) {
    return;
  }

  let attemptDone = false;

  const triggerGreeting = async () => {
    if (attemptDone || sessionStorage.getItem(GREETING_SESSION_KEY) === 'true') return;
    attemptDone = true;

    // Remove interaction listeners once triggered
    document.removeEventListener('click', triggerGreeting);
    document.removeEventListener('touchstart', triggerGreeting);
    document.removeEventListener('keydown', triggerGreeting);

    const success = await speakWelcomeGreeting({
      lang,
      force: false,
      onStart: () => onSpeakingChange?.(true),
      onEnd: () => onSpeakingChange?.(false),
      onError: () => onSpeakingChange?.(false),
    });

    if (!success) {
      onSpeakingChange?.(false);
    }
  };

  // 1. Try immediate speak after short timeout (works if browser allows or user already interacted)
  setTimeout(() => {
    if (!attemptDone) {
      triggerGreeting();
    }
  }, 600);

  // 2. Attach fallback listeners for first user click/touch if auto-play policy blocks silent start
  document.addEventListener('click', triggerGreeting, { once: true });
  document.addEventListener('touchstart', triggerGreeting, { once: true });
  document.addEventListener('keydown', triggerGreeting, { once: true });
};
