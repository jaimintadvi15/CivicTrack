import React from 'react';
import { Bot } from 'lucide-react';

export const AILoading: React.FC = () => {
  return (
    <div className="flex items-start space-x-2.5 my-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-[#E8F0FE] border border-[#D2E3FC] flex items-center justify-center text-[#1A73E8] shrink-0 shadow-xs">
        <Bot className="w-4 h-4 animate-pulse" />
      </div>
      <div className="bg-white border border-[#DADCE0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs">
        <div className="flex items-center space-x-2 text-xs text-[#5F6368]">
          <span className="font-medium text-[#1A73E8]">Analyzing</span>
          <div className="flex space-x-1">
            <span className="w-1.5 h-1.5 bg-[#4285F4] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-[#EA4335] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-[#34A853] rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILoading;
