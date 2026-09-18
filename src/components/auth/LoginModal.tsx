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
import { supabase } from '../../lib/supabase';

interface LoginModalProps {
  onOpenLanguage: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onOpenLanguage }) => {
  const { loginWithPhone, loginWithIdAndPassword, completeCitizenOnboarding, t } = useApp();

  // Multi-step auth flow
  const [loginRole, setLoginRole] = useState<UserRole>('citizen');
  const [step, setStep] = useState<'contact' | 'staff_credentials' | 'otp' | 'onboarding'>('contact');
  const [email, setEmail] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
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
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setIsLoading(true);

    const isDemoEmail = ['citizen@gmail.com', 'test@test.com'].includes(email.toLowerCase());

    if (!isDemoEmail) {
      try {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setIsLoading(false);
        setStep('otp');
        return;
      } catch (err: any) {
        console.error('Supabase Email Auth error:', err);
        setError(err.message || 'Failed to send verification code. Please check your configuration.');
        setIsLoading(false);
        return; // Don't fall back to demo mode for real emails
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 400);
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

    const isDemoEmail = ['citizen@gmail.com', 'test@test.com'].includes(email.toLowerCase());

    if (!isDemoEmail && loginRole === 'citizen') {
      try {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email'
        });
        if (error) throw error;
      } catch (err: any) {
        setError(err.message || 'Invalid OTP code');
        setIsLoading(false);
        return;
      }
    } else if (confirmationResult && otp !== '123456') {
      try {
        await confirmationResult.confirm(otp);
      } catch (err: any) {
        console.warn('Firebase Phone Auth confirmation notice:', err);
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      
      if (loginRole === 'citizen') {
        const res = loginWithPhone(email, otp, '');
        if (!res.success) {
          setError(res.error || 'Invalid OTP code');
          return;
        }
        if (res.isNewUser) {
          setStep('onboarding');
        }
      } else {
        const res = loginWithPhone.bind(null) ? loginWithIdAndPassword(loginRole, staffId, otp) : { success: false, error: 'App context error' };
        if (!res.success) {
          setError(res.error || 'Invalid OTP code');
        }
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

  const fillDemoCitizen = () => {
    setLoginRole('citizen');
    setStep('contact');
    setEmail('citizen@gmail.com');
    setError('');
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
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

  const fillDemoStaff = (role: 'municipal' | 'worker', id: string, pass: string) => {
    setLoginRole(role);
    setStep('staff_credentials');
    setStaffId(id);
    setPassword(pass);
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

        {/* LOGIN PORTAL TABS */}
        {(step === 'contact' || step === 'staff_credentials') && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-center text-[#202124] mb-4">
              Select Portal to Login
            </h1>
            <div className="grid grid-cols-3 gap-2 bg-[#F1F3F4] p-1.5 rounded-xl">
              <button
                onClick={() => { setLoginRole('citizen'); setStep('contact'); setError(''); }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg flex flex-col items-center justify-center space-y-1 transition-all ${
                  loginRole === 'citizen' ? 'bg-white text-[#1A73E8] shadow-sm' : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Citizen</span>
              </button>
              <button
                onClick={() => { setLoginRole('municipal'); setStep('staff_credentials'); setError(''); }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg flex flex-col items-center justify-center space-y-1 transition-all ${
                  loginRole === 'municipal' ? 'bg-white text-[#1A73E8] shadow-sm' : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Municipal</span>
              </button>
              <button
                onClick={() => { setLoginRole('worker'); setStep('staff_credentials'); setError(''); }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg flex flex-col items-center justify-center space-y-1 transition-all ${
                  loginRole === 'worker' ? 'bg-white text-[#1A73E8] shadow-sm' : 'text-[#5F6368] hover:text-[#202124]'
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
                  Email Address
                </label>
                <div className="flex rounded border border-[#DADCE0] bg-white focus-within:border-[#4285F4] focus-within:ring-1 focus-within:ring-[#4285F4] transition-colors">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="citizen@gmail.com"
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
                disabled={isLoading || !email.includes('@')}
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

        {/* Quick Demo Credentials */}
        {(step === 'contact' || step === 'staff_credentials') && (
            <div className="mt-6 pt-5 border-t border-[#DADCE0]">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#5F6368] text-center mb-2.5">
                Quick Demo Auto-Fill
              </p>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    createRipple(e, 'rgba(66, 133, 244, 0.15)');
                    fillDemoCitizen();
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
                      <div className="text-[10px] text-[#5F6368]">citizen@gmail.com (Ward Guardian)</div>
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
                    fillDemoStaff('municipal', 'MUNI-987', 'admin123');
                  }}
                  className="w-full bg-[#F8F9FA] hover:bg-[#E8F0FE] border border-[#DADCE0] p-2.5 rounded flex items-center justify-between text-left transition-colors ripple-surface"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#202124]">
                        Municipal Staff — Dr. Sunita Rao
                      </div>
                      <div className="text-[10px] text-[#5F6368]">ID: MUNI-987 • Password: admin123</div>
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
                    fillDemoStaff('worker', 'WK-445', 'worker123');
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
                      <div className="text-[10px] text-[#5F6368]">ID: WK-445 • Password: worker123</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-[#FEF7E0] text-[#B06000] px-2 py-0.5 rounded">
                    Fill
                  </span>
                </button>
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
                Sent verification code to <span className="text-[#202124] font-medium">
                  {loginRole === 'citizen' ? email : 'your registered contact'}
                </span>
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
