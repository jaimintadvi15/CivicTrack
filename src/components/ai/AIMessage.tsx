import React from 'react';
import { Bot, User, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { AIMessage as AIMessageType } from '../../types/ai';

interface AIMessageProps {
  message: AIMessageType;
  onSelectTicket?: (ticketNumber: string) => void;
}

export const AIMessage: React.FC<AIMessageProps> = ({ message, onSelectTicket }) => {
  const isUser = message.sender === 'user';

  // Format text with bolding and bullet points
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      // Check for bullet lines
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
      const cleanLine = isBullet ? line.trim().replace(/^[•-]\s*/, '') : line;

      // Detect and replace ticket numbers like #BLR-2026-8821 or #CT1024 into interactive chips
      const ticketRegex = /(#(?:BLR-\d{4}-\d{4}|CT\d+|civic-\d+))/gi;
      const parts = cleanLine.split(ticketRegex);

      const renderedLine = parts.map((part, pIdx) => {
        if (ticketRegex.test(part)) {
          const rawTicket = part.replace(/^#/, '');
          return (
            <button
              key={pIdx}
              type="button"
              onClick={() => onSelectTicket?.(rawTicket)}
              className="inline-flex items-center space-x-1 px-1.5 py-0.5 my-0.5 mx-0.5 bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] rounded font-mono font-bold text-[11px] border border-[#D2E3FC] transition-colors cursor-pointer group"
              title={`View complaint #${rawTicket}`}
            >
              <span>{part}</span>
              <ExternalLink className="w-3 h-3 text-[#1A73E8] opacity-70 group-hover:opacity-100" />
            </button>
          );
        }

        // Bold formatting: **bold text**
        const boldRegex = /\*\*(.*?)\*\*/g;
        const boldParts = part.split(boldRegex);
        if (boldParts.length > 1) {
          return boldParts.map((bPart, bIdx) =>
            bIdx % 2 === 1 ? (
              <strong key={bIdx} className="font-semibold text-[#202124]">
                {bPart}
              </strong>
            ) : (
              bPart
            )
          );
        }

        // Italic formatting: *italic*
        const italicRegex = /\*(.*?)\*/g;
        const italicParts = part.split(italicRegex);
        if (italicParts.length > 1) {
          return italicParts.map((iPart, iIdx) =>
            iIdx % 2 === 1 ? (
              <em key={iIdx} className="italic text-[#5F6368]">
                {iPart}
              </em>
            ) : (
              iPart
            )
          );
        }

        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start space-x-2 my-1 pl-1">
            <span className="text-[#4285F4] font-bold text-xs shrink-0">•</span>
            <div className="flex-1 text-xs text-[#3C4043] leading-relaxed">{renderedLine}</div>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="text-xs text-[#3C4043] leading-relaxed my-0.5">
          {renderedLine}
        </p>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-2.5 animate-fade-in">
        <div className="max-w-[85%] bg-[#1A73E8] text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-xs">
          <p className="text-xs leading-relaxed whitespace-pre-wrap">{message.text}</p>
          <span className="block text-[10px] text-white/70 text-right mt-1 font-mono">
            {message.timestamp}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-2.5 my-3 animate-fade-in group">
      {/* Bot Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285F4] to-[#1A73E8] flex items-center justify-center text-white shrink-0 shadow-xs ring-2 ring-white">
        <Bot className="w-4 h-4" />
      </div>

      <div className="max-w-[88%] bg-white border border-[#DADCE0] rounded-2xl rounded-tl-xs p-3.5 shadow-xs transition-shadow hover:shadow-elevation-1">
        {/* Header with Badges */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#F1F3F4]">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-[#202124]">CivicTrack AI</span>
            <span className="text-[10px] bg-[#E8F0FE] text-[#1A73E8] font-medium px-1.5 py-0.2 rounded border border-[#D2E3FC]">
              Municipal Agent
            </span>
          </div>

          {/* Fact vs Recommendation badge */}
          {message.isRecommendation ? (
            <span className="inline-flex items-center space-x-1 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
              <span>AI Recommendation</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-[10px] bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] px-1.5 py-0.5 rounded font-medium">
              <ShieldCheck className="w-2.5 h-2.5 text-[#137333]" />
              <span>Verified Fact</span>
            </span>
          )}
        </div>

        {/* Message Content */}
        <div className="space-y-0.5">{renderFormattedText(message.text)}</div>

        {/* Facts Summary Table if present */}
        {message.facts && message.facts.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-[#F1F3F4] grid grid-cols-2 gap-1.5">
            {message.facts.map((fact, fIdx) => (
              <div key={fIdx} className="bg-[#F8F9FA] border border-[#DADCE0] p-1.5 rounded text-[11px]">
                <span className="text-[#5F6368] block text-[10px] uppercase font-medium">
                  {fact.label}
                </span>
                <span className="text-[#202124] font-bold truncate block">{fact.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-[10px] text-[#5F6368]">
          <span className="font-mono">{message.timestamp}</span>
          <span className="text-[9px] text-[#5F6368]/80">Official Municipal Assistant</span>
        </div>
      </div>
    </div>
  );
};

export default AIMessage;
