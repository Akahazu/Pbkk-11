import './api';

document.addEventListener('alpine:init', () => {
    window.Alpine.data('chatWorkspace', () => ({
        sessionId: null,
        draft: '',
        errorMessage: null,
        isThinking: false,
        isStreaming: false,
        streamingContent: '',
        abortController: null,

        init() {
            this.sessionId = this.$wire.entangle('sessionId');
        },

        scrollToBottom(force = false) {
            this.$nextTick(() => {
                const container = this.$refs.messagesContainer;
                if (!container) return;
                const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
                if (force || distance < 100) {
                    container.scrollTop = container.scrollHeight;
                }
            });
        },

        stopStream() {
            this.abortController?.abort();
            this.abortController = null;
            this.isThinking = false;
            this.isStreaming = false;
        },

        async sendStreamPrompt() {
            if (this.isThinking || this.isStreaming) return;

            const text = (this.draft || '').trim();
            if (!text) return;

            this.draft = '';
            this.$wire.set('prompt', '');
            this.errorMessage = null;

            this.stopStream();
            this.abortController = new AbortController();

            this.isThinking = true;
            this.streamingContent = '';
            this.scrollToBottom(true);

            try {
                const headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                };

                if (window.pbkkApi?.getToken?.()) {
                    headers.Authorization = `Bearer ${window.pbkkApi.getToken()}`;
                }

                const response = await fetch('/api/chat-ai/stream', {
                    method: 'POST',
                    credentials: 'include',
                    headers,
                    body: JSON.stringify({
                        prompt: text,
                        session_id: this.$wire.sessionId ? Number(this.$wire.sessionId) : null
                    }),
                    signal: this.abortController.signal
                });

                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                if (!response.ok) {
                    throw new Error(`AI service unavailable (${response.status})`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let currentEvent = 'message';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    let idx;
                    while ((idx = buffer.indexOf('\n\n')) !== -1) {
                        const frame = buffer.slice(0, idx);
                        buffer = buffer.slice(idx + 2);

                        let data = '';
                        currentEvent = 'message';
                        for (const line of frame.split('\n')) {
                            if (line.startsWith('event:')) currentEvent = line.slice(6).trim();
                            else if (line.startsWith('data:')) data += line.slice(5).trim();
                        }
                        if (!data) continue;

                        let payload;
                        try {
                            payload = JSON.parse(data);
                        } catch {
                            continue;
                        }

                        if (currentEvent === 'start' && payload.session_id) {
                            this.sessionId = payload.session_id;
                            this.$wire.set('sessionId', payload.session_id);
                        } else if (currentEvent === 'chunk') {
                            this.isThinking = false;
                            this.isStreaming = true;
                            this.streamingContent += payload.delta ?? '';
                            this.scrollToBottom();
                        } else if (currentEvent === 'done') {
                            this.isStreaming = false;
                        } else if (currentEvent === 'error') {
                            this.errorMessage = payload.message || 'AI unavailable';
                            this.isStreaming = false;
                        }
                    }
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    this.errorMessage = 'AI unavailable. Please try again.';
                }
            } finally {
                this.abortController = null;
                this.isThinking = false;
                this.isStreaming = false;

                this.$wire.$refresh();
                window.Livewire.dispatch('message-persisted');
                if (this.sessionId) {
                    window.Livewire.dispatch('session-created', { sessionId: Number(this.sessionId) });
                }
            }
        },

        destroy() {
            this.stopStream();
        },
    }));
});
