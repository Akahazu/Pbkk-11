export interface SSEMessage {
  event: string;
  data: string;
}

export async function parseSSEStream(
  response: Response,
  onMessage: (msg: SSEMessage) => void,
  signal?: AbortSignal
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is missing reader');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing line in buffer

      let currentEvent = 'message';
      let currentData = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '') {
          // Empty line means end of event block
          if (currentData) {
            onMessage({ event: currentEvent, data: currentData.trim() });
            currentData = '';
            currentEvent = 'message';
          }
          continue;
        }

        if (line.startsWith('event:')) {
          currentEvent = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          currentData += (currentData ? '\n' : '') + line.substring(5).trim();
        }
      }
    }

    // Flush remaining buffer if any
    if (buffer.trim().startsWith('data:')) {
      const dataStr = buffer.trim().substring(5).trim();
      if (dataStr) {
        onMessage({ event: 'message', data: dataStr });
      }
    }
  } finally {
    reader.releaseLock();
  }
}
