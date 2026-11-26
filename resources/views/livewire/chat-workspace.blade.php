<div
    class="flex flex-col h-full min-h-0 bg-background"
    wire:key="lw-chat-workspace"
    x-data="chatWorkspace"
    x-init="$watch('sessionId', () => scrollToBottom(true)); scrollToBottom(true)"
>
    <!-- Header bar -->
    <div class="px-4 py-3 border-b border-border bg-background flex items-center justify-between shrink-0">
        <div class="text-sm font-semibold text-foreground">
            <template x-if="sessionId">
                <span x-text="'Session #' + sessionId"></span>
            </template>
            <template x-if="!sessionId">
                <span>Start a New SOC Session</span>
            </template>
        </div>
        <div x-show="isThinking || isStreaming" class="text-xs text-accent-foreground font-medium flex items-center gap-1.5">
            <svg class="animate-spin h-3.5 w-3.5 text-accent-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span x-text="isThinking ? 'AI is thinking...' : 'Streaming response...'"></span>
            <button
                type="button"
                @click="stopStream()"
                class="ml-2 text-[10px] text-red-600 hover:text-red-800 underline font-semibold"
            >
                Stop
            </button>
        </div>
    </div>

    <!-- Messages Container -->
    <div x-ref="messagesContainer" class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        @forelse ($messages as $message)
            <div
                wire:key="msg-{{ $message->id }}"
                class="flex {{ $message->role === 'user' ? 'justify-end' : 'justify-start' }}"
            >
                <div class="inline-block max-w-[80%] rounded-lg px-4 py-2.5 text-sm {{ $message->role === 'user' ? 'bg-accent text-accent-foreground' : 'bg-card text-foreground border border-border' }}">
                    <div class="inline-block text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded {{ $message->role === 'user' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground' }} mb-1 font-semibold">
                        {{ $message->role }}</div>
                    @if ($message->role === 'user')
                        <div class="break-words whitespace-pre-wrap">{{ $message->content }}</div>
                    @else
                        <div class="prose prose-sm max-w-none break-words [&>pre]:bg-card [&>pre]:text-foreground [&>pre]:p-3 [&>pre]:rounded [&>code]:bg-muted [&>code]:px-1 [&>code]:rounded">
                            {!! $this->renderMarkdown($message->content) !!}
                        </div>
                    @endif
                </div>
            </div>
        @empty
            <template x-if="!isThinking && !isStreaming">
                <div class="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Send a prompt to begin an analysis session.
                </div>
            </template>
        @endforelse

        <!-- Streaming assistant bubble and thinking animation -->
        <template x-if="isThinking || isStreaming">
            <div class="flex justify-start">
                <div class="inline-block max-w-[80%] rounded-lg px-4 py-2.5 text-sm bg-card text-foreground border border-border shadow-sm">
                    <div class="inline-block text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground mb-1 font-semibold">
                        assistant
                    </div>
                    <template x-if="isThinking">
                        <div class="flex items-center gap-1.5 py-1">
                            <div class="w-2 h-2 bg-accent-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div class="w-2 h-2 bg-accent-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div class="w-2 h-2 bg-accent-foreground rounded-full animate-bounce"></div>
                        </div>
                    </template>
                    <template x-if="isStreaming">
                        <div class="prose prose-sm max-w-none break-words [&>pre]:bg-card [&>pre]:text-foreground [&>pre]:p-3 [&>pre]:rounded [&>code]:bg-muted [&>code]:px-1 [&>code]:rounded" x-html="window.marked ? window.marked.parse(streamingContent) : streamingContent" x-effect="Prism.highlightAll()"></div>
                        <!-- Typing cursor (Challenge 1) -->
                        <span class="bg-foreground animate-pulse inline-block w-[1px] h-5 mt-1 ml-1">‌</span>
                    </template>
                </div>
            </div>
        </template>
    </div>

    @if ($errorMessage)
        <div class="mx-4 mb-2 px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded shrink-0">
            {{ $errorMessage }}
        </div>
    @endif

    <template x-if="errorMessage">
        <div class="mx-4 mb-2 px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded shrink-0" x-text="errorMessage"></div>
    </template>

    <!-- Chat Form -->
    <form
        x-on:submit.prevent="sendStreamPrompt()"
        class="p-4 border-t border-border flex gap-2 shrink-0"
    >
        <input
            id="chat-prompt-input"
            type="text"
            x-model="draft"
            placeholder="Ask SOC Analyst AI (max 1000 chars)..."
            maxlength="1000"
            class="flex-1 rounded-md border-border bg-input shadow-sm focus:border-ring focus:ring-ring text-sm"
            :disabled="isStreaming || isThinking"
        />
        <button
            type="submit"
            :disabled="isStreaming || isThinking || !(draft || '').trim()"
            class="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
            <span x-show="!isStreaming && !isThinking">Send</span>
            <span x-show="isStreaming || isThinking" class="flex items-center gap-1.5">
                <svg class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Thinking...
            </span>
        </button>
    </form>

    @error('prompt')
        <div class="px-4 pb-3 text-xs text-red-600 shrink-0">{{ $message }}</div>
    @enderror
</div>
