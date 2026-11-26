<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatAiFrontendContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_token_is_accepted_by_chat_endpoint(): void
    {
        $this->mock(\App\Services\LlmService::class, function ($mock) {
            $mock->shouldReceive('chat')->once()->andReturn([
                'content' => 'mocked',
                'model' => 'test',
                'usage' => ['prompt_tokens' => 1, 'completion_tokens' => 1, 'total_tokens' => 2],
            ]);
        });

        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $login = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ])->assertOk()->json();

        $this->assertArrayHasKey('access_token', $login);

        $this->withToken($login['access_token'])
            ->postJson('/api/chat-ai', ['prompt' => 'hi', 'session_id' => null])
            ->assertOk()
            ->assertJsonStructure(['data' => ['session_id', 'message', 'model', 'usage']]);
    }

    public function test_chat_endpoint_rejects_browser_like_request_without_authorization_header(): void
    {
        // simulate the frontend bug (request without Authorization header)
        $this->postJson('/api/chat-ai', ['prompt' => 'hi', 'session_id' => 1])
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Unauthenticated.');
    }
}
