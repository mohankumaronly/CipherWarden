/**
 * @file favicon.routes.ts
 * @description Express routes for the public favicon proxy.
 */

import { Router } from "express";
import { faviconController } from "./favicon.controller";

const router = Router();

/**
 * GET /api/v1/favicon?domain=example.com
 * Publicly accessible endpoint to proxy favicons without requiring an active vault session.
 */
router.get("/", faviconController.getFavicon);

export default router;
