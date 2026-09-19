import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AIMessage as AIMessageType } from '../../types/ai';
import {
  sendChatMessage,
  getAuthorizedComplaints,
  toComplaintContext,
  calculateMunicipalStats,
} from '../../services/aiService';
import { AIMessage } from './AIMessage';
import { AILoading } from './AILoading';
import { AISuggestions } from './AISuggestions';
import {
  Send,
  Mic,
  MicOff,
  RotateCcw,
  Bot,
  AlertCircle,
  Shield,
  Sparkles,
} from 'lucide-react';

interface AIChatProps {
  onSelectTicket?: (ticketNumber: string) => void;
  initialQuery?: string;
  activeTicketNumber?: string;
}

export const AIChat: React.FC<AIChatProps> = ({
  onSelectTicket,
  initialQuery,
  activeTicketNumber,
}) => {
  const { role, issues, session, currentUser } = useApp();

  const [messages, setMessages] = useState<AIMessageType[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle initial query if passed (e.g. from a button click)
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  // Web Speech API for voice input
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech recognition error:', err);
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    // Reset input
    setInputText('');
    setErrorMessage(null);

    const userMsg: AIMessageType = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 1. Filter complaints strictly based on user authorization
      const authorized = getAuthorizedComplaints(issues, role, session);
      const authorizedContexts = authorized.map(toComplaintContext);
      const stats = calculateMunicipalStats(issues);

      // 2. Build AI Request payload with session context
      const requestPayload = {
        message: query,
        history: messages.slice(-6).map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
        userRole: role,
        userName: session?.name || currentUser.name || 'Citizen',
        userId: session?.userId || 'user-default',
        authorizedIssues: authorizedContexts,
        summaryStats: stats,
        activeTicketNumber,
      };

      // 3. Invoke AI Service
      const response = await sendChatMessage(requestPayload, issues);

      const aiMsg: AIMessageType = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
        referencedTickets: response.referencedTickets,
        suggestions: response.suggestions,
        facts: response.facts,
        isRecommendation: response.isRecommendation,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI chat error:', err);
      setErrorMessage(
        'CivicTrack AI is temporarily unavailable. You can continue using CivicTrack normally.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setErrorMessage(null);
  };

  // Get dynamic suggestions from last AI message or defaults
  const latestSuggestions =
    messages.length > 0 && messages[messages.length - 1].sender === 'assistant'
      ? messages[messages.length - 1].suggestions
      : undefined;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {/* Welcome greeting if empty */}
        {messages.length === 0 && (
          <div className="py-6 px-3 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4285F4] to-[#1A73E8] text-white flex items-center justify-center mx-auto shadow-elevation-2">
              <Bot className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#202124]">Hello, {session?.name || currentUser.name}!</h3>
              <p className="text-xs text-[#5F6368] mt-1 max-w-xs mx-auto leading-relaxed">
                I am <span className="font-semibold text-[#1A73E8]">CivicTrack AI</span>, your intelligent municipal assistant. Ask me about your complaints, live SLA deadlines, or how to report an issue.
              </p>
            </div>

            {/* Security Badge */}
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#E8F0FE] text-[#1A73E8] rounded-full text-[11px] font-medium border border-[#D2E3FC]">
              <Shield className="w-3.5 h-3.5 text-[#4285F4]" />
              <span>
                {role === 'citizen'
                  ? 'Authorized: Your Personal Complaints Only'
                  : 'Authorized: Municipal Administrative Scope'}
              </span>
            </div>

            <AISuggestions
              userRole={role}
              onSelectSuggestion={(s) => handleSend(s)}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Render Message List */}
        {messages.map((msg) => (
          <AIMessage
            key={msg.id}
            message={msg}
            onSelectTicket={onSelectTicket}
          />
        ))}

        {/* Loading Indicator */}
        {isLoading && <AILoading />}

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2 my-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Inline Suggestion Chips after last message */}
        {messages.length > 0 && !isLoading && (
          <AISuggestions
            userRole={role}
            suggestions={latestSuggestions}
            onSelectSuggestion={(s) => handleSend(s)}
            disabled={isLoading}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input & Toolbar */}
      <div className="p-3 bg-white border-t border-[#DADCE0] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          {/* Reset / Clear conversation */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              title="Reset conversation"
              className="p-2 text-[#5F6368] hover:text-[#202124] hover:bg-gray-100 rounded-full transition-colors shrink-0"
              aria-label="Clear chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Input field */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask CivicTrack AI..."
              disabled={isLoading}
              className="w-full bg-[#F1F3F4] hover:bg-[#E8EAED] focus:bg-white text-xs sm:text-sm text-[#202124] placeholder:text-[#5F6368] pl-3.5 pr-10 py-2.5 rounded-full border border-transparent focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] focus:outline-none transition-all"
              aria-label="Ask CivicTrack AI"
            />

            {/* Voice Input Microphone Button */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-[#5F6368] hover:text-[#4285F4] hover:bg-white'
              }`}
              title={isRecording ? 'Listening... click to stop' : 'Voice input'}
              aria-label="Toggle voice input"
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 bg-[#1A73E8] hover:bg-[#1557B0] disabled:bg-[#DADCE0] text-white disabled:text-[#80868B] rounded-full transition-all shadow-xs hover:shadow-elevation-1 disabled:cursor-not-allowed shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#5F6368] px-1">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 text-[#4285F4]" />
            <span>CivicTrack AI • Read-Only Municipal Assistant</span>
          </span>
          <span>Verified Data Only</span>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
