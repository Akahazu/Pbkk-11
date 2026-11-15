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
            ->timeout((int) config('services.senopati.timeout', 60))
            ->post(rtrim(config('services.senopati.base_url'), '/') . '/chat/completions', [
                'model' => config('services.senopati.model'),
                'messages' => $messages,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Senopati request failed: HTTP ' . $response->status());
        }

        return [
            'content' => (string) $response['choices'][0]['message']['content'],
            'raw' => $response,
        ];
    }
}
