import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Shield, User, Cpu, Copy, Check } from 'lucide-react';
import { ChatMessageItem } from '../store/chat';
import { SeverityBadge, detectSeverities } from './SeverityBadge';

interface ChatMessageProps {
  message: ChatMessageItem;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);
  const severities = !isUser ? detectSeverities(message.content) : [];

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 md:gap-4 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
        isUser
          ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
          : 'bg-cyan-950 border-cyan-800/50 text-cyan-400'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 border shadow-lg ${
        isUser
          ? 'bg-blue-600/10 border-blue-500/30 text-gray-100 rounded-tr-none'
          : 'bg-soc-card border-soc-border text-gray-100 rounded-tl-none'
      }`}>
        {/* Header / Badges */}
        {!isUser && severities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-gray-800">
            {severities.map((sev) => (
              <SeverityBadge key={sev} level={sev} />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none text-gray-200 leading-relaxed font-sans">
          {isUser ? (
            <p className="whitespace-pre-wrap m-0">{message.content}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || (message.interrupted ? '*[Response interrupted]*' : '...')}
            </ReactMarkdown>
          )}
        </div>

        {/* Footer info for Assistant */}
        {!isUser && (
          <div className="mt-3 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <div className="flex items-center gap-2">
              {message.model && (
                <span className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  {message.model}
                </span>
              )}
              {message.usage && (
                <span className="bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                  Tokens: {message.usage.total_tokens} (prompt: {message.usage.prompt_tokens}, completion: {message.usage.completion_tokens})
                </span>
              )}
              {message.interrupted && (
                <span className="text-orange-400 bg-orange-950/50 px-2 py-0.5 rounded border border-orange-900">
                  Interrupted
                </span>
              )}
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-gray-200 transition px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800"
              title="Copy content"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
