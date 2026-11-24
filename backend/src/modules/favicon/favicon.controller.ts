/**
 * @file favicon.controller.ts
 * @description Proxy controller fetching favicons to prevent client IP leakage.
 */

import type { Request, Response } from "express";

export const faviconController = {
  /**
   * GET /api/v1/favicon?domain=example.com
   * Proxies upstream favicon fetch with aggressive caching and graceful error fallback.
   *
   * @param req - Express request containing `domain` query parameter.
   * @param res - Express response returning binary image data or 404.
   */
  async getFavicon(req: Request, res: Response): Promise<void> {
    const rawDomain = req.query.domain;
    if (typeof rawDomain !== "string" || !rawDomain.trim()) {
      res.status(400).json({ success: false, message: "Query parameter 'domain' is required" });
      return;
    }

    const domain = rawDomain.trim();

    try {
      const upstreamUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 5000);

      const upstreamResponse = await fetch(upstreamUrl, {
        signal: abortController.signal,
        headers: {
          "User-Agent": "CipherWarden-FaviconProxy/1.0",
        },
      });
      clearTimeout(timeoutId);

      if (!upstreamResponse.ok) {
        res.status(404).end();
        return;
      }

      const contentType = upstreamResponse.headers.get("content-type") || "image/png";
      const arrayBuffer = await upstreamResponse.arrayBuffer();

      // Cache for 24 hours (86400 seconds) in client/browser cache
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.status(200).send(Buffer.from(arrayBuffer));
    } catch {
      // Gracefully handle network timeouts or upstream DNS failures with 404
      res.status(404).end();
    }
  },
};
