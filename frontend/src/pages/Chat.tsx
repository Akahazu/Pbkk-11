import React, { useState, useRef, useEffect } from 'react';
import { Menu, Zap, Shield, AlertTriangle, Terminal, Code } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { TypingIndicator } from '../components/TypingIndicator';
import { useChatStore } from '../store/chat';

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const {
    messages,
    isStreaming,
    isSending,
    streamingMode,
    setStreamingMode,
    sendMessage,
    rawStreamLogs,
    showRawLogs,
    setShowRawLogs,
    clearRawLogs,
  } = useChatStore();

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setIsAtBottom(distanceToBottom <= 40);
  };

  useEffect(() => {
    if (isAtBottom && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isSending, isAtBottom]);

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

          {/* Controls */}
          <div className="flex items-center gap-3">
            {import.meta.env.DEV && (
              <button
                onClick={() => setShowRawLogs(!showRawLogs)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition ${
                  showRawLogs ? 'bg-cyan-950 border-cyan-800 text-cyan-300' : 'bg-soc-card border-soc-border text-gray-400 hover:text-gray-200'
                }`}
                title="Toggle Raw Stream Log"
              >
                <Code className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Raw Log</span>
              </button>
            )}

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

        {/* Dev Raw Stream Logs Drawer */}
        {import.meta.env.DEV && showRawLogs && (
          <div className="bg-gray-950 border-b border-cyan-900/50 p-3 max-h-40 overflow-y-auto font-mono text-[11px] text-cyan-400 flex-shrink-0">
            <div className="flex items-center justify-between mb-1 pb-1 border-b border-cyan-900/30">
              <span className="font-bold uppercase tracking-wider">Raw Stream Logs ({rawStreamLogs.length})</span>
              <button
                onClick={clearRawLogs}
                className="text-gray-400 hover:text-red-400 text-[10px] underline"
              >
                Clear Logs
              </button>
            </div>
            {rawStreamLogs.length === 0 ? (
              <div className="text-gray-500 italic">No raw chunks received yet. Send a prompt in streaming mode.</div>
            ) : (
              rawStreamLogs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap break-all py-0.5 border-b border-gray-900/50">{log}</div>
              ))
            )}
          </div>
        )}

        {/* Message List or Empty State */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-6"
        >
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
