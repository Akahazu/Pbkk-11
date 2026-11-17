import React from 'react';
import { MessageSquarePlus, MessageSquare, Trash2, LogOut, Shield, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useChatStore } from '../store/chat';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const {
    sessions,
    currentSessionId,
    createNewChat,
    selectSession,
    deleteSession,
  } = useChatStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-[#0d1322] border-r border-soc-border flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="p-4 border-b border-soc-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-gray-100 flex items-center gap-1.5">
                SOC ANALYST AI
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h1>
              <p className="text-[11px] text-gray-400 font-mono">Senopati ITS / LLM Core</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              createNewChat();
              setIsOpen(false);
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 text-sm"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>New Incident Chat</span>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[11px] font-mono text-gray-400 px-3 py-1 uppercase tracking-wider">
            Incident Sessions
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-gray-500 text-xs font-mono">
              No active sessions. Start a new chat above.
            </div>
          ) : (
            sessions.map((session) => {
              const active = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    selectSession(session.id);
                    setIsOpen(false);
                  }}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition border ${
                    active
                      ? 'bg-blue-950/50 border-blue-600/40 text-blue-300 font-medium'
                      : 'bg-transparent border-transparent hover:bg-gray-900/60 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-gray-500'}`} />
                    <span className="truncate text-xs">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-gray-500 p-1 transition rounded"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-soc-border bg-[#0a0f1d]/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-gray-900/80 border border-gray-800">
            <div className="truncate mr-2">
              <p className="text-xs font-medium text-gray-200 truncate">{user?.name || 'SOC Analyst'}</p>
              <p className="text-[11px] text-gray-400 font-mono truncate">{user?.email || 'demo@example.com'}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
