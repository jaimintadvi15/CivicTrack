import React from 'react';
import { UserRole } from '../../types';
import { Sparkles } from 'lucide-react';

interface AISuggestionsProps {
  userRole: UserRole;
  suggestions?: string[];
  onSelectSuggestion: (suggestion: string) => void;
  disabled?: boolean;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  userRole,
  suggestions,
  onSelectSuggestion,
  disabled = false,
}) => {
  const defaultCitizenSuggestions = [
    'What is the status of my complaint?',
    'How do I report a civic issue?',
    'Why was my complaint escalated?',
    'Which complaints are overdue?',
    'How does SLA work?',
  ];

  const defaultAuthoritySuggestions = [
    "Give me today's complaint summary.",
    'Which complaints are overdue?',
    'Show complaints related to garbage.',
    'How does SLA work?',
  ];

  const list =
    suggestions && suggestions.length > 0
      ? suggestions
      : userRole === 'citizen'
      ? defaultCitizenSuggestions
      : defaultAuthoritySuggestions;

  return (
    <div className="py-2">
      <div className="flex items-center space-x-1 mb-2 px-1 text-[11px] font-semibold text-[#5F6368] uppercase tracking-wider">
        <Sparkles className="w-3 h-3 text-[#4285F4]" />
        <span>Suggested Inquiries</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {list.map((item, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSuggestion(item)}
            className="text-xs text-left px-3 py-1.5 rounded-full bg-white hover:bg-[#E8F0FE] text-[#1A73E8] border border-[#DADCE0] hover:border-[#4285F4] transition-all shadow-2xs hover:shadow-xs active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AISuggestions;
