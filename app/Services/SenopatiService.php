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

    public function chatStream(array $messages): \Generator
    {
        $response = Http::withToken(config('services.senopati.api_key'))
            ->acceptJson()
            ->timeout(config('services.senopati.timeout'))
            ->withOptions(['stream' => true])
            ->post(rtrim(config('services.senopati.base_url'), '/').'/chat/completions', [
                'model' => config('services.senopati.model'),
                'messages' => $messages,
                'stream' => true,
            ]);

        $body = $response->toPsrResponse()->getBody();
        $buffer = '';

        while (! $body->eof()) {
            $buffer .= $body->read(1024);

            while (($pos = strpos($buffer, "\n")) !== false) {
                $line = trim(substr($buffer, 0, $pos));
                $buffer = substr($buffer, $pos + 1);

                if (! str_starts_with($line, 'data: ')) {
                    continue;
                }

                $payload = substr($line, 6);
                if ($payload === '[DONE]') {
                    return;
                }

                $json = json_decode($payload, true);
                $delta = $json['choices'][0]['delta']['content'] ?? '';
                if ($delta !== '') {
                    yield $delta;
                }
            }
        }
    }
}
