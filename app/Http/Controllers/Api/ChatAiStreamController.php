<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatAiRequest;
use App\Models\AiLog;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Services\LlmService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChatAiStreamController extends Controller
{
    public function __invoke(ChatAiRequest $request, LlmService $llm)
    {
        $user = $request->user();
        $prompt = $request->string('prompt')->toString();

        $session = $request->filled('session_id')
            ? $user->chatSessions()->findOrFail($request->integer('session_id'))
            : $user->chatSessions()->create(['title' => Str::limit($prompt, 50)]);

        ChatMessage::create([
            'chat_session_id' => $session->id,
            'role' => 'user',
            'content' => $prompt,
        ]);

        $history = $session->messages()->orderBy('id')->get(['role', 'content'])
            ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])->all();

        $systemPrompt = config('services.senopati.system_prompt');
        if (! empty($systemPrompt)) {
            array_unshift($history, ['role' => 'system', 'content' => $systemPrompt]);
        }

        $full = '';
        $sessionId = $session->id;
        $userId = $user->id;
        $promptRef = $prompt;

        return response()->stream(function () use ($llm, $history, $sessionId, $userId, $promptRef, &$full) {
            echo "event: start\n";
            echo 'data: '.json_encode(['session_id' => $sessionId])."\n\n";
            @ob_flush();
            flush();

            try {
                foreach ($llm->chatStream($history) as $chunk) {
                    $full .= $chunk;
                    echo "event: chunk\n";
                    echo 'data: '.json_encode(['delta' => $chunk])."\n\n";
                    @ob_flush();
                    flush();
                }
            } catch (\Throwable $e) {
                Log::error('Stream failure', ['session_id' => $sessionId, 'error' => $e->getMessage()]);
                echo "event: error\n";
                echo 'data: '.json_encode(['message' => 'AI service unavailable'])."\n\n";
                @ob_flush();
                flush();

                return;
            }

            ChatMessage::create([
                'chat_session_id' => $sessionId,
                'role' => 'assistant',
                'content' => $full,
            ]);

            AiLog::create([
                'user_id' => $userId,
                'chat_session_id' => $sessionId,
                'prompt' => $promptRef,
                'ai_answer' => $full,
                'model' => config('services.senopati.model'),
                'prompt_tokens' => null,
                'completion_tokens' => null,
                'total_tokens' => null,
            ]);

            echo "event: done\n";
            echo 'data: '.json_encode(['session_id' => $sessionId])."\n\n";
            @ob_flush();
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection' => 'keep-alive',
        ]);
    }
}
