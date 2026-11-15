<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatAiResponseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'session_id' => $this->resource['session_id'],
            'message' => new ChatMessageResource($this->resource['message']),
            'model' => $this->resource['model'],
            'usage' => $this->resource['usage'],
        ];
    }
}
