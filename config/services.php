<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'senopati' => [
        'base_url' => env('SENOPATI_BASE_URL', 'https://senopati.its.ac.id/llm-gateway/v1'),
        'api_key' => env('SENOPATI_API_KEY'),
        'model' => env('SENOPATI_MODEL', 'qwen3:14b'),
        'timeout' => (int) env('SENOPATI_TIMEOUT', 60),
        'system_prompt' => env('SENOPATI_SYSTEM_PROMPT', 'Kamu adalah SOC Analyst AI dari tim Security Operations Center yang membantu analis keamanan mendeteksi, menganalisis, dan merespons insiden keamanan siber. Fokus pada threat detection, incident response, firewall rules, IP blocking, dan authentication logs. Selalu jawab dalam Bahasa Indonesia yang profesional dan teknis, sertakan severity (Critical/High/Medium/Low) bila relevan, dan berikan rekomendasi yang actionable.'),
    ],

    'ollama' => [
        'base_url' => env('OLLAMA_BASE_URL', ''),
        'model' => env('OLLAMA_MODEL', 'llama3.2:1b'),
        'timeout' => (int) env('OLLAMA_TIMEOUT', 3),
    ],
];
