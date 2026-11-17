import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, AlertCircle } from 'lucide-react';
import { useChatStore } from '../store/chat';

export const ChatInput: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { sendMessage, isSending, isStreaming, stopStreaming } = useChatStore();

  const MAX_CHARS = 1000;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [prompt]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isSending) return;

    if (prompt.length > MAX_CHARS) {
      setValidationError(`Prompt exceeds maximum limit of ${MAX_CHARS} characters.`);
      return;
    }

    setValidationError(null);
    const textToSend = prompt;
    setPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPrompt(val);
    if (val.length > MAX_CHARS) {
      setValidationError(`Prompt exceeds maximum limit of ${MAX_CHARS} characters.`);
    } else {
      setValidationError(null);
    }
  };

  return (
    <div className="border-t border-soc-border bg-soc-dark/90 backdrop-blur p-4">
      {validationError && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-red-400 bg-red-950/40 border border-red-900/50 px-3 py-1.5 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-soc-card border border-soc-border rounded-xl p-2 focus-within:border-blue-500 transition shadow-lg">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask SOC Analyst AI about logs, threats, incident response... (Shift+Enter for new line)"
          rows={1}
          maxLength={1200}
          className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none resize-none max-h-36 py-1.5 px-2 font-sans"
        />

        <div className="flex items-center gap-2 pb-1 pr-1">
          <span className={`text-[11px] font-mono ${prompt.length > MAX_CHARS ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
            {prompt.length}/{MAX_CHARS}
          </span>

          {isSending && isStreaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 p-2 rounded-lg transition flex items-center justify-center"
              title="Stop generation"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!prompt.trim() || prompt.length > MAX_CHARS || isSending}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white p-2 rounded-lg transition flex items-center justify-center shadow"
              title="Send prompt"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
      <div className="flex items-center justify-between mt-1 px-1 text-[11px] text-gray-500 font-mono">
        <span>Security Operations Center v1.0 • AI-Assisted Threat Analysis</span>
        <span>Press Enter to send, Shift+Enter for newline</span>
      </div>
    </div>
  );
};
