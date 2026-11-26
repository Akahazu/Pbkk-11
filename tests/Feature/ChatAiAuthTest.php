<?php

namespace Tests\Feature;

use App\Models\ChatSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatAiAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_ai_requires_valid_sanctum_token(): void
    {
        $this->postJson('/api/chat-ai', ['prompt' => 'x'])->assertStatus(401);
    }

    public function test_chat_ai_rejects_revoked_token(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('t')->plainTextToken;
        $user->tokens()->delete();
        $this->withToken($token)->postJson('/api/chat-ai', ['prompt' => 'x'])->assertStatus(401);
    }

    public function test_chat_ai_accepts_fresh_token_and_scopes_session(): void
    {
        $this->mock(\App\Services\LlmService::class, function ($mock) {
            $mock->shouldReceive('chat')->once()->andReturn([
                'content' => 'mocked',
                'model' => 'test',
                'usage' => ['prompt_tokens' => 1, 'completion_tokens' => 1, 'total_tokens' => 2],
            ]);
        });

        $user  = User::factory()->create();
        $token = $user->createToken('t')->plainTextToken;
        $this->withToken($token)->postJson('/api/chat-ai', ['prompt' => 'hello'])
            ->assertOk();
    }

    public function test_session_id_must_belong_to_user(): void
    {
        $u1 = User::factory()->create();
        $u2 = User::factory()->create();
        $s  = $u2->chatSessions()->create(['title' => 'other']);
        $this->withToken($u1->createToken('t')->plainTextToken)
            ->postJson('/api/chat-ai', ['prompt' => 'x', 'session_id' => $s->id])
            ->assertNotFound();
    }
}
