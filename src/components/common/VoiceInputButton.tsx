import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  buttonText?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
  buttonText,
}) => {
  const { language, t } = useApp();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(1);

  // Map language codes to Web Speech API locales
  const langLocaleMap: Record<string, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    bn: 'bn-IN',
    kn: 'kn-IN',
  };

  // Simulated transcription samples for various languages
  const fallbackTranscriptions: Record<string, string[]> = {
    en: [
      'Huge pothole near 100 feet road bus stop causing traffic jams and vehicle accidents.',
      'Garbage bin overflowing with rotten waste attracting dogs and mosquitoes.',
      'Street light pole is completely broken and dark for three days near park gate.',
      'Water pipeline has ruptured with continuous heavy leakage on the road.',
      'Storm drain cover is broken and open, very dangerous for children walking to school.',
    ],
    hi: [
      'बस स्टैंड के पास सड़क पर बहुत बड़ा गड्ढा है जिससे गाड़ियां फिसल रही हैं।',
      'पार्क के कोने में कचरे का ढेर लगा है, बदबू आ रही है और मक्खियां बढ़ गई हैं।',
      'गली की तीन स्ट्रीट लाइटें पिछले चार दिनों से बंद पड़ी हैं, अंधेरा रहता है।',
      'मुख्य पाइपलाइन से पानी का बहुत तेज रिसाव हो रहा है और सड़क भर गई है।',
      'स्कूल के पास नाले का ढक्कन टूटा हुआ है, किसी के गिरने का खतरा है।',
    ],
    mr: [
      'रस्त्यावर मोठा खड्डा पडला असून वाहने घसरून अपघात होत आहेत.',
      'कचऱ्याची कुंडी भरून वाहत आहे, दुर्गंधी सुटली आहे.',
      'पथदिवे बंद असल्यामुळे संध्याकाळी खूप अंधार पडतो.',
      'पिण्याच्या पाण्याची पाईपलाईन फुटल्याने पाणी वाया जात आहे.',
    ],
    ta: [
      'சாலையில் பெரிய பள்ளம் உள்ளதால் வாகனங்கள் விபத்துக்குள்ளாகின்றன.',
      'குப்பைத் தொட்டி நிரம்பி வழிகிறது, துர்நாற்றம் வீசுகிறது.',
      'தெருவிளக்கு எரியாததால் இரவில் இருட்டாக உள்ளது.',
    ],
    te: [
      'రోడ్డుపై పెద్ద గుంత ఏర్పడి ప్రమాదాలు జరుగుతున్నాయి.',
      'చెత్త కుండీ నిండిపోయి దుర్గంధం వస్తోంది.',
      'స్ట్రీట్ లైట్లు వెలగకపోవడం వల్ల చీకటిగా ఉంది.',
    ],
    bn: [
      'রাস্তার মাঝে বড় গর্ত হয়ে গাড়ি চলাচলে সমস্যা হচ্ছে।',
      'আবর্জনার স্তূপ জমে দুর্গন্ধ ছড়াচ্ছে।',
    ],
    kn: [
      'ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಬಿದ್ದಿದ್ದು ಅಪಘಾತಗಳು ಸಂಭವಿಸುತ್ತಿವೆ.',
      'ಕಸದ ತೊಟ್ಟಿ ತುಂಬಿ ತುಳುಕುತ್ತಿದ್ದು ದುರ್ವಾಸನೆ ಬರುತ್ತಿದೆ.',
    ],
  };

  // Pulse wave animation during recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 4) + 1);
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);

    // Try native Web Speech API if supported
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = langLocaleMap[language] || 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: { results: { [x: string]: { [x: string]: { transcript: string } } } }) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            onTranscript(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          // fallback to simulated recognition if speech API fails or permissions denied
          simulateVoiceInput();
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        return;
      } catch {
        simulateVoiceInput();
      }
    } else {
      simulateVoiceInput();
    }
  };

  const simulateVoiceInput = () => {
    setTimeout(() => {
      const list = fallbackTranscriptions[language] || fallbackTranscriptions['en'];
      const randomText = list[Math.floor(Math.random() * list.length)];
      onTranscript(randomText);
      setIsListening(false);
    }, 2200);
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded border font-medium text-xs transition-all min-h-touch ripple-surface ${
        isListening
          ? 'bg-[#EA4335] text-white border-[#D93025] ring-4 ring-[#EA4335]/30 animate-pulse'
          : 'bg-[#E8F0FE] text-[#1A73E8] border-[#DADCE0] hover:bg-[#D2E3FC] hover:border-[#1A73E8]'
      } ${className}`}
      aria-label={isListening ? t.stopVoice : t.recordVoice}
      aria-pressed={isListening}
    >
      {isListening ? (
        <>
          <div className="flex items-center space-x-1">
            <MicOff className="w-4 h-4 text-white" />
            <span className="flex space-x-0.5 items-center px-1">
              {[1, 2, 3, 4].map((bar) => (
                <span
                  key={bar}
                  className="w-1 bg-white rounded-full transition-all duration-150"
                  style={{ height: `${(audioLevel >= bar ? bar * 4 : 4) + 4}px` }}
                />
              ))}
            </span>
          </div>
          <span>{t.listening}</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 text-[#1A73E8]" />
          <span>{buttonText || t.recordVoice}</span>
          <Volume2 className="w-3.5 h-3.5 text-[#4285F4] opacity-80" />
        </>
      )}
    </button>
  );
};
