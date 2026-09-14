import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CitizenUser, Ward } from '../types';

interface CitizenLoginProps {
  onLogin: (user: CitizenUser) => void;
  onBack: () => void;
}

export const CitizenLogin: React.FC<CitizenLoginProps> = ({ onLogin, onBack }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState<Ward>('Ward 4 - Midtown Central');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsAuthenticating(true);
    
    // Simulate SMS authentication delay
    setTimeout(() => {
      onLogin({ name, phone, ward });
      setIsAuthenticating(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#121212' }}>
      
      <div className="w-full max-w-[350px] z-10 mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <p className="title">Resident 311</p>
        <p className="message">Verify your identity to submit municipal issues.</p>
        
        <label>
          <input 
            required 
            placeholder="" 
            type="text" 
            className="input" 
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <span>Full Name</span>
        </label>
        
        <label>
          <input 
            required 
            placeholder="" 
            type="tel" 
            className="input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <span>Mobile Number</span>
        </label>

        <label>
          <select 
            required
            value={ward}
            onChange={e => setWard(e.target.value as Ward)}
            className="input"
            style={{ appearance: 'none', color: '#fff' }}
          >
            <option value="Ward 1 - West Harbor">Ward 1 - West Harbor</option>
            <option value="Ward 2 - Industrial Corridor">Ward 2 - Industrial Corridor</option>
            <option value="Ward 3 - Riverfront">Ward 3 - Riverfront</option>
            <option value="Ward 4 - Midtown Central">Ward 4 - Midtown Central</option>
            <option value="Ward 5 - East Heights">Ward 5 - East Heights</option>
            <option value="Ward 6 - Southern Parklands">Ward 6 - Southern Parklands</option>
          </select>
          <span style={{ top: '0px', fontSize: '0.7em', fontWeight: 600, color: '#00bfff' }}>Primary Residence (Ward)</span>
        </label>
        
        <button type="submit" className="submit" disabled={isAuthenticating}>
          {isAuthenticating ? 'Sending OTP...' : 'Verify Identity'}
        </button>
        
        <p className="signin">Secure 256-bit encryption <br/><a href="#">Learn more</a></p>
      </form>
    </div>
  );
};
