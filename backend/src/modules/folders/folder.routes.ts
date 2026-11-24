/**
 * @file folder.routes.ts
 * @description Express routing configuration for Folder endpoints.
 */

import { Router } from "express";
import { requireSession } from "../../common/middleware/sessionMiddleware";
import { validateRequest } from "../../common/middleware/validateRequest";
import { folderController } from "./folder.controller";
import { createFolderSchema, folderIdParamSchema } from "./folder.validation";

const router = Router();

// Enforce active authenticated vault session for all folder operations.
router.use(requireSession);

/**
 * GET /api/v1/folders
 * List all folders for the authenticated vault.
 */
router.get("/", folderController.list);

/**
 * POST /api/v1/folders
 * Create a new folder for the authenticated vault.
 */
router.post(
  "/",
  validateRequest({ body: createFolderSchema }),
  folderController.create
);

/**
 * DELETE /api/v1/folders/:id
 * Delete a folder by ID.
 */
router.delete(
  "/:id",
  validateRequest({ params: folderIdParamSchema }),
  folderController.remove
);

export default router;
