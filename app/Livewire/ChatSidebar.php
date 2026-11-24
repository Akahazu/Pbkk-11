<?php

namespace App\Livewire;

use App\Models\ChatSession;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\On;
use Livewire\Component;

class ChatSidebar extends Component
{
    public ?int $activeSessionId = null;

    #[On('session-selected')]
    public function onSessionSelected(int $sessionId): void
    {
        $this->activeSessionId = $sessionId;
    }

    #[On('session-created')]
    public function onSessionCreated(int $sessionId): void
    {
        $this->activeSessionId = $sessionId;
    }

    #[On('message-persisted')]
    public function refreshSessions(): void
    {
        // Triggers re-render so updated_at / titles stay fresh.
    }

    public function selectSession(int $sessionId): void
    {
        $session = ChatSession::where('user_id', Auth::id())->findOrFail($sessionId);
        $this->activeSessionId = $session->id;

        $this->dispatch('session-selected', sessionId: $session->id);
    }

    public function createNewSession(): void
    {
        $session = ChatSession::create([
            'user_id' => Auth::id(),
            'title' => 'New SOC Investigation',
        ]);

        $this->activeSessionId = $session->id;
        $this->dispatch('session-created', sessionId: $session->id);
    }

    public function render(): View
    {
        $sessions = ChatSession::where('user_id', Auth::id())
            ->latest('updated_at')
            ->get(['id', 'title', 'updated_at']);

        return view('livewire.chat-sidebar', [
            'sessions' => $sessions,
        ]);
    }
}
