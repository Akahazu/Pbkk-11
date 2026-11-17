import { describe, it, expect, vi } from 'vitest';
import { extractBalancedJson, streamChatDeltas } from './sse';

describe('extractBalancedJson', () => {
  it('1. Single object', () => {
    expect(extractBalancedJson('{"delta":"hi"}')).toEqual(['{"delta":"hi"}', '']);
  });

  it('2. Two objects concatenated', () => {
    expect(extractBalancedJson('{"delta":"a"}{"delta":"b"}'))
      .toEqual(['{"delta":"a"}', '{"delta":"b"}']);
  });

  it('3. Incomplete object', () => {
    expect(extractBalancedJson('{"delta":"hel')).toEqual([null, '{"delta":"hel']);
  });

  it('4. Brace inside string — MUST NOT terminate early', () => {
    expect(extractBalancedJson('{"delta":"see {x} here"}'))
      .toEqual(['{"delta":"see {x} here"}', '']);
  });

  it('5. Escaped quote inside string', () => {
    expect(extractBalancedJson('{"delta":"say \\"hi\\" ok"}'))
      .toEqual(['{"delta":"say \\"hi\\" ok"}', '']);
  });

  it('6. Escaped backslash before quote (\\\\ is backslash + end quote)', () => {
    expect(extractBalancedJson('{"delta":"path\\\\"}'))
      .toEqual(['{"delta":"path\\\\"}', '']);
  });

  it('handles delta containing JSON snippets with braces', () => {
    expect(extractBalancedJson('{"delta":"{\"alert\":true}"}'))
      .toEqual(['{"delta":"{\"alert\":true}"}', '']);
  });
});
