# SSE Parsing & Wire Format Specification

## Background & Problem
The backend emits a continuous byte stream of concatenated JSON objects over `text/event-stream` without standard SSE `data:` / `event:` prefixes and without newlines between objects.

Example wire format:
```
{"delta":""}{"delta":"J"}{"delta":"aw"}{"delta":"aban"}{"delta":":"}{"delta":" \n"}...
```

### Why Naive Regex (`split(/\}\{/)`) Fails
If an AI response contains JSON snippets or code blocks with curly braces (e.g. `{"alert": true}` inside `delta`), a naive regex splitter or string split on `}{` will break mid-string, corrupting the JSON parsing and causing stream parsing failures.

## Solution: Balanced-Brace Stream Parser (`extractBalancedJson`)
`src/lib/sse.ts` implements a robust character-by-character parser that:
1. Tracks JSON brace depth (`{` increments depth, `}` decrements depth).
2. Tracks string literals (`"` toggling), properly handling escaped quotes (`\"`) and backslashes (`\\`) so that braces inside string values do not trigger premature object closure.
3. Buffers incoming stream chunks via `TextDecoder` (with `stream: true` to support multi-byte UTF-8 correctly) and extracts complete, balanced `{...}` JSON objects before parsing them with `JSON.parse`.
4. Treats connection close as the stream completion marker (`onDone`).
