<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Services\SenopatiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class TanyaAiController extends Controller
{
    public function __invoke(Request $request, SenopatiService $senopati)
    {
        $validated = $request->validate([
            'message'    => 'required|string|max:4000',
            'session_id' => 'nullable|integer|exists:chat_sessions,id',
        ]);

        $message = $validated['message'];
        $sessionId = $validated['session_id'] ?? null;

        if ($sessionId === null) {
            $session = ChatSession::create([
                'user_id' => $request->user()->id,
                'title'   => Str::limit($message, 50),
            ]);
        } else {
            $session = ChatSession::findOrFail($sessionId);
            if ((int) $session->user_id !== (int) $request->user()->id) {
                abort(403);
            }
        }

        ChatMessage::create([
            'chat_session_id' => $session->id,
            'role'            => 'user',
            'content'         => $message,
        ]);

        $messagesQuery = $session->messages()->orderBy('id')->get();
        if ($messagesQuery->count() > 40) {
            Log::warning('Chat session message count exceeds 40', [
                'session_id' => $session->id,
                'count'      => $messagesQuery->count(),
            ]);
        }

        $history = $messagesQuery->map(fn ($m) => [
            'role'    => $m->role,
            'content' => $m->content,
        ])->all();

        try {
            $reply = $senopati->chat($history);
        } catch (RuntimeException $e) {
            Log::error('Senopati AI request failed: ' . $e->getMessage(), [
                'session_id' => $session->id,
            ]);
            return response()->json([
                'message' => 'AI service unavailable',
            ], 502);
        }

        ChatMessage::create([
            'chat_session_id' => $session->id,
            'role'            => 'assistant',
            'content'         => $reply['content'],
        ]);

        return response()->json([
            'data' => [
                'session_id' => $session->id,
                'message'    => [
                    'role'    => 'assistant',
                    'content' => $reply['content'],
                ],
            ],
        ]);
    }
}
