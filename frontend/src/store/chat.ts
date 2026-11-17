import { create } from 'zustand';
import { apiClient } from '../api/client';
import { streamChatDeltas } from '../lib/sse';

export interface ChatMessageItem {
  id: string | number;
  chat_session_id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  status?: 'streaming' | 'done' | 'interrupted';
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

export interface ChatSession {
  id: number;
  title: string;
  updated_at: number;
}

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: number | null;
  messages: ChatMessageItem[];
  isStreaming: boolean;
  isSending: boolean;
  streamingMode: boolean;
  rawStreamLogs: string[];
  showRawLogs: boolean;
  activeAbortController: AbortController | null;

  setStreamingMode: (mode: boolean) => void;
  setShowRawLogs: (show: boolean) => void;
  clearRawLogs: () => void;
  createNewChat: () => void;
  selectSession: (sessionId: number) => void;
  loadSessions: () => void;
  sendMessage: (prompt: string) => Promise<void>;
  stopStreaming: () => void;
  deleteSession: (sessionId: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  const loadStoredSessions = (): ChatSession[] => {
    try {
      const stored = localStorage.getItem('soc_chat_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveSessions = (sessions: ChatSession[]) => {
    localStorage.setItem('soc_chat_sessions', JSON.stringify(sessions));
  };

  const loadStoredMessages = (sessionId: number): ChatMessageItem[] => {
    try {
      const stored = localStorage.getItem(`soc_chat_messages_${sessionId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveMessages = (sessionId: number, messages: ChatMessageItem[]) => {
    localStorage.setItem(`soc_chat_messages_${sessionId}`, JSON.stringify(messages));
  };

  const sessions = loadStoredSessions();
  const currentSessionId = sessions.length > 0 ? sessions[0].id : null;
  const messages = currentSessionId ? loadStoredMessages(currentSessionId) : [];

  return {
    sessions,
    currentSessionId,
    messages,
    isStreaming: false,
    isSending: false,
    streamingMode: true,
    rawStreamLogs: [],
    showRawLogs: false,
    activeAbortController: null,

    setStreamingMode: (mode) => set({ streamingMode: mode }),
    setShowRawLogs: (show) => set({ showRawLogs: show }),
    clearRawLogs: () => set({ rawStreamLogs: [] }),

    createNewChat: () => {
      set({
        currentSessionId: null,
        messages: [],
        isStreaming: false,
        isSending: false,
      });
    },

    selectSession: (sessionId) => {
      const msgs = loadStoredMessages(sessionId);
      set({
        currentSessionId: sessionId,
        messages: msgs,
        isStreaming: false,
        isSending: false,
      });
    },

    loadSessions: () => {
      const s = loadStoredSessions();
      set({ sessions: s });
    },

    stopStreaming: () => {
      const { activeAbortController } = get();
      if (activeAbortController) {
        activeAbortController.abort();
      }
      set({ isStreaming: false, isSending: false, activeAbortController: null });
    },

    deleteSession: (sessionId) => {
      const { sessions, currentSessionId } = get();
      const updated = sessions.filter(s => s.id !== sessionId);
      saveSessions(updated);
      localStorage.removeItem(`soc_chat_messages_${sessionId}`);

      if (currentSessionId === sessionId) {
        const nextSession = updated.length > 0 ? updated[0].id : null;
        set({
          sessions: updated,
          currentSessionId: nextSession,
          messages: nextSession ? loadStoredMessages(nextSession) : [],
        });
      } else {
        set({ sessions: updated });
      }
    },

    sendMessage: async (prompt: string) => {
      const { currentSessionId, streamingMode, sessions, messages } = get();

      if (!prompt.trim() || get().isSending) return;

      const userMsg: ChatMessageItem = {
        id: 'user_' + Date.now(),
        role: 'user',
        content: prompt,
        created_at: new Date().toISOString(),
      };

      const newMessages = [...messages, userMsg];
      set({ messages: newMessages, isSending: true });

      const assistantMsgId = 'assistant_' + Date.now();
      const assistantMsg: ChatMessageItem = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        status: streamingMode ? 'streaming' : 'done',
        created_at: new Date().toISOString(),
      };

      set({ messages: [...newMessages, assistantMsg] });

      const controller = new AbortController();
      set({ activeAbortController: controller });

      try {
        if (streamingMode) {
          set({ isStreaming: true });

          let accumulatedContent = '';
          let rafId: number | null = null;
          let pendingDelta = '';

          const flushDelta = () => {
            if (!pendingDelta) return;
            accumulatedContent += pendingDelta;
            pendingDelta = '';
            set((state) => ({
              messages: state.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
              ),
            }));
          };

          const url = `${import.meta.env.VITE_API_BASE_URL || ''}/api/chat-ai/stream`;
          const token = localStorage.getItem('soc_token') || sessionStorage.getItem('soc_token') || '';

          await streamChatDeltas(
            url,
            token,
            {
              prompt,
              session_id: currentSessionId || undefined,
            },
            {
              onDelta: (text) => {
                pendingDelta += text;
                if (!rafId) {
                  rafId = requestAnimationFrame(() => {
                    flushDelta();
                    rafId = null;
                  });
                }
              },
              onRawChunk: (chunk) => {
                if (import.meta.env.DEV) {
                  const timestamp = new Date().toISOString();
                  set((state) => ({
                    rawStreamLogs: [`[${timestamp}] RAW: ${chunk}`, ...state.rawStreamLogs.slice(0, 99)]
                  }));
                }
              },
              onDone: () => {
                if (rafId) cancelAnimationFrame(rafId);
                flushDelta();

                const finalMessages = get().messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, status: 'done' as const } : m
                );
                set({ messages: finalMessages, isStreaming: false, isSending: false, activeAbortController: null });

                if (currentSessionId) {
                  saveMessages(currentSessionId, finalMessages);
                }
              },
              onError: (err) => {
                if (rafId) cancelAnimationFrame(rafId);
                if (err.message === 'Unauthenticated' || (err as any).status === 401) {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/login';
                  return;
                }

                console.error('SSE Stream error:', err);
                const finalMessages = get().messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + `\n\n⚠️ **Error:** ${err.message}`, status: 'interrupted' as const }
                    : m
                );
                set({ messages: finalMessages, isStreaming: false, isSending: false, activeAbortController: null });
              },
              signal: controller.signal,
            }
          );

        } else {
          // Non-streaming JSON request
          const data = await apiClient('/api/chat-ai', {
            method: 'POST',
            body: JSON.stringify({
              prompt,
              session_id: currentSessionId || undefined,
            }),
          });

          const resData = data.data;
          const activeSessionId = resData.session_id;
          if (!currentSessionId && activeSessionId) {
            set({ currentSessionId: activeSessionId });
          }

          const msgContent = resData.message?.content || 'No response';
          const finalMessages = get().messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: msgContent,
                  status: 'done' as const,
                  usage: resData.usage,
                  model: resData.model,
                }
              : m
          );

          set({ messages: finalMessages, isSending: false, activeAbortController: null });

          if (activeSessionId) {
            let updatedSessions = [...sessions];
            const existingIdx = updatedSessions.findIndex((s) => s.id === activeSessionId);
            const title = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
            if (existingIdx >= 0) {
              updatedSessions[existingIdx].updated_at = Date.now();
            } else {
              updatedSessions.unshift({ id: activeSessionId, title, updated_at: Date.now() });
            }
            saveSessions(updatedSessions);
            saveMessages(activeSessionId, finalMessages);
            set({ sessions: updatedSessions });
          }
        }
      } catch (err: any) {
        console.error('Chat error:', err);
        const finalMessages = get().messages.map((m) =>
          m.id === assistantMsgId
            ? { ...m, status: 'interrupted' as const }
            : m
        );
        set({ messages: finalMessages, isStreaming: false, isSending: false, activeAbortController: null });
      }
    },
  };
});
