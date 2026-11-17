import React, { useState, useRef, useEffect } from 'react';
import { Menu, Zap, Shield, AlertTriangle, Terminal } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { TypingIndicator } from '../components/TypingIndicator';
import { useChatStore } from '../store/chat';

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    isSending,
    streamingMode,
    setStreamingMode,
    sendMessage,
  } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const suggestedPrompts = [
    "Ada 5 failed login dari IP 203.0.113.42 dalam 2 menit. Apa yang harus saya lakukan?",
    "Rangkum 5 langkah awal incident response untuk brute-force login.",
    "Jelaskan severity dan mitigasi untuk port scanning.",
    "Bagaimana cara menganalisis malicious PowerShell script?",
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070b14]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-soc-border bg-soc-dark/80 backdrop-blur px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-400 hover:text-gray-200 p-2 rounded-lg bg-soc-card border border-soc-border"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-sm tracking-wide text-gray-200">Incident Response Console</h2>
            </div>
          </div>

          {/* Streaming Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-soc-card border border-soc-border px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-gray-400">Mode:</span>
              <button
                onClick={() => setStreamingMode(true)}
                className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
                  streamingMode ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Stream (SSE)</span>
              </button>
              <button
                onClick={() => setStreamingMode(false)}
                className={`px-2 py-0.5 rounded transition ${
                  !streamingMode ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>Standard (JSON)</span>
              </button>
            </div>
          </div>
        </header>

        {/* Message List or Empty State */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-xl shadow-blue-950">
                <Terminal className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">SOC Analyst AI Assistant</h3>
              <p className="text-sm text-gray-400 mb-8 font-sans">
                Ready to analyze security alerts, investigate threat indicators, and provide incident response guidance using Senopati ITS / LLM core.
              </p>

              <div className="w-full text-left">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">
                  Suggested Incident Prompts
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedPrompts.map((promptText, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(promptText)}
                      className="text-left bg-soc-card hover:bg-gray-900 border border-soc-border hover:border-blue-500/50 p-3.5 rounded-xl transition text-xs text-gray-300 flex items-start gap-3 shadow-lg group"
                    >
                      <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition" />
                      <span className="line-clamp-2">{promptText}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {isSending && isStreaming && messages[messages.length - 1]?.role === 'user' && (
                <TypingIndicator />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input Area */}
        <div className="max-w-4xl w-full mx-auto">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
