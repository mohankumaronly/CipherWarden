/**
 * @file folder.controller.ts
 * @description HTTP request handlers for Folder management endpoints.
 */

import type { Request, Response } from "express";
import { created, ok } from "../../common/utils/response";
import { auditService } from "../audit/audit.service";
import { folderService } from "./folder.service";

export const folderController = {
  /**
   * GET /api/v1/folders
   * Returns all folders associated with the active session's vault.
   */
  async list(req: Request, res: Response) {
    const vaultId = req.session!.vaultId;
    const folders = await folderService.list(vaultId);
    res.status(200).json(ok(folders));
  },

  /**
   * POST /api/v1/folders
   * Creates a new folder in the active session's vault.
   */
  async create(req: Request, res: Response) {
    const vaultId = req.session!.vaultId;
    const folder = await folderService.create(vaultId, req.body);
    await auditService.log("folder.created", {
      vaultId,
      metadata: { id: folder.id, name: folder.name },
      req,
    });
    res.status(201).json(created(folder, "Folder created"));
  },

  /**
   * DELETE /api/v1/folders/:id
   * Deletes a folder by ID from the active session's vault.
   */
  async remove(req: Request, res: Response) {
    const vaultId = req.session!.vaultId;
    const id = req.params.id as string;
    await folderService.remove(vaultId, id);
    await auditService.log("folder.deleted", {
      vaultId,
      metadata: { id },
      req,
    });
    res.status(200).json(ok(null, "Folder deleted"));
  },
};
