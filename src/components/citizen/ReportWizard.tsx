import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { IssueCategory, IssueSeverity } from '../../types';
import { samplePresetImages } from '../../data/mockData';
import { simulateAIDetection, findNearbyDuplicate } from '../../utils/aiSimulation';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { getAssetUrl } from '../../utils/assetUrl';
import { createRipple } from '../common/MaterialRipple';
import {
  Sparkles,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Plus
} from 'lucide-react';


interface ReportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (issueId: string) => void;
}

const INDIAN_ADDRESS_SUGGESTIONS = [
  '100 Feet Rd, near 12th Main Junction, Indiranagar, Bengaluru - 560038',
  '5th Cross Rd, Defense Colony Park Gate, Indiranagar, Bengaluru - 560038',
  '80 Feet Road Junction, HAL 2nd Stage, Indiranagar, Bengaluru - 560008',
  '6th Main Rd, Koramangala 4th Block, Bengaluru - 560034',
  '14th Main, Near Primary School, HSR Layout Sector 1, Bengaluru - 560102',
  'CMH Road, Metro Station Exit Gate 2, Indiranagar, Bengaluru - 560038',
  'MG Road, Near Trinity Circle Metro Station, Bengaluru - 560001',
  'Outer Ring Road, Bellandur Eco-Space Flyover, Bengaluru - 560103',
  'Sarjapur Main Road, Doddakannelli Signal, Bengaluru - 560035',
  'Whitefield Main Road, Near Hope Farm Junction, Bengaluru - 560066',
  'Bannerghatta Road, Near Jayadeva Hospital Junction, Bengaluru - 560069',
  'Sampige Road, 7th Cross Junction, Malleshwaram, Bengaluru - 560003'
];

