/**
 * API Router Registry — /api/v1/*
 * All backend API routes are registered here.
 */

import { Router } from 'express';
import { gameRouter } from './game.js';

export const apiRouter = Router();

// ─── Health Check ───────────────────────────────────────────────────
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Game Routes ────────────────────────────────────────────────────
apiRouter.use('/game', gameRouter);
