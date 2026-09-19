import React, { useState, useEffect } from 'react';
import { CivicIssue } from '../../types';
import { ComplaintAnalysis } from '../../types/ai';
import { analyzeComplaint } from '../../services/aiService';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Building2,
  CheckCircle,
  X,
  Bot,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

interface ComplaintAIAnalysisProps {
  issue: CivicIssue | null;
  isOpen: boolean;
  onClose: () => void;
  onAskAiAboutIssue?: (issue: CivicIssue) => void;
}

export const ComplaintAIAnalysis: React.FC<ComplaintAIAnalysisProps> = ({
  issue,
  isOpen,
  onClose,
  onAskAiAboutIssue,
}) => {
  const [analysis, setAnalysis] = useState<ComplaintAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && issue) {
      setIsAnalyzing(true);
      analyzeComplaint(issue)
        .then((result) => setAnalysis(result))
        .catch((err) => console.warn('Complaint analysis error:', err))
        .finally(() => setIsAnalyzing(false));
    }
  }, [isOpen, issue?.id]);

  if (!isOpen || !issue) return null;

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case 'Immediate':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSlaRiskBadge = (risk?: string) => {
    switch (risk) {
      case 'Overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-elevation-8 w-full max-w-lg overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A73E8] to-[#4285F4] text-white p-4 sm:p-5 flex items-start justify-between relative shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Smart Complaint Analysis</h3>
                <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded border border-white/30">
                  #{issue.ticketNumber}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                AI Risk Assessment & Department Recommendations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isAnalyzing ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto animate-pulse">
                <Bot className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-[#202124]">Analyzing complaint with AI...</p>
              <p className="text-xs text-[#5F6368]">Evaluating hazard risk, public impact, and SLA parameters</p>
            </div>
          ) : analysis ? (
            <>
              {/* 1. Problem Summary */}
              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#DADCE0] space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#5F6368]">
                  Identified Issue
                </span>
                <p className="text-sm font-semibold text-[#202124]">{analysis.problem}</p>
                <p className="text-xs text-[#5F6368] italic">Location: {issue.location.address}</p>
              </div>

              {/* 2. Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Potential Severity */}
                <div className="p-3 rounded-xl border border-[#DADCE0] bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#5F6368]">
                      Potential Severity
                    </span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="text-sm font-bold text-[#202124]">{analysis.potentialSeverity}</span>
                  <p className="text-[11px] text-[#5F6368] mt-0.5 leading-snug">
                    {analysis.severityReason}
                  </p>
                </div>

                {/* Urgency & SLA Risk */}
                <div className="p-3 rounded-xl border border-[#DADCE0] bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#5F6368]">Public Urgency</span>
                    <Clock className="w-3.5 h-3.5 text-[#4285F4]" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getUrgencyBadge(
                        analysis.urgency
                      )}`}
                    >
                      {analysis.urgency} Urgency
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getSlaRiskBadge(
                        analysis.slaRisk
                      )}`}
                    >
                      SLA: {analysis.slaRisk}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Recommended Department */}
              <div className="p-3.5 bg-[#E8F0FE] rounded-xl border border-[#D2E3FC] flex items-start space-x-3">
                <Building2 className="w-5 h-5 text-[#1A73E8] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#1A73E8]">
                    Recommended Department
                  </span>
                  <p className="text-sm font-bold text-[#202124] mt-0.5">
                    {analysis.recommendedDepartment}
                  </p>
                </div>
              </div>

              {/* 4. Recommended Next Action */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                    Recommended Next Action
                  </span>
                  <p className="text-xs font-medium text-[#202124] mt-0.5 leading-relaxed">
                    {analysis.recommendedAction}
                  </p>
                </div>
              </div>

              {/* 5. Official Disclaimer */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start space-x-2 text-[11px] text-amber-900 leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>{analysis.disclaimer}</p>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F8F9FA] border-t border-[#DADCE0] flex items-center justify-between shrink-0">
          {onAskAiAboutIssue && (
            <button
              onClick={() => {
                onClose();
                onAskAiAboutIssue(issue);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-[#1A73E8] border border-[#DADCE0] rounded-lg text-xs font-semibold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask CivicTrack AI about this ticket</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-lg text-xs font-semibold transition-colors ml-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplaintAIAnalysis;
