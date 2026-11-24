<div class="flex flex-col h-full min-h-0">
    <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div class="text-sm font-semibold text-gray-800">
            @if ($sessionId)
                Session #{{ $sessionId }}
            @else
                Start a New SOC Session
            @endif
        </div>
        <div wire:loading wire:target="sendPrompt" class="text-xs text-indigo-600 font-medium">
            Analyzing with AI...
        </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        @forelse ($messages as $message)
            <div
                wire:key="msg-{{ $message->id }}"
                class="flex {{ $message->role === 'user' ? 'justify-end' : 'justify-start' }}"
            >
                <div class="inline-block max-w-[80%] rounded-lg px-4 py-2.5 text-sm {{ $message->role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900 border border-gray-200' }}">
                    <div class="inline-block text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded {{ $message->role === 'user' ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-200 text-gray-700' }} mb-1 font-semibold">
                        {{ $message->role }}
                    </div>
                    @if ($message->role === 'user')
                        <div class="break-words whitespace-pre-wrap">{{ $message->content }}</div>
                    @else
                        <div class="prose prose-sm max-w-none break-words [&>pre]:bg-gray-800 [&>pre]:text-gray-100 [&>pre]:p-3 [&>pre]:rounded [&>code]:bg-gray-200 [&>code]:px-1 [&>code]:rounded">
                            {!! $this->renderMarkdown($message->content) !!}
                        </div>
                    @endif
                </div>
            </div>
        @empty
            <div class="h-full flex items-center justify-center text-sm text-gray-400">
                Send a prompt to begin an analysis session.
            </div>
        @endforelse
    </div>

    @if ($errorMessage)
        <div class="mx-4 mb-2 px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded shrink-0">
            {{ $errorMessage }}
        </div>
    @endif

    <form wire:submit="sendPrompt" class="p-4 border-t border-gray-200 flex gap-2 shrink-0">
        <input
            type="text"
            wire:model="prompt"
            placeholder="Ask SOC Analyst AI (max 1000 chars)..."
            maxlength="1000"
            class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
        />
        <button
            type="submit"
            wire:loading.attr="disabled"
            wire:target="sendPrompt"
            class="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <span wire:loading.remove wire:target="sendPrompt">Send</span>
            <span wire:loading wire:target="sendPrompt">Thinking...</span>
        </button>
    </form>

    @error('prompt')
        <div class="px-4 pb-3 text-xs text-red-600 shrink-0">{{ $message }}</div>
    @enderror
</div>
