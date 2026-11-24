/**
 * @file folder.repository.ts
 * @description Database access layer for Folder entity using Prisma Client.
 */

import { prisma } from "../../config/prisma";

export const folderRepository = {
  /**
   * List all folders belonging to the specified vault, ordered alphabetically by name.
   * @param vaultId - The UUID of the vault.
   * @returns Array of Folder database records.
   */
  list(vaultId: string) {
    return prisma.folder.findMany({
      where: { vaultId },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Find a folder by its ID within a specific vault (ensures tenant isolation).
   * @param vaultId - The UUID of the vault.
   * @param id - The UUID of the folder.
   * @returns The folder record or null if not found.
   */
  findById(vaultId: string, id: string) {
    return prisma.folder.findFirst({
      where: { id, vaultId },
    });
  },

  /**
   * Create a new folder record associated with a vault.
   * @param data - Payload containing vaultId and folder name.
   * @returns Newly created Folder database record.
   */
  create(data: { vaultId: string; name: string }) {
    return prisma.folder.create({ data });
  },

  /**
   * Delete a folder scoped to the specified vault.
   * Associated vault items will have folderId set to NULL via DB foreign key onDelete: SetNull.
   * @param vaultId - The UUID of the vault.
   * @param id - The UUID of the folder.
   * @returns Prisma BatchPayload with count of deleted rows.
   */
  delete(vaultId: string, id: string) {
    return prisma.folder.deleteMany({
      where: { id, vaultId },
    });
  },
};
