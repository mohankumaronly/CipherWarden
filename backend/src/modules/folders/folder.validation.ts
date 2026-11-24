/**
 * @file folder.validation.ts
 * @description Zod request validation schemas and inferenced types for Folder CRUD operations.
 */

import { z } from "zod";

/**
 * UUID schema validation for folder route parameters.
 */
export const folderIdParamSchema = z.object({
  id: z.string().uuid("Invalid folder id"),
});

/**
 * Schema for creating a new folder in a vault.
 * Folder names must be non-empty and reasonably bounded.
 */
export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(100, "Folder name cannot exceed 100 characters"),
});

export type CreateFolderPayload = z.infer<typeof createFolderSchema>;
export type FolderIdParamPayload = z.infer<typeof folderIdParamSchema>;
