<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChatAiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prompt' => ['required', 'string', 'max:1000'],
            'session_id' => ['nullable', 'integer', 'exists:chat_sessions,id'],
            'stream' => ['nullable', 'boolean'],
        ];
    }
}
