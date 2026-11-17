export type DeltaEvent = { delta: string };

export function extractBalancedJson(str: string): [string | null, string] {
  let startIdx = 0;
  while (startIdx < str.length && /\s/.test(str[startIdx])) {
    startIdx++;
  }

  if (startIdx >= str.length) {
    return [null, ''];
  }

  if (str[startIdx] !== '{') {
    const nextBrace = str.indexOf('{', startIdx);
    if (nextBrace === -1) {
      return [null, str];
    }
    startIdx = nextBrace;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIdx; i < str.length; i++) {
    const char = str[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          const jsonStr = str.slice(startIdx, i + 1);
          const remainder = str.slice(i + 1);
          return [jsonStr, remainder];
        }
      }
    }
  }

  return [null, str];
}

export async function streamChatDeltas(
  url: string,
  token: string,
  body: { prompt: string; session_id?: number | null },
  opts: {
    onDelta: (text: string) => void;
    onDone: () => void;
    onError: (err: Error) => void;
    onRawChunk?: (chunk: string) => void;
    signal?: AbortSignal;
  }
): Promise<void> {
  const { onDelta, onDone, onError, onRawChunk, signal } = opts;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (res.status === 401) {
      const err = new Error('Unauthenticated');
      (err as any).status = 401;
      onError(err);
      return;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Stream request failed');
      onError(new Error(errText || `HTTP error ${res.status}`));
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError(new Error('Response body is missing reader'));
      return;
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        const decodedChunk = decoder.decode(value, { stream: true });
        if (onRawChunk) {
          onRawChunk(decodedChunk);
        }

        buffer += decodedChunk;

        while (true) {
          const [obj, rest] = extractBalancedJson(buffer);
          if (!obj) break;
          buffer = rest;

          try {
            const parsed = JSON.parse(obj);
            if (typeof parsed.delta === 'string') {
              onDelta(parsed.delta);
            }
          } catch (e: any) {
            onError(new Error(`Failed to parse JSON object: ${e.message}`));
            return;
          }
        }
      }

      onDone();
    } finally {
      reader.releaseLock();
    }
  } catch (err: any) {
    if (err.name === 'AbortError' || signal?.aborted) {
      onDone();
    } else {
      onError(err);
    }
  }
}
