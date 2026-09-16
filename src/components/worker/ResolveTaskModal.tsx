import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CivicIssue } from '../../types';
import { createRipple } from '../common/MaterialRipple';
import { Camera, Upload, CheckCircle2, X } from 'lucide-react';

interface ResolveTaskModalProps {
  issue: CivicIssue | null;
  onClose: () => void;
}

export const ResolveTaskModal: React.FC<ResolveTaskModalProps> = ({ issue, onClose }) => {
  const { resolveIssueWithProof, t } = useApp();

  // Default sample clean photo
  const sampleCleanPhotos: Record<string, string> = {
    Garbage:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    Pothole:
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    'Water Leak':
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    Streetlight:
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    Drain:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    'Road Damage':
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
  };

  const defaultPhoto =
    (issue && sampleCleanPhotos[issue.category]) ||
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80';

  const [afterPhoto, setAfterPhoto] = useState<string>(defaultPhoto);
  const [remarks, setRemarks] = useState<string>(
    'Work completed successfully on site. Area inspected and verified safe for public.'
  );

  if (!issue) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAfterPhoto(url);
    }
  };

  const handleSubmitResolution = () => {
    if (!afterPhoto) return;
    resolveIssueWithProof(issue.id, afterPhoto, remarks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded shadow-elevation-8 w-full max-w-lg overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#4285F4] text-white relative flex-shrink-0">
          <div className="google-accent-bar" />
          <div className="p-4 sm:p-5 flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded bg-white/20 text-white flex items-center justify-center font-medium border border-white/30">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white tracking-wide">{t.markResolved}</h3>
                <p className="text-xs text-white/80">Mandatory proof photo upload required</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                createRipple(e);
                onClose();
              }}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors ripple-surface"
              aria-label="Close resolve modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Before Photo for Reference */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-[#5F6368] block uppercase tracking-wider">
              Original Issue (Before):
            </span>
            <div className="flex items-center space-x-3 bg-[#FAFAFA] p-2.5 rounded border border-[#DADCE0]">
              <img
                src={issue.photoUrl}
                alt="Before"
                className="w-16 h-16 rounded object-cover border border-[#DADCE0] flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-[#5F6368] block">
                  #{issue.ticketNumber} • {issue.category}
                </span>
                <h5 className="text-xs font-medium text-[#202124] truncate">{issue.title}</h5>
                <p className="text-[10px] text-[#5F6368] truncate">{issue.location.address}</p>
              </div>
            </div>
          </div>

          {/* Mandatory "After" Photo Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#202124] block uppercase tracking-wider">
                {t.uploadProof} <span className="text-[#EA4335]">*</span>
              </label>
              <span className="text-[10px] bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] font-medium px-2 py-0.5 rounded uppercase tracking-wide">
                Required for Closure
              </span>
            </div>

            <div className="relative rounded overflow-hidden border-2 border-dashed border-[#34A853]/50 bg-[#E6F4EA]/30 aspect-video flex items-center justify-center group shadow-inner">
              {afterPhoto ? (
                <>
                  <img
                    src={afterPhoto}
                    alt="Resolution After Proof"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <label className="bg-white text-[#202124] px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider cursor-pointer shadow-elevation-1">
                      Retake Proof Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Camera className="w-8 h-8 mx-auto text-[#4285F4] mb-1" />
                  <p className="text-xs text-[#5F6368]">Take after photo of resolved area</p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center space-x-2">
              <label className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-[#4285F4] hover:bg-[#1A73E8] text-white rounded text-xs font-medium uppercase tracking-wider cursor-pointer transition-all shadow-elevation-1 min-h-touch ripple-surface">
                <Camera className="w-4 h-4" />
                <span>Take After Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <label className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-gray-100 text-[#5F6368] rounded text-xs font-medium uppercase tracking-wider cursor-pointer border border-[#DADCE0] transition-colors min-h-touch ripple-surface">
                <Upload className="w-4 h-4 text-[#5F6368]" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#202124] block uppercase tracking-wider">
              Field Officer Resolution Remarks:
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Describe repairs carried out on site..."
              className="w-full p-2.5 bg-white border border-[#DADCE0] rounded text-xs text-[#202124] placeholder:text-gray-400 focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8F9FA] border-t border-[#DADCE0] flex items-center justify-end space-x-2 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              createRipple(e);
              onClose();
            }}
            className="px-4 py-2 text-[#5F6368] hover:bg-gray-100 rounded text-xs font-medium uppercase tracking-wider transition-colors ripple-surface min-h-touch"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={(e) => {
              createRipple(e);
              handleSubmitResolution();
            }}
            className="px-6 py-2.5 bg-[#34A853] hover:bg-[#2D9247] text-white rounded text-xs font-medium uppercase tracking-wider shadow-elevation-2 transition-all flex items-center space-x-1.5 ripple-surface min-h-touch"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete & Award Citizen XP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