export const ReportWizard: React.FC<ReportWizardProps> = ({ isOpen, onClose, onSubmitted }) => {
  const { createReport, mergeReport, issues, session, currentUser, t } = useApp();

  // Wizard Steps: 1: Details & Photos, 2: AI Auto-Detect & Duplicates, 3: Review & Publish
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([samplePresetImages[0].url]);
  const [photoFiles, setPhotoFiles] = useState<(File | Blob | string)[]>([samplePresetImages[0].url]);
  const [photoHint, setPhotoHint] = useState<string>(samplePresetImages[0].label);
  const [category, setCategory] = useState<IssueCategory>('Pothole');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [severity, setSeverity] = useState<IssueSeverity>('High');
  const [description, setDescription] = useState<string>('');
  const [voiceTranscription, setVoiceTranscription] = useState<string>('');
  const [includeReporterContact, setIncludeReporterContact] = useState<boolean>(true);

  // Address & Location State
  const [manualAddress, setManualAddress] = useState<string>('100 Feet Rd, near 12th Main Junction, Indiranagar, Bengaluru - 560038');
  const [selectedWard, setSelectedWard] = useState<string>('Ward 4 - Indiranagar');
  const [cityName] = useState<string>('Bengaluru');
  const [showAddressSuggestions, setShowAddressSuggestions] = useState<boolean>(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [gpsCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9784, lng: 77.6408 });

  // AI & Detection State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiConfidence, setAiConfidence] = useState<number>(94);
  const [aiTags, setAiTags] = useState<string[]>([]);

  // Duplicate Match
  const [nearbyDuplicate, setNearbyDuplicate] = useState<{
    duplicate: (typeof issues)[0];
    distanceMeters: number;
  } | null>(null);

  const categories: IssueCategory[] = [
    'Pothole',
    'Garbage',
    'Water Leak',
    'Streetlight',
    'Drain',
    'Road Damage',
    'Other',
  ];

  const severities: IssueSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

  const wardList = [
    'Ward 4 - Indiranagar',
    'Ward 7 - Koramangala',
    'Ward 12 - HSR Layout',
    'Ward 1 - Malleshwaram',
    'Ward 8 - Whitefield',
    'Ward 15 - Jayanagar',
  ];

  const quickTitleSuggestions = [
    'Deep road pothole causing vehicle hazard',
    'Overflowing garbage pile on public walkway',
    'Drinking water pipeline leakage flooding street',
    'Streetlights broken causing dark unsafe stretch',
    'Open collapsed drain slab near school'
  ];

  // Address Autocomplete Filter
  useEffect(() => {
    if (manualAddress.trim().length > 1) {
      const q = manualAddress.toLowerCase();
      const matches = INDIAN_ADDRESS_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q));
      setFilteredSuggestions(matches.slice(0, 4));
    } else {
      setFilteredSuggestions(INDIAN_ADDRESS_SUGGESTIONS.slice(0, 4));
    }
  }, [manualAddress]);

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (photos.length < 3) {
        setPhotos((prev) => [...prev, url]);
        setPhotoFiles((prev) => [...prev, file]);
      } else {
        setPhotos([url]);
        setPhotoFiles([file]);
      }
      setPhotoHint(file.name);
    }
  };

  const addPresetPhoto = (preset: (typeof samplePresetImages)[0]) => {
    setCategory(preset.category);
    setSeverity(preset.severity);
    setPhotoHint(preset.label);
    if (!title) {
      setTitle(preset.description.split('.')[0]);
    }
    if (photos.includes(preset.url)) return;
    if (photos.length < 3) {
      setPhotos((prev) => [...prev, preset.url]);
      setPhotoFiles((prev) => [...prev, preset.url]);
    } else {
      setPhotos([preset.url]);
      setPhotoFiles([preset.url]);
    }
  };

  const removePhoto = (indexToRemove: number) => {
    if (photos.length <= 1) return;
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPhotoFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Run AI Detection when moving to Step 2
  const runAiDetection = () => {
    setIsAnalyzing(true);
    setCurrentStep(2);

    setTimeout(() => {
      const promptText = `${title} ${description} ${voiceTranscription} ${photoHint}`;
      const res = simulateAIDetection(promptText, photoHint);
      
      setCategory((prev) => (prev === 'Other' ? prev : res.category));
      setSeverity((prev) => (prev ? prev : res.severity));
      setAiSummary(res.summary);
      setAiConfidence(Math.round(res.confidence * 100));
      setAiTags(res.tags);
      setIsAnalyzing(false);

      // Check for nearby duplicates based on GPS & Category
      const dup = findNearbyDuplicate(res.category, gpsCoords.lat, gpsCoords.lng, issues);
      setNearbyDuplicate(dup);
    }, 800);
  };

  // One-Tap Submit New Community Listing
  const handleSubmitNew = () => {
    const newIssue = createReport({
      title: title.trim() || `${category} problem near ${manualAddress.split(',')[0]}`,
      category,
      customCategory: category === 'Other' ? customCategory : undefined,
      severity,
      description: description || voiceTranscription || `${category} reported by citizen with photo evidence.`,
      photoUrl: photos[0] || getAssetUrl('issues/pothole.jpg'),
      photos: photos,
      photoFiles: photoFiles.length > 0 ? photoFiles : photos,
      voiceNoteTranscription: voiceTranscription || undefined,
      includeReporterContact,
      location: {
        address: manualAddress,
        ward: selectedWard,
        city: cityName,
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
      },
    });

    onSubmitted(newIssue.id);
    onClose();
  };

  // One-Tap Merge Duplicate
  const handleMerge = () => {
    if (nearbyDuplicate) {
      mergeReport(nearbyDuplicate.duplicate.id);
      onSubmitted(nearbyDuplicate.duplicate.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded shadow-elevation-8 overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Modal Top Header (Google Styled Dialog Title) */}
        <div className="bg-[#4285F4] text-white relative">
          <div className="google-accent-bar" />
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-white/20 text-white text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded border border-white/30">
                  Community Listing
                </span>
                <span className="text-xs text-white/80">
                  Step {currentStep} of 3
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-normal text-white mt-0.5">
                {currentStep === 1 && 'Post Civic Issue Listing'}
                {currentStep === 2 && 'AI Inspection & Duplicate Match'}
                {currentStep === 3 && 'Review & Publish to Ward'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Progress Indicator (Material Stepper) */}
        <div className="bg-[#F8F9FA] px-5 py-2.5 border-b border-[#DADCE0] flex items-center justify-between text-xs font-medium text-[#5F6368]">
          <div className={`flex items-center space-x-1.5 ${currentStep >= 1 ? 'text-[#1A73E8] font-semibold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 1 ? 'bg-[#4285F4] text-white' : 'bg-slate-200 text-slate-700'}`}>1</span>
            <span>Details & Photos</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div className={`flex items-center space-x-1.5 ${currentStep >= 2 ? 'text-[#1A73E8] font-semibold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 2 ? 'bg-[#4285F4] text-white' : 'bg-slate-200 text-slate-700'}`}>2</span>
            <span>AI Verification</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div className={`flex items-center space-x-1.5 ${currentStep >= 3 ? 'text-[#1A73E8] font-semibold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 3 ? 'bg-[#4285F4] text-white' : 'bg-slate-200 text-slate-700'}`}>3</span>
            <span>Publish</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* STEP 1: DETAILED LISTING FORM */}
          {currentStep === 1 && (
            <div className="space-y-5">
              
              {/* 1. Issue Title */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  Issue Title / Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep dangerous pothole at 100ft Road junction"
                  className="w-full bg-white border border-gray-300 focus:border-mat-secondary focus:ring-1 focus:ring-mat-secondary rounded px-4 py-2.5 text-sm font-normal text-mat-text-primary placeholder:text-gray-400 focus:outline-none"
                />

                {/* Quick Title Suggestion Pills */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-mat-text-secondary font-medium uppercase py-0.5">Suggestions:</span>
                  {quickTitleSuggestions.slice(0, 3).map((sugg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTitle(sugg)}
                      className="text-[11px] bg-[#F1F3F4] hover:bg-[#E8F0FE] hover:text-[#1A73E8] text-[#5F6368] px-2 py-0.5 rounded border border-[#DADCE0] transition-colors truncate max-w-[280px]"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Category Chips */}
              <div>
                <label className="block text-xs font-medium text-mat-text-primary uppercase tracking-wider mb-1.5">
                  Category <span className="text-mat-critical">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categories.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={(e) => {
                          createRipple(e);
                          setCategory(cat);
                        }}
                        className={`p-2.5 rounded border text-xs font-medium text-left transition-all flex items-center justify-between ripple-surface ${
                          isSelected
                            ? 'bg-[#4285F4] text-white border-[#4285F4] shadow-elevation-1'
                            : 'bg-white hover:bg-gray-50 text-[#202124] border-gray-300'
                        }`}
                      >
                        <span>{t.categories[cat]}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>

                {/* If 'Other' picked, show custom category text input */}
                {category === 'Other' && (
                  <div className="mt-2.5 p-3 bg-amber-50 rounded border border-amber-200 animate-fade-in">
                    <label className="block text-[11px] font-medium text-amber-900 mb-1 uppercase tracking-wider">
                      Specify Custom Category:
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Broken park bench, Illegal banner, Fallen tree..."
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-mat-text-primary focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]"
                    />
                  </div>
                )}
              </div>

              {/* 3. Address & Location (Manual Text + Autocomplete + GPS) */}
              <div className="relative">
                <label className="block text-xs font-medium text-mat-text-primary uppercase tracking-wider mb-1">
                  Full Address / Landmark <span className="text-mat-critical">*</span>
                </label>
                
                <div className="relative">
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => {
                      setManualAddress(e.target.value);
                      setShowAddressSuggestions(true);
                    }}
                    onFocus={() => setShowAddressSuggestions(true)}
                    placeholder="Enter street name, landmark, area, city & pincode"
                    className="w-full bg-white border border-gray-300 focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] rounded pl-10 pr-4 py-2.5 text-sm font-normal text-mat-text-primary placeholder:text-gray-400 focus:outline-none"
                  />
                  <MapPin className="w-5 h-5 text-[#4285F4] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {/* Autocomplete Suggestions Dropdown */}
                {showAddressSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-elevation-4 z-30 overflow-hidden">
                    <div className="p-2 bg-slate-100 text-[10px] font-extrabold uppercase text-slate-500 border-b border-slate-200 flex items-center justify-between">
                      <span>Suggested Locations & Landmarks</span>
                      <button
                        type="button"
                        onClick={() => setShowAddressSuggestions(false)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {filteredSuggestions.map((addr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setManualAddress(addr);
                          setShowAddressSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#202124] hover:bg-[#E8F0FE] hover:text-[#1A73E8] border-b border-[#DADCE0] last:border-b-0 flex items-start space-x-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#4285F4] shrink-0 mt-0.5" />
                        <span className="truncate">{addr}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Ward Selection & Auto-GPS Pin info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#5F6368] uppercase mb-0.5">
                      Municipal Ward / Zone
                    </label>
                    <select
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      className="w-full bg-[#F1F3F4] border border-[#DADCE0] rounded px-3 py-2 text-xs font-semibold text-[#202124] focus:outline-none focus:border-[#4285F4]"
                    >
                      {wardList.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#5F6368] uppercase mb-0.5">
                      GPS Tag Coordinates
                    </label>
                    <div className="bg-[#E8F0FE] border border-[#D2E3FC] rounded px-3 py-2 text-xs font-mono text-[#1A73E8] flex items-center justify-between">
                      <span>{gpsCoords.lat.toFixed(4)}° N, {gpsCoords.lng.toFixed(4)}° E</span>
                      <span className="text-[9px] bg-[#D2E3FC] text-[#174EA6] px-1 rounded font-bold">±3m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Description & Voice Note */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    Detailed Description
                  </label>
                  <span className="text-[11px] text-slate-500">Voice or text input</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in your own words (e.g. depth of pothole, water overflow, pedestrian difficulty)..."
                    className="w-full bg-white border border-gray-300 focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] rounded p-3 text-sm text-mat-text-primary placeholder:text-gray-400 focus:outline-none"
                  />
                  <div className="absolute right-2.5 bottom-2.5">
                    <VoiceInputButton
                      onTranscript={(spoken) => {
                        setVoiceTranscription(spoken);
                        setDescription((prev) => (prev ? `${prev} ${spoken}` : spoken));
                      }}
                    />
                  </div>
                </div>

                {voiceTranscription && (
                  <div className="mt-1.5 p-2 bg-[#E8F0FE] border border-[#D2E3FC] rounded text-xs text-[#1A73E8] flex items-center space-x-2">
                    <span className="text-xs font-medium">🎤 Voice captured:</span>
                    <span className="italic truncate text-mat-text-primary">{voiceTranscription}</span>
                  </div>
                )}
              </div>

              {/* 5. Severity Chips */}
              <div>
                <label className="block text-xs font-medium text-mat-text-primary uppercase tracking-wider mb-1.5">
                  Severity Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {severities.map((sev) => {
                    const isSelected = severity === sev;
                    const colors = {
                      Low: 'hover:bg-blue-50 text-mat-low border-mat-low/30',
                      Medium: 'hover:bg-amber-50 text-amber-800 border-mat-medium/40',
                      High: 'hover:bg-orange-50 text-mat-high border-mat-high/30',
                      Critical: 'hover:bg-red-50 text-mat-critical border-mat-critical/30',
                    };
                    const selectedColors = {
                      Low: 'bg-mat-low text-white border-mat-low shadow-elevation-1',
                      Medium: 'bg-amber-500 text-white border-amber-500 shadow-elevation-1',
                      High: 'bg-mat-high text-white border-mat-high shadow-elevation-1',
                      Critical: 'bg-mat-critical text-white border-mat-critical shadow-elevation-1',
                    };
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={(e) => {
                          createRipple(e);
                          setSeverity(sev);
                        }}
                        className={`p-2 rounded border text-xs font-medium uppercase tracking-wider transition-all ripple-surface ${
                          isSelected ? selectedColors[sev] : `bg-white ${colors[sev]}`
                        }`}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Photo(s) Upload (Up to 3 Photos) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-mat-text-primary uppercase tracking-wider">
                    Evidence Photos ({photos.length}/3)
                  </label>
                  <span className="text-[11px] text-mat-text-secondary">Up to 3 photos</span>
                </div>

                {/* Photo Gallery Grid */}
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  {photos.map((imgUrl, idx) => (
                    <div key={idx} className="relative rounded overflow-hidden border border-gray-300 aspect-video bg-gray-900 group shadow-elevation-1">
                      <img src={imgUrl} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      {photos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 bg-mat-critical text-white p-1 rounded-full shadow opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add Photo Slot (if < 3) */}
                  {photos.length < 3 && (
                    <label className="border-2 border-dashed border-gray-300 hover:border-[#4285F4] rounded flex flex-col items-center justify-center p-2 cursor-pointer bg-[#FAFAFA] hover:bg-blue-50/50 transition-colors aspect-video">
                      <Plus className="w-5 h-5 text-[#4285F4] mb-1" />
                      <span className="text-[10px] font-medium text-mat-text-secondary uppercase tracking-wider">Add Photo</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Sample Presets for Demo */}
                <div className="bg-[#FAFAFA] p-3 rounded border border-gray-200">
                  <p className="text-[10px] font-medium text-mat-text-secondary uppercase tracking-wider mb-2">Or select a demo issue photo:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {samplePresetImages.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={(e) => {
                          createRipple(e);
                          addPresetPhoto(preset);
                        }}
                        className="text-[11px] font-medium bg-white hover:bg-blue-50 hover:text-[#1A73E8] text-mat-text-primary px-2.5 py-1 rounded border border-gray-300 transition-all flex items-center space-x-1 ripple-surface"
                      >
                        <span>📷</span>
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 7. Reporter Contact Preference */}
              <div className="bg-gray-50 p-3.5 rounded border border-gray-200 flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="reporterContact"
                  checked={includeReporterContact}
                  onChange={(e) => setIncludeReporterContact(e.target.checked)}
                  className="w-4 h-4 rounded mt-0.5 cursor-pointer accent-[#4285F4]"
                />
                <label htmlFor="reporterContact" className="text-xs text-mat-text-secondary cursor-pointer">
                  <span className="font-medium text-mat-text-primary block">
                    Include verified contact for Municipal updates
                  </span>
                  <span className="text-[11px] text-mat-text-secondary block">
                    Share phone number ({session?.phone || currentUser.phone}) with Ward Engineers for repair status notifications.
                  </span>
                </label>
              </div>

            </div>
          )}

          {/* STEP 2: AI AUTO-DETECT & DUPLICATE CHECK */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {isAnalyzing ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full border-4 border-[#4285F4] border-t-transparent animate-spin mx-auto" />
                  <h3 className="text-lg font-black text-slate-900">AI Vision & NLP Analysis</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Analyzing photo evidence, extracting civic hazard severity, and cross-referencing nearby ward reports...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI Results Card */}
                  <div className="bg-[#E8F0FE] p-4 rounded border border-[#D2E3FC] space-y-3 shadow-elevation-1">
                    <div className="flex items-center space-x-2 text-[#1A73E8]">
                      <Sparkles className="w-5 h-5 text-[#4285F4]" />
                      <span className="font-medium text-xs uppercase tracking-wider">AI Vision Classification</span>
                    </div>

                    <p className="text-xs text-[#202124] leading-relaxed font-normal">
                      {aiSummary}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="bg-white px-2.5 py-1 rounded text-xs font-medium text-[#1A73E8] border border-[#D2E3FC]">
                        Category: {category}
                      </span>
                      <span className="bg-white px-2.5 py-1 rounded text-xs font-medium text-[#1A73E8] border border-[#D2E3FC]">
                        Severity: {severity}
                      </span>
                      <span className="bg-white px-2.5 py-1 rounded text-xs font-medium text-[#1A73E8] border border-[#D2E3FC]">
                        Confidence: {aiConfidence}%
                      </span>
                    </div>

                    {aiTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {aiTags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-white text-[#1A73E8] border border-[#D2E3FC] font-medium px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* DUPLICATE WARNING / MERGE FLOW */}
                  {nearbyDuplicate ? (
                    <div className="bg-[#FEF7E0] border border-[#FEEFC3] rounded p-4 space-y-3 shadow-elevation-1 animate-fade-in">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-[#B06000] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-[#78350F] uppercase tracking-wide">{t.duplicateTitle}</h4>
                          <p className="text-xs text-[#78350F] mt-0.5">
                            Matching report found within <strong>{nearbyDuplicate.distanceMeters}m</strong>: "{nearbyDuplicate.duplicate.title}".
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded border border-[#DADCE0] flex items-center space-x-3">
                        <img src={nearbyDuplicate.duplicate.photoUrl} alt="Existing" className="w-12 h-12 rounded object-cover border border-gray-200" />
                        <div className="text-xs min-w-0">
                          <p className="font-medium text-[#202124] truncate">{nearbyDuplicate.duplicate.title}</p>
                          <p className="text-[#5F6368] text-[11px] truncate">{nearbyDuplicate.duplicate.location.address}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            createRipple(e);
                            handleMerge();
                          }}
                          className="bg-[#FBBC05] hover:bg-[#F9AB00] text-[#202124] font-semibold text-xs uppercase tracking-wider py-2.5 px-3 rounded shadow-elevation-1 transition-all flex items-center justify-center space-x-1 ripple-surface"
                        >
                          <span>{t.mergeReport}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            createRipple(e);
                            setCurrentStep(3);
                          }}
                          className="bg-white hover:bg-gray-50 text-[#202124] border border-gray-300 font-medium text-xs uppercase tracking-wider py-2.5 px-3 rounded transition-all ripple-surface"
                        >
                          <span>Submit as New</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#E6F4EA] border border-[#CEEAD6] rounded p-3 flex items-center space-x-2 text-[#137333] text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#34A853]" />
                      <span>No duplicate complaints found nearby. Ready to publish as new listing!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: REVIEW & PUBLISH */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-[#FAFAFA] p-4 rounded border border-[#DADCE0] space-y-3 shadow-elevation-1">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-medium text-[#1A73E8] uppercase tracking-wider bg-[#E8F0FE] border border-[#D2E3FC] px-2 py-0.5 rounded">
                      {category === 'Other' && customCategory ? customCategory : category}
                    </span>
                    <h3 className="text-sm sm:text-base font-medium text-[#202124] mt-1.5">{title || 'Civic Issue Listing'}</h3>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider ${
                    severity === 'Critical' ? 'bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]' : 'bg-[#FEF7E0] text-[#78350F] border border-[#FBBC05]/40'
                  }`}>
                    {severity} Priority
                  </span>
                </div>

                <div className="flex items-start space-x-2 text-xs text-[#5F6368]">
                  <MapPin className="w-4 h-4 text-[#4285F4] shrink-0 mt-0.5" />
                  <span>{manualAddress} ({selectedWard})</span>
                </div>

                <p className="text-xs text-[#202124] bg-white p-3 rounded border border-[#DADCE0]">
                  {description || 'No written description provided.'}
                </p>

                {/* Evidence Photos Gallery */}
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p, idx) => (
                    <img key={idx} src={p} alt={`Photo ${idx + 1}`} className="w-full h-20 rounded object-cover border border-gray-200 shadow-xs" />
                  ))}
                </div>

                <div className="text-[11px] text-[#5F6368] flex items-center justify-between pt-1 border-t border-[#DADCE0]">
                  <span>Reporter: <strong className="text-[#202124] font-medium">{currentUser.name}</strong></span>
                  <span>Target SLA: <strong className="text-[#202124] font-medium">{severity === 'Critical' ? '4 Hours' : '24 Hours'}</strong></span>
                </div>
              </div>

              <div className="bg-[#FEF7E0] border border-[#FBBC05]/40 p-3 rounded flex items-center space-x-2 text-xs text-[#78350F] font-medium">
                <Sparkles className="w-4 h-4 text-[#FBBC05] shrink-0" />
                <span>Publishing this listing will award you <strong>+25 XP Points</strong> and alert nearby citizens!</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-[#F8F9FA] px-5 py-4 border-t border-[#DADCE0] flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={(e) => {
                createRipple(e, 'rgba(0, 0, 0, 0.1)');
                setCurrentStep((prev) => prev - 1);
              }}
              className="px-4 py-2.5 rounded text-[#5F6368] hover:text-[#202124] hover:bg-black/5 font-medium text-xs uppercase tracking-wider flex items-center space-x-1 transition-colors ripple-surface"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                createRipple(e, 'rgba(0, 0, 0, 0.1)');
                onClose();
              }}
              className="px-4 py-2.5 rounded text-[#5F6368] hover:text-[#202124] hover:bg-black/5 font-medium text-xs uppercase tracking-wider transition-colors ripple-surface"
            >
              Cancel
            </button>
          )}

          {currentStep === 1 && (
            <button
              type="button"
              onClick={(e) => {
                createRipple(e, 'rgba(255, 255, 255, 0.3)');
                runAiDetection();
              }}
              className="bg-[#4285F4] hover:bg-[#1A73E8] text-white font-medium text-xs uppercase tracking-wider py-2.5 px-5 rounded shadow-elevation-2 hover:shadow-elevation-4 flex items-center space-x-2 transition-all ripple-surface"
            >
              <span>Verify & Check Duplicates</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              onClick={(e) => {
                createRipple(e, 'rgba(255, 255, 255, 0.3)');
                setCurrentStep(3);
              }}
              disabled={isAnalyzing}
              className="bg-[#4285F4] hover:bg-[#1A73E8] text-white font-medium text-xs uppercase tracking-wider py-2.5 px-5 rounded shadow-elevation-2 hover:shadow-elevation-4 flex items-center space-x-2 transition-all ripple-surface disabled:opacity-50"
            >
              <span>Proceed to Review</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              onClick={(e) => {
                createRipple(e, 'rgba(255, 255, 255, 0.3)');
                handleSubmitNew();
              }}
              className="bg-[#4285F4] hover:bg-[#1A73E8] text-white font-medium text-xs uppercase tracking-wider py-3 px-6 rounded shadow-elevation-2 hover:shadow-elevation-4 flex items-center space-x-2 transition-all ripple-surface"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Community Listing (+25 XP)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
