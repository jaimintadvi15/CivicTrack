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
  Info,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { CivicHeroLogo } from '../common/CivicHeroLogo';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

interface LoginModalProps {
  onOpenLanguage: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onOpenLanguage }) => {
  const { loginWithPhone, loginWithIdAndPassword, completeCitizenOnboarding, quickDemoLogin, t } = useApp();

  // Multi-step auth flow
  const [loginRole, setLoginRole] = useState<UserRole>('citizen');
  const [step, setStep] = useState<'contact' | 'staff_credentials' | 'otp' | 'onboarding'>('contact');
  const [contactMethod, setContactMethod] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [fallbackOtp, setFallbackOtp] = useState<string>('123456');

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
    if (!contactMethod || contactMethod.trim() === '') {
      setError('Please enter a valid email address or phone number');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const isPhone = /^\+?[0-9]{10,15}$/.test(contactMethod.replace(/[\s-]/g, ''));
      let supabaseError: any = null;

      if (isPhone) {
        // Format to E.164 if missing country code (assuming India +91 as default for this civic app, or just pass raw if they include '+')
        const formattedPhone = contactMethod.startsWith('+') ? contactMethod.replace(/[\s-]/g, '') : `+91${contactMethod.replace(/[\s-]/g, '')}`;
        const res = await supabase.auth.signInWithOtp({ phone: formattedPhone });
        supabaseError = res.error;
      } else {
        const res = await supabase.auth.signInWithOtp({ email: contactMethod.trim() });
        supabaseError = res.error;
      }
      
      if (supabaseError) {
        console.warn('Supabase OTP delivery notice (email quota/custom SMTP limitation):', supabaseError.message);
        // Supabase built-in mailer has a limit of 3 emails/hour or requires custom SMTP / SMS provider
        // Seamlessly switch to fallback demo OTP so the citizen is never locked out!
        setIsFallbackMode(true);
        setFallbackOtp('123456');
      } else {
        setIsFallbackMode(false);
      }

      setIsLoading(false);
      setStep('otp');
    } catch (err: any) {
      console.warn('Supabase signInWithOtp catch:', err);
      // Fallback gracefully so the user is never stuck
      setIsFallbackMode(true);
      setFallbackOtp('123456');
      setIsLoading(false);
      setStep('otp');
    }
  };

  const handleStaffCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim() || !password.trim()) {
      setError('Please enter both Staff ID and Password');
      return;
    }
    setError('');
    setIsLoading(true);

    // Simulate API verification of ID and password
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, this would trigger an OTP to their registered email/phone
      setStep('otp');
    }, 600);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (loginRole === 'citizen') {
        let isVerified = false;

        // Try Supabase verification if live OTP was sent
        if (!isFallbackMode) {
          try {
            const isPhone = /^\+?[0-9]{10,15}$/.test(contactMethod.replace(/[\s-]/g, ''));
            const formattedPhone = contactMethod.startsWith('+') ? contactMethod.replace(/[\s-]/g, '') : `+91${contactMethod.replace(/[\s-]/g, '')}`;

            const { error: sbError } = await supabase.auth.verifyOtp({
              email: isPhone ? undefined : contactMethod.trim(),
              phone: isPhone ? formattedPhone : undefined,
              token: otp,
              type: isPhone ? 'sms' : 'email'
            });
            if (!sbError) {
              isVerified = true;
            } else {
              console.warn('Supabase OTP verification notice:', sbError.message);
            }
          } catch (sbErr) {
            console.warn('Supabase verifyOtp error:', sbErr);
          }
        }

        // Accept demo / fallback code or dev bypass
        if (!isVerified) {
          if (otp === '123456' || otp === fallbackOtp || (isFallbackMode && otp.length >= 4)) {
            isVerified = true;
          } else {
            setError(isFallbackMode ? 'Please enter code 123456 to continue' : 'Invalid OTP code. Please check your code or use 123456');
            setIsLoading(false);
            return;
          }
        }
        
        // Update local app state
        const res = loginWithPhone(contactMethod.trim(), otp, '');
        if (!res.success) {
          setError(res.error || 'Invalid OTP code');
          setIsLoading(false);
          return;
        }
        if (res.isNewUser) {
          setStep('onboarding');
        }
      } else {
        // Staff portal verification
        const res = loginWithIdAndPassword(loginRole, staffId, otp);
        if (!res.success) {
          setError(res.error || 'Invalid credentials');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name to complete setup');
      return;
    }
    completeCitizenOnboarding(name.trim(), ward);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google sign in');
      setIsLoading(false);
    }
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

        {/* LOGIN PORTAL TABS */}
        {(step === 'contact' || step === 'staff_credentials') && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-center text-[#202124] mb-4">
              Select Portal to Login
            </h1>
            <div className="grid grid-cols-3 gap-2 bg-[#F1F3F4] p-1.5 rounded-xl">
              <button
                onClick={() => { setLoginRole('citizen'); setStep('contact'); setError(''); }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg flex flex-col items-center justify-center space-y-1 transition-all ${loginRole === 'citizen' ? 'bg-white text-[#1A73E8] shadow-sm' : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
              >
                <User className="w-4 h-4" />
                <span>Citizen</span>
              </button>
              <button
                onClick={() => { setLoginRole('municipal'); setStep('staff_credentials'); setError(''); }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg flex flex-col items-center justify-center space-y-1 transition-all ${loginRole === 'municipal' ? 'bg-white text-[#1A73E8] shadow-sm' : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Municipal</span>
              </button>
              <button
                onClick={() => { setLoginRole('worker'); setStep('staff_credentials'); setError(''); }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg flex flex-col items-center justify-center space-y-1 transition-all ${loginRole === 'worker' ? 'bg-white text-[#1A73E8] shadow-sm' : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
              >
                <HardHat className="w-4 h-4" />
                <span>Field Ops</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: CITIZEN EMAIL ADDRESS */}
        {step === 'contact' && loginRole === 'citizen' && (
          <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center mb-6">
              <p className="text-xs text-[#5F6368] max-w-xs mx-auto">
                {t.loginSubtitle || 'Enter your email address to report issues and track resolutions.'}
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#5F6368] mb-1.5">
                  Email Address or Phone Number
                </label>
                <div className="flex rounded border border-[#DADCE0] bg-white focus-within:border-[#4285F4] focus-within:ring-1 focus-within:ring-[#4285F4] transition-colors">
                  <input
                    type="text"
                    value={contactMethod}
                    onChange={(e) => setContactMethod(e.target.value)}
                    placeholder="citizen@gmail.com or 9876543210"
                    className="flex-1 bg-transparent px-3.5 py-2.5 text-[#202124] placeholder-slate-400 text-sm font-medium focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[#FCE8E6] border border-[#FAD2CF] rounded text-xs font-medium text-[#C5221F] text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || contactMethod.trim().length < 5}
                onClick={(e) => createRipple(e, 'rgba(255, 255, 255, 0.3)')}
                className="w-full bg-[#4285F4] hover:bg-[#1A73E8] text-white font-medium uppercase tracking-wider text-xs sm:text-sm py-3 px-4 rounded shadow-elevation-2 hover:shadow-elevation-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ripple-surface"
              >
                <span>{isLoading ? 'Sending OTP...' : 'Get Verification OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center space-x-2">
              <span className="h-px w-full bg-gray-200"></span>
              <span className="text-xs text-gray-500 font-medium uppercase">OR</span>
              <span className="h-px w-full bg-gray-200"></span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mt-4 w-full bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] text-[#3C4043] font-medium text-sm py-3 px-4 rounded shadow-sm flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col items-center">
              <button
                type="button"
                onClick={() => quickDemoLogin('citizen')}
                className="text-xs text-[#5F6368] hover:text-[#1A73E8] font-medium flex items-center space-x-1.5 py-1.5 px-3 rounded-md hover:bg-blue-50 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FBBC05]" />
                <span>Instant Demo Login (Skip OTP)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: STAFF CREDENTIALS */}
        {step === 'staff_credentials' && (
          <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center mb-6">
              <p className="text-xs text-[#5F6368] max-w-xs mx-auto">
                {loginRole === 'municipal'
                  ? 'Sign in with your Municipal HQ staff credentials.'
                  : 'Sign in with your Field Operations staff credentials.'}
              </p>
            </div>

            <form onSubmit={handleStaffCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#5F6368] mb-1.5">
                  Staff ID / Private ID
                </label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                  placeholder={loginRole === 'municipal' ? 'e.g. MUNI-1042' : 'e.g. BBMP-ENG-45'}
                  className="w-full bg-white border border-[#DADCE0] focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] rounded px-3.5 py-2.5 text-sm font-mono text-[#202124] placeholder-slate-400 focus:outline-none transition-colors uppercase"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#5F6368] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white border border-[#DADCE0] focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] rounded px-3.5 py-2.5 text-sm text-[#202124] placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="p-3 bg-[#FCE8E6] border border-[#FAD2CF] rounded text-xs font-medium text-[#C5221F] text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !staffId || !password}
                onClick={(e) => createRipple(e, 'rgba(255, 255, 255, 0.3)')}
                className="w-full bg-[#4285F4] hover:bg-[#1A73E8] text-white font-medium uppercase tracking-wider text-xs sm:text-sm py-3 px-4 rounded shadow-elevation-2 hover:shadow-elevation-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ripple-surface"
              >
                <span>{isLoading ? 'Authenticating...' : 'Continue to Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
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
                Sent verification code to <span className="text-[#202124] font-medium">
                  {loginRole === 'citizen' ? contactMethod : 'your registered contact'}
                </span>
              </p>
              {loginRole === 'citizen' && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('contact');
                    setError('');
                    setOtp('');
                  }}
                  className="mt-2 text-xs text-[#1A73E8] hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Change email or phone number</span>
                </button>
              )}
            </div>

            {isFallbackMode && loginRole === 'citizen' && (
              <div className="mb-4 p-3.5 bg-[#FEF7E0] border border-[#FEEFC3] rounded-lg text-left text-xs text-[#78350F] shadow-sm animate-in fade-in duration-200">
                <div className="flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-[#B06000] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-[#B06000]">Email Delivery Limit Notice</p>
                    <p className="mt-1 text-[#5F6368] leading-relaxed">
                      Supabase free mailer quota reached or pending custom SMTP. For instant testing, use verification code:{' '}
                      <span className="font-bold text-[#202124] font-mono bg-white px-2 py-0.5 rounded border border-[#DADCE0]">
                        123456
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtp('123456')}
                      className="mt-2 text-xs font-semibold text-[#1A73E8] hover:text-[#174EA6] hover:underline flex items-center gap-1"
                    >
                      <span>Click to auto-fill 123456 & Proceed</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

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

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtp('123456');
                    setError('');
                  }}
                  className="text-xs text-[#5F6368] hover:text-[#1A73E8] font-medium transition-colors"
                >
                  Didn't receive code? Click to fill test OTP: <strong className="text-[#1A73E8] font-mono">123456</strong>
                </button>
              </div>
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
