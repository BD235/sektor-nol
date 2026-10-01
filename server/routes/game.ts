/**
 * Game API Routes — /api/v1/game/*
 * Handles game actions via SSE streaming from Gemini AI.
 */

import { Router } from 'express';
import { streamGameAction } from '../lib/gemini.js';

export const gameRouter = Router();

/**
 * POST /api/v1/game/action
 * Body: { action: string, state: GameState }
 * Response: Server-Sent Events stream with text chunks + final data chunk
 */
gameRouter.post('/action', async (req, res) => {
  const { action, state } = req.body;

  if (!action || !state) {
    res.status(400).json({ error: 'Missing required fields: action, state' });
    return;
  }

  // ─── SSE Headers ──────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    for await (const chunk of streamGameAction(action, state)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Game action SSE error:', error);
    res.write(
      `data: ${JSON.stringify({ type: 'text', text: 'Terjadi gangguan pada transmisi...' })}\n\n`
    );
    res.write('data: [DONE]\n\n');
    res.end();
  }
});
