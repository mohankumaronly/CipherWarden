/**
 * @file favicon.validation.ts
 * @description Request validation for the favicon proxy endpoint.
 */

import { z } from "zod";

export const faviconQuerySchema = z.object({
  domain: z
    .string()
    .trim()
    .min(1, "Domain parameter is required")
    .max(253, "Domain exceeds maximum allowed length"),
});

export type FaviconQueryPayload = z.infer<typeof faviconQuerySchema>;
