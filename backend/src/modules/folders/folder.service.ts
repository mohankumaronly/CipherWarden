/**
 * @file folder.service.ts
 * @description Business logic layer for managing folders within a vault.
 */

import { AppError } from "../../common/errors/AppError";
import { folderRepository } from "./folder.repository";
import type { CreateFolderPayload } from "./folder.validation";

/**
 * Data transfer object representing a Folder sent to API clients.
 */
export interface FolderDto {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Transforms a Prisma Folder database record into a wire-safe FolderDto.
 * @param record - Raw database folder record.
 * @returns Clean FolderDto with ISO date strings.
 */
function toDto(record: { id: string; name: string; createdAt: Date }): FolderDto {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt.toISOString(),
  };
}

export const folderService = {
  /**
   * Retrieves all folders for the specified vault.
   * @param vaultId - The UUID of the authenticated vault.
   * @returns Array of FolderDto.
   */
  async list(vaultId: string): Promise<FolderDto[]> {
    const rows = await folderRepository.list(vaultId);
    return rows.map(toDto);
  },

  /**
   * Creates a new folder inside the specified vault.
   * @param vaultId - The UUID of the authenticated vault.
   * @param input - Validated input containing the folder name.
   * @returns The created FolderDto.
   */
  async create(vaultId: string, input: CreateFolderPayload): Promise<FolderDto> {
    const row = await folderRepository.create({
      vaultId,
      name: input.name,
    });
    return toDto(row);
  },

  /**
   * Deletes a folder by ID from the specified vault.
   * @param vaultId - The UUID of the authenticated vault.
   * @param id - The UUID of the folder to delete.
   * @throws AppError 404 if the folder does not exist or does not belong to the vault.
   */
  async remove(vaultId: string, id: string): Promise<void> {
    const result = await folderRepository.delete(vaultId, id);
    if (result.count === 0) {
      throw AppError.notFound("Folder not found", "FOLDER_NOT_FOUND");
    }
  },
};
