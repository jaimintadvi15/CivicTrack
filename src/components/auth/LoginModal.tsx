import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { createRipple } from '../common/MaterialRipple';
import {
  Smartphone,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  User,
  LayoutDashboard,
  HardHat,
  Globe,
  UserCheck,
  Building2,
} from 'lucide-react';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { CivicHeroLogo } from '../common/CivicHeroLogo';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../lib/firebase';

interface LoginModalProps {
  onOpenLanguage: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onOpenLanguage }) => {
  const { loginWithPhone, completeCitizenOnboarding, t } = useApp();

  // Multi-step auth flow
  const [step, setStep] = useState<'phone' | 'otp' | 'onboarding'>('phone');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [showInviteInput, setShowInviteInput] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Citizen first-time onboarding state
  const [name, setName] = useState<string>('');
  const [ward, setWard] = useState<string>('Ward 4 - Indiranagar');

  const wardOptions = [
    'Ward 4 - Indiranagar',
    'Ward 8 - Koramangala',
    'Ward 12 - HSR Layout',
    'Ward 15 - Whitefield',
    'Ward 2 - Malleshwaram',
    'Ward 6 - Jayanagar',
  ];

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setIsLoading(true);

    const isDemoNumber = ['9876543210', '9876543211', '9876543212'].some((num) => phone.includes(num));

    if (isFirebaseConfigured && auth && !isDemoNumber) {
      try {
        const fullPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
        const confirmation = await signInWithPhoneNumber(auth, fullPhone, verifier);
        setConfirmationResult(confirmation);
        setIsLoading(false);
        setStep('otp');
        return;
      } catch (err: any) {
        console.warn('Firebase Phone Auth notice (falling back to demo OTP):', err);
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 400);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    if (confirmationResult && otp !== '123456') {
      try {
        await confirmationResult.confirm(otp);
      } catch (err: any) {
        console.warn('Firebase Phone Auth confirmation notice:', err);
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      const res = loginWithPhone(phone, otp, inviteCode);
      if (!res.success) {
        setError(res.error || 'Invalid OTP code');
        return;
      }

      if (res.isNewUser) {
        setStep('onboarding');
      }
    }, 400);
  };

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name to complete setup');
      return;
    }
    completeCitizenOnboarding(name.trim(), ward);
  };

  const fillDemoNumber = (demoPhone: string, _targetRole: UserRole) => {
    setPhone(demoPhone);
    setError('');
  };

  const fillDemoOtp = () => {
    setOtp('123456');
    setError('');
  };

  return (
    <div className="flex-1 w-full bg-[#F8F9FA] flex flex-col items-center justify-center p-4 relative">
      {/* Top bar with Branding & Language Switcher */}
      <div className="w-full max-w-md flex justify-between items-center mb-5 px-1">
        <CivicHeroLogo
          variant="horizontal"
          size="sm"
          showTagline={true}
          taglineText="CHANGE YOUR CITY."
        />

        <button
          onClick={(e) => {
            createRipple(e, 'rgba(66, 133, 244, 0.1)');
            onOpenLanguage();
          }}
          className="flex items-center space-x-1.5 bg-white text-[#202124] px-3 py-1.5 rounded border border-[#DADCE0] text-xs font-medium shadow-elevation-1 hover:bg-[#F8F9FA] transition-colors ripple-surface"
        >
          <Globe className="w-3.5 h-3.5 text-[#4285F4]" />
          <span>Language</span>
        </button>
      </div>

      {/* Main Material Authentication Card */}
      <div className="w-full max-w-md bg-white border border-[#DADCE0] rounded shadow-elevation-8 p-6 sm:p-8 text-[#202124] relative overflow-hidden">
        <div className="google-accent-bar" />
        <div id="recaptcha-container" />
        
        {/* STEP 1: PHONE NUMBER */}
        {step === 'phone' && (
          <div className="pt-2">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-[#E8F0FE] text-[#1A73E8] mb-3">
                <Smartphone className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-[#202124]">
                {t.loginTitle || 'Sign In to Civic Hero'}
              </h1>
              <p className="text-xs text-[#5F6368] mt-1 max-w-xs mx-auto">
                {t.loginSubtitle || 'Enter your mobile number to report issues, track resolutions, or access staff portals.'}
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#5F6368] mb-1.5">
                  {t.enterPhone || 'Mobile Phone Number'}
                </label>
                <div className="flex rounded border border-[#DADCE0] bg-white focus-within:border-[#4285F4] focus-within:ring-1 focus-within:ring-[#4285F4] transition-colors">
                  <span className="inline-flex items-center px-3.5 bg-slate-100 border-r border-[#DADCE0] text-[#202124] font-medium text-sm">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    className="flex-1 bg-transparent px-3.5 py-2.5 text-[#202124] placeholder-slate-400 text-sm font-medium focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Optional Invite Code Toggle */}
              <div>
                {!showInviteInput ? (
                  <button
                    type="button"
                    onClick={() => setShowInviteInput(true)}
                    className="text-xs text-[#1A73E8] hover:underline font-medium flex items-center space-x-1"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Have a Municipal Staff / Worker Invite Code?</span>
                  </button>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#5F6368]">
                      Staff / Worker Invite Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g. MUNI-STAFF-2026"
                      className="w-full bg-white border border-[#DADCE0] focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] rounded px-3.5 py-2.5 text-sm text-[#202124] font-mono uppercase focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-[#FCE8E6] border border-[#FAD2CF] rounded text-xs font-medium text-[#C5221F] text-center">
                  {error}
                </div>
              )}

              {/* Material Contained Primary Button */}
              <button
                type="submit"
                disabled={isLoading || phone.length < 10}
                onClick={(e) => createRipple(e, 'rgba(255, 255, 255, 0.3)')}
                className="w-full bg-[#4285F4] hover:bg-[#1A73E8] text-white font-medium uppercase tracking-wider text-xs sm:text-sm py-3 px-4 rounded shadow-elevation-2 hover:shadow-elevation-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ripple-surface"
              >
                <span>{isLoading ? 'Sending Code...' : (t.sendOtp || 'Get 6-Digit OTP')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-[#DADCE0]">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#5F6368] text-center mb-2.5">
                Quick Demo Auto-Fill
              </p>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    createRipple(e, 'rgba(66, 133, 244, 0.15)');
                    fillDemoNumber('9876543210', 'citizen');
                  }}
                  className="w-full bg-[#F8F9FA] hover:bg-[#E8F0FE] border border-[#DADCE0] p-2.5 rounded flex items-center justify-between text-left transition-colors ripple-surface"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#202124]">
                        Citizen — Aarav Mehta
                      </div>
                      <div className="text-[10px] text-[#5F6368]">+91 98765 43210 (Ward Guardian)</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-[#E8F0FE] text-[#1A73E8] px-2 py-0.5 rounded">
                    Fill
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    createRipple(e, 'rgba(66, 133, 244, 0.15)');
                    fillDemoNumber('9123456789', 'municipal');
                  }}
                  className="w-full bg-[#F8F9FA] hover:bg-[#E8F0FE] border border-[#DADCE0] p-2.5 rounded flex items-center justify-between text-left transition-colors ripple-surface"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#202124]">
                        Municipal Staff — Dr. Sunita Rao
                      </div>
                      <div className="text-[10px] text-[#5F6368]">+91 91234 56789 (HQ Triage)</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-[#E8F0FE] text-[#1A73E8] px-2 py-0.5 rounded">
                    Fill
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    createRipple(e, 'rgba(251, 188, 5, 0.15)');
                    fillDemoNumber('9845011223', 'worker');
                  }}
                  className="w-full bg-[#F8F9FA] hover:bg-[#FEF7E0] border border-[#DADCE0] p-2.5 rounded flex items-center justify-between text-left transition-colors ripple-surface"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-[#FEF7E0] text-[#B06000] flex items-center justify-center">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#202124]">
                        Field Worker — Ramesh Kumar
                      </div>
                      <div className="text-[10px] text-[#5F6368]">+91 98450 11223 (Field Ops)</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-[#FEF7E0] text-[#B06000] px-2 py-0.5 rounded">
                    Fill
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <div>
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-[#FEF7E0] text-[#B06000] mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-normal text-[#202124]">
                {t.enterOtp || 'Enter OTP Code'}
              </h2>
              <p className="text-xs text-[#5F6368] mt-1">
                Sent verification code to <span className="text-[#202124] font-medium">+91 {phone}</span>
              </p>
            </div>

            {/* Helper Banner with Auto-fill */}
            <div className="mb-4 p-3 bg-[#F8F9FA] border border-[#DADCE0] rounded flex items-center justify-between">
              <div className="text-xs text-[#5F6368]">
                <span className="font-bold text-[#202124]">Demo Mode:</span> OTP is <span className="font-mono font-bold text-[#1A73E8]">123456</span>
              </div>
              <button
                type="button"
                onClick={fillDemoOtp}
                className="bg-[#4285F4] hover:bg-[#1A73E8] text-white font-medium text-xs uppercase tracking-wider px-2.5 py-1 rounded transition-colors"
              >
                Auto-fill
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full bg-white border border-[#DADCE0] focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] text-center tracking-[0.5em] text-2xl font-bold text-[#202124] py-3 rounded focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-[#FCE8E6] border border-[#FAD2CF] rounded text-xs font-medium text-[#C5221F] text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length < 4}
                onClick={(e) => createRipple(e, 'rgba(255, 255, 255, 0.3)')}
                className="w-full bg-[#4285F4] hover:bg-[#1A73E8] text-white font-medium uppercase tracking-wider text-xs sm:text-sm py-3 px-4 rounded shadow-elevation-2 hover:shadow-elevation-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ripple-surface"
              >
                <span>{isLoading ? 'Verifying OTP...' : (t.verifyOtp || 'Verify & Sign In')}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: NEW CITIZEN PROFILE ONBOARDING */}
        {step === 'onboarding' && (
          <div>
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-[#E8F0FE] text-[#1A73E8] mb-3">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-normal text-[#202124]">
                {t.welcomeCitizen || 'Welcome Citizen Hero! 🎉'}
              </h2>
              <p className="text-xs text-[#5F6368] mt-1 max-w-xs mx-auto">
                Set up your citizen profile to start reporting civic issues and earning ward badges!
              </p>
            </div>

            <form onSubmit={handleCompleteOnboarding} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#5F6368] mb-1.5">
                  {t.enterName || 'Your Full Name'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder || 'e.g. Kavita Nair'}
                    className="w-full bg-white border border-[#DADCE0] focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] rounded px-3.5 py-2.5 text-sm text-[#202124] placeholder-slate-400 focus:outline-none"
                    autoFocus
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <VoiceInputButton onTranscript={(spoken) => setName(spoken)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#5F6368] mb-1.5">
                  {t.selectWard || 'Select your home Ward / Area'}
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full bg-white border border-[#DADCE0] focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] rounded px-3.5 py-2.5 text-sm text-[#202124] focus:outline-none cursor-pointer"
                >
                  {wardOptions.map((w) => (
                    <option key={w} value={w} className="bg-white text-[#202124]">
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="p-3 bg-[#FCE8E6] border border-[#FAD2CF] rounded text-xs font-medium text-[#C5221F] text-center">
                  {error}
                </div>
              )}

              <div className="bg-[#FEF7E0] border border-[#FBBC05]/40 rounded p-3 flex items-center space-x-2.5">
                <span className="text-xl">🎁</span>
                <p className="text-xs text-[#78350F] font-medium">
                  You will earn <span className="font-bold text-[#FBBC05]">+50 XP Welcome Points</span> upon completing setup!
                </p>
              </div>

              <button
                type="submit"
                onClick={(e) => createRipple(e, 'rgba(255, 255, 255, 0.3)')}
                className="w-full bg-[#4285F4] hover:bg-[#1A73E8] text-white font-medium uppercase tracking-wider text-xs sm:text-sm py-3 px-4 rounded shadow-elevation-2 hover:shadow-elevation-4 flex items-center justify-center space-x-2 transition-all ripple-surface"
              >
                <span>{t.startApp || 'Start Reporting & Earning XP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginModal;
