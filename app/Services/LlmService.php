<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class LlmService
{
    public function __construct(private readonly SenopatiService $senopati) {}

    public function chat(array $messages): array
    {
        if ($url = config('services.ollama.base_url')) {
            try {
                return $this->ollamaChat($url, $messages);
            } catch (\Throwable $e) {
                Log::warning('Ollama unavailable, falling back to Senopati', ['error' => $e->getMessage()]);
            }
        }

        return $this->senopati->chat($messages);
    }

    public function chatStream(array $messages): \Generator
    {
        if ($url = config('services.ollama.base_url')) {
            // For simplicity, fallback streams only from Senopati.
            // If Ollama is configured but reachable, non-streaming via chat().
            try {
                $reply = $this->ollamaChat($url, $messages);
                foreach (str_split($reply['content'], 24) as $chunk) {
                    yield $chunk;
                }

                return;
            } catch (\Throwable $e) {
                Log::warning('Ollama unavailable for stream, falling back to Senopati', ['error' => $e->getMessage()]);
            }
        }

        yield from $this->senopati->chatStream($messages);
    }

    private function ollamaChat(string $baseUrl, array $messages): array
    {
        $response = Http::baseUrl(rtrim($baseUrl, '/'))
            ->timeout(config('services.ollama.timeout'))
            ->post('/api/chat', [
                'model' => config('services.ollama.model'),
                'messages' => $messages,
                'stream' => false,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Ollama HTTP '.$response->status());
        }

        $data = $response->json();

        return [
            'content' => (string) ($data['message']['content'] ?? ''),
            'model' => 'ollama:'.config('services.ollama.model'),
            'usage' => [
                'prompt_tokens' => $data['prompt_eval_count'] ?? null,
                'completion_tokens' => $data['eval_count'] ?? null,
                'total_tokens' => ($data['prompt_eval_count'] ?? 0) + ($data['eval_count'] ?? 0),
            ],
        ];
    }
}
