/**
 * Vercel Express entrypoint.
 * Imports the pre-built server (compiled in buildCommand) so Vercel's
 * bundler does not re-typecheck the whole TypeScript graph with a
 * different moduleResolution than our local NodeNext config.
 */
import express from "express";
import { createApp } from "./server/dist/app.js";

void express;

export default createApp();
