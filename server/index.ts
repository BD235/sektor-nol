/**
 * Sektor Nol — Express Production Server
 * Serves both the API backend and the Vite-built React frontend.
 *
 * Routing order (critical for SPA + API coexistence):
 * 1. express.json()        — parse JSON request bodies
 * 2. /api/v1/*             — backend API endpoints
 * 3. express.static(dist)  — serve frontend assets with correct MIME types
 * 4. app.get('*')          — SPA catch-all → index.html (fixes MIME type error)
 */

// Load .env file FIRST (before any module reads process.env)
// In Cloud Run, env vars are injected by the platform — dotenv is a safe no-op.
import 'dotenv/config';

import express from 'express';
import path from 'path';
import fs from 'fs';
import { apiRouter } from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Resolve dist path (robust for both local and Cloud Run) ──────
// Uses process.cwd() which is always the project root where npm start runs
const clientDistPath = path.resolve(process.cwd(), 'dist');

// ─── Startup Diagnostics ──────────────────────────────────────────
console.log(`[BOOT] cwd: ${process.cwd()}`);
console.log(`[BOOT] dist path: ${clientDistPath}`);
console.log(`[BOOT] dist exists: ${fs.existsSync(clientDistPath)}`);
if (fs.existsSync(clientDistPath)) {
  console.log(`[BOOT] dist contents: ${fs.readdirSync(clientDistPath).join(', ')}`);
  const assetsDir = path.join(clientDistPath, 'assets');
  if (fs.existsSync(assetsDir)) {
    console.log(`[BOOT] assets contents: ${fs.readdirSync(assetsDir).join(', ')}`);
  }
} else {
  console.error(`[BOOT] ❌ dist/ folder NOT FOUND at ${clientDistPath}`);
}

// ─── Middleware ────────────────────────────────────────────────────
app.use(express.json());

// ─── API Routes (MUST be before static serving) ───────────────────
app.use('/api/v1', apiRouter);

// ─── Static Frontend (Vite build output) ──────────────────────────
app.use(express.static(clientDistPath, {
  // Set proper MIME types and caching for static assets
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    // Ensure JS files always have correct MIME type
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  },
}));

// ─── SPA Catch-All (MUST be last — fixes MIME type error) ─────────
// Only serve index.html for navigation requests (not asset requests)
app.get('*', (req, res) => {
  // If the request looks like a file (has extension), return 404 instead of index.html
  // This prevents the MIME type error for missing assets
  const ext = path.extname(req.path);
  if (ext && ext !== '.html') {
    res.status(404).send('Not found');
    return;
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Sektor Nol server running on port ${PORT}`);
});
