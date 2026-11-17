import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 my-4">
      <div className="w-8 h-8 rounded-lg bg-blue-900/50 border border-blue-700/50 flex items-center justify-center text-blue-400 flex-shrink-0">
        <ShieldAlert className="w-4 h-4 animate-spin" />
      </div>
      <div className="bg-soc-card border border-soc-border rounded-xl px-4 py-3 flex items-center gap-2">
        <span className="text-xs text-gray-400 font-mono">SOC AI Analyzing</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};
