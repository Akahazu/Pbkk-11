import { create } from 'zustand';
import { apiClient } from '../api/client';
import { parseSSEStream } from '../lib/sse';

export interface ChatMessageItem {
  id: string | number;
  chat_session_id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  interrupted?: boolean;
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
  streamingMode: boolean; // true = SSE, false = JSON
  activeAbortController: AbortController | null;

  setStreamingMode: (mode: boolean) => void;
  createNewChat: () => void;
  selectSession: (sessionId: number) => void;
  loadSessions: () => void;
  sendMessage: (prompt: string) => Promise<void>;
  stopStreaming: () => void;
  deleteSession: (sessionId: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  // Load sessions from localStorage
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
    activeAbortController: null,

    setStreamingMode: (mode) => set({ streamingMode: mode }),

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
        created_at: new Date().toISOString(),
      };

      set({ messages: [...newMessages, assistantMsg] });

      const controller = new AbortController();
      set({ activeAbortController: controller });

      try {
        if (streamingMode) {
          set({ isStreaming: true });
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/chat-ai/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
              'Authorization': `Bearer ${localStorage.getItem('soc_token') || sessionStorage.getItem('soc_token') || ''}`,
            },
            body: JSON.stringify({
              prompt,
              session_id: currentSessionId || undefined,
            }),
            signal: controller.signal,
          });

          if (res.status === 401) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
            throw new Error('Unauthenticated');
          }

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Stream request failed');
          }

          let activeSessionId = currentSessionId;
          let accumulatedContent = '';
          let usageData = undefined;
          let modelName = undefined;

          await parseSSEStream(
            res,
            (msg) => {
              if (msg.event === 'start') {
                try {
                  const data = JSON.parse(msg.data);
                  if (data.session_id && !activeSessionId) {
                    activeSessionId = data.session_id;
                    set({ currentSessionId: activeSessionId });
                  }
                } catch (e) {
                  console.error('Failed to parse start event', e);
                }
              } else if (msg.event === 'chunk') {
                accumulatedContent += msg.data;
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                  ),
                }));
              } else if (msg.event === 'done') {
                try {
                  const data = JSON.parse(msg.data);
                  usageData = data.usage;
                  modelName = data.model;
                  if (data.session_id && !activeSessionId) {
                    activeSessionId = data.session_id;
                    set({ currentSessionId: activeSessionId });
                  }
                } catch (e) {
                  // might just be string or json
                }
              }
            },
            controller.signal
          );

          // Finalize assistant message
          const finalMessages = get().messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: accumulatedContent || m.content, usage: usageData, model: modelName }
              : m
          );

          set({ messages: finalMessages, isStreaming: false, isSending: false, activeAbortController: null });

          // Save session & messages
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
        if (err.name === 'AbortError') {
          // User aborted stream
          const finalMessages = get().messages.map((m) =>
            m.id === assistantMsgId ? { ...m, interrupted: true } : m
          );
          set({ messages: finalMessages, isStreaming: false, isSending: false, activeAbortController: null });
          if (currentSessionId) {
            saveMessages(currentSessionId, finalMessages);
          }
          return;
        }

        console.error('Chat error:', err);
        const errorMsg = err.message || 'Failed to send message';
        const finalMessages = get().messages.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: `⚠️ **Error:** ${errorMsg}` }
            : m
        );
        set({ messages: finalMessages, isStreaming: false, isSending: false, activeAbortController: null });
      }
    },
  };
});
