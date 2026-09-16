import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CivicIssue } from '../../types';
import { createRipple } from '../common/MaterialRipple';
import { HardHat, Clock, X, Star, Send } from 'lucide-react';

interface AssignWorkerModalProps {
  issue: CivicIssue | null;
  onClose: () => void;
}

export const AssignWorkerModal: React.FC<AssignWorkerModalProps> = ({ issue, onClose }) => {
  const { fieldWorkers, assignWorker, t } = useApp();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(fieldWorkers[0]?.id || '');
  const [targetHours, setTargetHours] = useState<number>(
    issue?.severity === 'Critical' ? 4 : issue?.severity === 'High' ? 12 : 24
  );
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  if (!issue) return null;

  const handleAssign = () => {
    if (!selectedWorkerId) return;
    assignWorker(issue.id, selectedWorkerId, targetHours, specialInstructions);
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
                <HardHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white tracking-wide">{t.assign}</h3>
                <p className="text-xs text-white/80">Route issue to on-ground field squad</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                createRipple(e);
                onClose();
              }}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors ripple-surface"
              aria-label="Close assignment modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Issue Summary Card */}
          <div className="bg-[#FAFAFA] p-3 rounded border border-[#DADCE0] flex items-center space-x-3">
            <img
              src={issue.photoUrl}
              alt={issue.title}
              className="w-14 h-14 rounded object-cover flex-shrink-0 border border-[#DADCE0]"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-[#5F6368] block">
                #{issue.ticketNumber} • {issue.category}
              </span>
              <h4 className="text-xs font-medium text-[#202124] truncate">{issue.title}</h4>
              <p className="text-[11px] text-[#5F6368] truncate">{issue.location.address}</p>
            </div>
          </div>

          {/* Select Field Worker */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#202124] block uppercase tracking-wider">
              Select Field Officer / Worker:
            </label>

            <div className="space-y-2">
              {fieldWorkers.map((worker) => {
                const isSelected = selectedWorkerId === worker.id;
                return (
                  <button
                    key={worker.id}
                    type="button"
                    onClick={(e) => {
                      createRipple(e);
                      setSelectedWorkerId(worker.id);
                    }}
                    className={`w-full p-3 rounded border text-left flex items-center justify-between transition-all ripple-surface min-h-touch ${
                      isSelected
                        ? 'border-[#4285F4] bg-[#E8F0FE]/70 ring-1 ring-[#4285F4] shadow-elevation-1'
                        : 'border-[#DADCE0] hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={worker.avatar}
                        alt={worker.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#DADCE0] flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h5 className="text-xs font-medium text-[#202124] truncate">{worker.name}</h5>
                          <span className="text-[10px] text-[#B06000] font-medium flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-[#FBBC05] text-[#FBBC05]" />
                            {worker.rating}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#5F6368] truncate">
                          {worker.role} • {worker.department}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="text-[10px] font-medium bg-gray-100 text-[#5F6368] px-2 py-0.5 rounded block uppercase tracking-wide">
                        {worker.activeTasksCount} active tasks
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target SLA */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#202124] block flex items-center uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#5F6368] mr-1" />
              Target Resolution SLA:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 12, 24].map((hrs) => {
                const isSelected = targetHours === hrs;
                return (
                  <button
                    key={hrs}
                    type="button"
                    onClick={(e) => {
                      createRipple(e);
                      setTargetHours(hrs);
                    }}
                    className={`py-2 px-2 rounded text-xs font-medium border transition-all text-center uppercase tracking-wider ripple-surface min-h-touch ${
                      isSelected
                        ? 'bg-[#4285F4] text-white border-[#4285F4] shadow-elevation-1'
                        : 'bg-white text-[#202124] border-[#DADCE0] hover:bg-gray-50'
                    }`}
                  >
                    {hrs} Hours
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#202124] block uppercase tracking-wider">
              Instructions for Worker:
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Carry cold asphalt mix + traffic cones. Verify pedestrian walkway..."
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
              handleAssign();
            }}
            className="px-5 py-2.5 bg-[#4285F4] hover:bg-[#1A73E8] text-white rounded text-xs font-medium uppercase tracking-wider shadow-elevation-2 transition-all flex items-center space-x-1.5 ripple-surface min-h-touch"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch & Notify Worker</span>
          </button>
        </div>
      </div>
    </div>
  );
};
