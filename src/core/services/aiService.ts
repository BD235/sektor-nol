/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI Service — HTTP client that streams game actions through the backend API.
 * The actual Gemini AI calls now happen server-side (server/lib/gemini.ts),
 * keeping the API key secure and never exposed to the browser.
 *
 * Uses Server-Sent Events (SSE) for real-time narrative streaming.
 */

import type { GameState, StreamChunk } from '@/lib/types';

/**
 * Streams a game action through the backend API (Express → Gemini).
 * Uses SSE for real-time narrative delivery.
 *
 * @param action - Player's action text
 * @param currentState - Current game state for context
 * @yields StreamChunk — either narrative text or parsed game state update
 *
 * @example
 * ```ts
 * for await (const chunk of streamGameAction('cari kayu', gameState)) {
 *   if (chunk.type === 'text') updateNarrative(chunk.text);
 *   if (chunk.type === 'data') applyStateUpdate(chunk.data);
 * }
 * ```
 */
export async function* streamGameAction(
  action: string,
  currentState: GameState
): AsyncGenerator<StreamChunk> {
  const response = await fetch('/api/v1/game/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, state: currentState }),
  });

  if (!response.ok) {
    yield { type: 'text', text: 'Terjadi gangguan pada transmisi...' };
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          yield JSON.parse(data) as StreamChunk;
        } catch {
          /* skip malformed SSE data */
        }
      }
    }
  }
}
