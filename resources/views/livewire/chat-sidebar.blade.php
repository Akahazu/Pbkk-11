<div class="p-4 flex flex-col h-full">
    <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">Sessions</h3>
        <button
            type="button"
            wire:click="createNewSession"
            wire:loading.attr="disabled"
            wire:target="createNewSession"
            class="px-3 py-1.5 text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
            + New Chat
        </button>
    </div>

    <div class="space-y-2 overflow-y-auto flex-1">
        @forelse ($sessions as $session)
            <button
                type="button"
                wire:key="session-{{ $session->id }}"
                wire:click="selectSession({{ $session->id }})"
                class="w-full text-left px-3 py-2.5 rounded-md border transition {{ $activeSessionId === $session->id ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100' }}"
            >
                <div class="text-sm font-medium truncate">{{ $session->title }}</div>
                <div class="text-[11px] text-gray-400 mt-0.5">{{ $session->updated_at?->diffForHumans() }}</div>
            </button>
        @empty
            <p class="text-xs text-gray-400 text-center py-8">No chat sessions yet.</p>
        @endforelse
    </div>
</div>
