# SOC Analyst AI - Frontend Interface

A modern, professional React + TypeScript + Tailwind CSS chat interface for the Laravel backend SOC Analyst AI platform.

## Setup & Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```
   The application runs on `http://localhost:3000` by default and proxies `/api` requests to the Laravel backend at `http://127.0.0.1:8000`.

## Demo Credentials

- **Email:** `demo@example.com`
- **Password:** `password`

## SSE Parser Implementation Note

Because standard `EventSource` only supports GET requests, this frontend implements a custom SSE (Server-Sent Events) parser over a POST request using `fetch` and `ReadableStream`:

1. Uses `fetch('/api/chat-ai/stream', { method: 'POST', ... })`.
2. Obtains a reader from `response.body.getReader()`.
3. Decodes chunks using `TextDecoder` and splits the buffer on newline boundaries (`\n\n`).
4. Parses `event:` and `data:` lines manually to handle:
   - `event: start`: Initializes session ID.
   - `event: chunk`: Appends incremental text content in real-time to the active message bubble.
   - `event: done`: Finalizes token usage statistics and model info.
