<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class SenopatiService
{
    public function chat(array $messages): array
    {
        $response = Http::withToken(config('services.senopati.api_key'))
            ->acceptJson()
            ->timeout(config('services.senopati.timeout'))
            ->post(rtrim(config('services.senopati.base_url'), '/').'/chat/completions', [
                'model' => config('services.senopati.model'),
                'messages' => $messages,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Senopati request failed: HTTP '.$response->status());
        }

        $data = $response->json();
        $usage = $data['usage'] ?? [];

        return [
            'content' => (string) ($data['choices'][0]['message']['content'] ?? ''),
            'model' => $data['model'] ?? config('services.senopati.model'),
            'usage' => [
                'prompt_tokens' => $usage['prompt_tokens'] ?? null,
                'completion_tokens' => $usage['completion_tokens'] ?? null,
                'total_tokens' => $usage['total_tokens'] ?? null,
            ],
        ];
    }
}
