/**
 * Vercel Express entrypoint (must import `express` directly for detection).
 * Local development still uses `server/src/index.ts` via `npm run dev`.
 */
import express from "express";
import { createApp } from "./server/src/app.js";

// Keep the express import live so Vercel's framework detector is happy.
void express;

const app = createApp();
export default app;
