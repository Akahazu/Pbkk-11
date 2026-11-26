<?php

namespace App\Livewire;

use App\Models\AiLog;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Services\LlmService;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use League\CommonMark\CommonMarkConverter;
use Livewire\Attributes\On;
use Livewire\Component;

class ChatWorkspace extends Component
{
    public ?int $sessionId = null;

    public string $prompt = '';

    public ?string $errorMessage = null;

    public bool $isThinking = false;

    public function mount(): void
    {
        $latest = ChatSession::where('user_id', Auth::id())
            ->latest('updated_at')
            ->first();

        if ($latest) {
            $this->sessionId = $latest->id;
            $this->dispatch('session-selected', sessionId: $latest->id);
        }
    }

    #[On('session-selected')]
    public function loadSession(int $sessionId): void
    {
        $session = ChatSession::where('user_id', Auth::id())->findOrFail($sessionId);
        $this->sessionId = $session->id;
        $this->errorMessage = null;
    }

    public function sendPrompt(LlmService $llm): void
    {
        $this->errorMessage = null;

        $this->prompt = trim($this->prompt);

        $validated = $this->validate([
            'prompt' => ['required', 'string', 'max:1000'],
        ]);

        $text = $validated['prompt'];
        $userId = (int) Auth::id();

        if ($this->sessionId !== null) {
            $session = ChatSession::where('user_id', $userId)->findOrFail($this->sessionId);
        } else {
            $session = ChatSession::create([
                'user_id' => $userId,
                'title' => Str::limit($text, 50),
            ]);
            $this->sessionId = $session->id;
            $this->dispatch('session-created', sessionId: $session->id);
        }

        if ($session->title === 'New SOC Investigation') {
            $session->update(['title' => Str::limit($text, 50)]);
        }

        ChatMessage::create([
            'chat_session_id' => $session->id,
            'role' => 'user',
            'content' => $text,
        ]);

        // Immediately clear input box for UI responsiveness
        $this->prompt = '';

        $history = $session->messages()
            ->orderBy('id')
            ->get(['role', 'content'])
            ->map(fn (ChatMessage $m): array => ['role' => $m->role, 'content' => $m->content])
            ->all();

        $systemPrompt = config('services.senopati.system_prompt');
        if (! empty($systemPrompt)) {
            array_unshift($history, ['role' => 'system', 'content' => $systemPrompt]);
        }

        try {
            $reply = $llm->chat($history);
        } catch (\Throwable $e) {
            Log::error('Livewire LLM chat failure', [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
            ]);

            $this->errorMessage = 'AI service unavailable. Please try again.';
            $this->dispatch('message-persisted');

            return;
        }

        ChatMessage::create([
            'chat_session_id' => $session->id,
            'role' => 'assistant',
            'content' => $reply['content'],
        ]);

        AiLog::create([
            'user_id' => $userId,
            'chat_session_id' => $session->id,
            'prompt' => $text,
            'ai_answer' => $reply['content'],
            'model' => $reply['model'],
            'prompt_tokens' => $reply['usage']['prompt_tokens'] ?? null,
            'completion_tokens' => $reply['usage']['completion_tokens'] ?? null,
            'total_tokens' => $reply['usage']['total_tokens'] ?? null,
        ]);

        $session->touch();
        $this->dispatch('message-persisted');
    }

    public function renderMarkdown(string $content): string
    {
        $converter = new CommonMarkConverter([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
        ]);

        return (string) $converter->convert($content);
    }

    public function render(): View
    {
        $messages = collect();

        if ($this->sessionId !== null) {
            $session = ChatSession::where('user_id', Auth::id())->find($this->sessionId);
            if ($session) {
                $messages = $session->messages()->orderBy('id')->get();
            }
        }

        return view('livewire.chat-workspace', [
            'messages' => $messages,
        ]);
    }
}
