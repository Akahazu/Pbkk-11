<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatAiRequest;
use App\Http\Resources\ChatAiResponseResource;
use App\Models\AiLog;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Services\SenopatiService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class ChatAiController extends Controller
{
    public function __invoke(ChatAiRequest $request, SenopatiService $senopati)
    {
        $user = $request->user();
        $prompt = $request->string('prompt')->toString();

        // Resolve / create session
        if ($request->filled('session_id')) {
            $session = ChatSession::findOrFail($request->integer('session_id'));
            abort_unless((int) $session->user_id === (int) $user->id, 403, 'Forbidden session');
        } else {
            $session = ChatSession::create([
                'user_id' => $user->id,
                'title' => Str::limit($prompt, 50),
            ]);
        }

        // Persist user message
        ChatMessage::create([
            'chat_session_id' => $session->id,
            'role' => 'user',
            'content' => $prompt,
        ]);

        // Build history
        $history = $session->messages()
            ->orderBy('id')
            ->get(['role', 'content'])
            ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])
            ->all();

        if (count($history) > 40) {
            Log::warning('Chat history exceeds 40 messages', [
                'session_id' => $session->id,
                'count' => count($history),
            ]);
        }

        // Call Senopati
        try {
            $reply = $senopati->chat($history);
        } catch (RuntimeException $e) {
            Log::error('Senopati failure', [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'AI service unavailable'], 502);
        }

        // Persist assistant message
        $assistantMessage = ChatMessage::create([
            'chat_session_id' => $session->id,
            'role' => 'assistant',
            'content' => $reply['content'],
        ]);

        // Persist ai_logs
        AiLog::create([
            'user_id' => $user->id,
            'chat_session_id' => $session->id,
            'prompt' => $prompt,
            'ai_answer' => $reply['content'],
            'model' => $reply['model'],
            'prompt_tokens' => $reply['usage']['prompt_tokens'],
            'completion_tokens' => $reply['usage']['completion_tokens'],
            'total_tokens' => $reply['usage']['total_tokens'],
        ]);

        return ChatAiResponseResource::make([
            'session_id' => $session->id,
            'message' => $assistantMessage,
            'model' => $reply['model'],
            'usage' => $reply['usage'],
        ]);
    }
}
