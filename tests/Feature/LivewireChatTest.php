<?php

namespace Tests\Feature;

use App\Livewire\ChatSidebar;
use App\Livewire\ChatWorkspace;
use App\Models\ChatSession;
use App\Models\User;
use App\Services\LlmService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Mockery;
use Tests\TestCase;

class LivewireChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_page_requires_authentication(): void
    {
        $response = $this->get('/chat');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_access_chat_page(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/chat');
        $response->assertStatus(200);
        $response->assertSeeLivewire(ChatSidebar::class);
        $response->assertSeeLivewire(ChatWorkspace::class);
    }

    public function test_chat_sidebar_lists_user_sessions_and_creates_session(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $session1 = ChatSession::create(['user_id' => $user->id, 'title' => 'User Session']);
        $session2 = ChatSession::create(['user_id' => $otherUser->id, 'title' => 'Other Session']);

        Livewire::actingAs($user)
            ->test(ChatSidebar::class)
            ->assertSee('User Session')
            ->assertDontSee('Other Session')
            ->call('createNewSession')
            ->assertSet('activeSessionId', 3);

        $this->assertDatabaseHas('chat_sessions', [
            'id' => 3,
            'user_id' => $user->id,
            'title' => 'New SOC Investigation',
        ]);
    }

    public function test_chat_workspace_sends_prompt_and_persists_messages_and_logs(): void
    {
        $user = User::factory()->create();

        $mockLlm = Mockery::mock(LlmService::class);
        $mockLlm->shouldReceive('chat')
            ->once()
            ->andReturn([
                'content' => 'Analysis complete. No threats detected.',
                'model' => 'test-model',
                'usage' => [
                    'prompt_tokens' => 10,
                    'completion_tokens' => 15,
                    'total_tokens' => 25,
                ],
            ]);

        $this->app->instance(LlmService::class, $mockLlm);

        Livewire::actingAs($user)
            ->test(ChatWorkspace::class)
            ->set('prompt', 'Check security logs')
            ->call('sendPrompt')
            ->assertSet('prompt', '')
            ->assertSet('errorMessage', null);

        $this->assertDatabaseHas('chat_sessions', [
            'user_id' => $user->id,
            'title' => 'Check security logs',
        ]);

        $this->assertDatabaseHas('chat_messages', [
            'role' => 'user',
            'content' => 'Check security logs',
        ]);

        $this->assertDatabaseHas('chat_messages', [
            'role' => 'assistant',
            'content' => 'Analysis complete. No threats detected.',
        ]);

        $this->assertDatabaseHas('ai_logs', [
            'user_id' => $user->id,
            'prompt' => 'Check security logs',
            'ai_answer' => 'Analysis complete. No threats detected.',
            'model' => 'test-model',
            'total_tokens' => 25,
        ]);
    }
}
