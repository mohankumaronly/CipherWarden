/**
 * Vault Item Repository
 *
 * Data access layer for VaultItem entities in PostgreSQL via Prisma.
 * Implements tenant scoping to ensure cross-vault isolation and handles
 * optimistic concurrency control for updates.
 */
import { prisma } from "../../config/prisma";

export const vaultItemRepository = {
  /**
   * List all vault items for a vault, ordered oldest first.
   *
   * @param vaultId - Scoped vault identifier
   * @returns Array of VaultItem records
   */
  list(vaultId: string) {
    return prisma.vaultItem.findMany({
      where: { vaultId },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Find a single item by id scoped to the vault (prevents cross-vault leakage).
   *
   * @param vaultId - Scoped vault identifier
   * @param id - Item UUID
   * @returns VaultItem or null
   */
  findById(vaultId: string, id: string) {
    return prisma.vaultItem.findFirst({ where: { id, vaultId } });
  },

  /**
   * Create a new vault item. Accepts an optional pre-generated id so the
   * frontend can encrypt with the final id before the first round-trip.
   *
   * @param data - Item creation fields including optional isFavorite
   * @returns Created VaultItem record
   */
  create(data: {
    id?: string;
    vaultId: string;
    type: string;
    isFavorite?: boolean;
    folderId?: string | null;
    ciphertext: string;
    nonce: string;
    encryptionVersion: number;
  }) {
    return prisma.vaultItem.create({ data });
  },

  /**
   * Atomic optimistic-concurrency update.
   * When expectedVersion is provided, requires recordVersion to match.
   * Increments recordVersion upon successful update.
   * Returns null when the record was modified by another session (or doesn't exist).
   *
   * @param vaultId - Scoped vault identifier
   * @param id - Item UUID
   * @param expectedVersion - Expected recordVersion for concurrency control (optional)
   * @param data - Fields to update (isFavorite, folderId, ciphertext, nonce, etc.)
   * @returns Updated VaultItem or null
   */
  async updateIfVersionMatches(
    vaultId: string,
    id: string,
    expectedVersion: number | undefined,
    data: {
      isFavorite?: boolean;
      folderId?: string | null;
      ciphertext?: string;
      nonce?: string;
      encryptionVersion?: number;
    }
  ) {
    const where: { id: string; vaultId: string; recordVersion?: number } = {
      id,
      vaultId,
    };
    if (expectedVersion !== undefined) {
      where.recordVersion = expectedVersion;
    }

    const updateData: Record<string, unknown> = {
      recordVersion: { increment: 1 },
    };
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.folderId !== undefined) updateData.folderId = data.folderId;
    if (data.ciphertext !== undefined) updateData.ciphertext = data.ciphertext;
    if (data.nonce !== undefined) updateData.nonce = data.nonce;
    if (data.encryptionVersion !== undefined) updateData.encryptionVersion = data.encryptionVersion;

    const result = await prisma.vaultItem.updateMany({
      where,
      data: updateData,
    });
    if (result.count === 0) return null;
    return prisma.vaultItem.findFirst({ where: { id, vaultId } });
  },

  /**
   * Hard-delete a vault item scoped to its vault.
   *
   * @param vaultId - Scoped vault identifier
   * @param id - Item UUID
   * @returns Prisma batch payload
   */
  delete(vaultId: string, id: string) {
    return prisma.vaultItem.deleteMany({ where: { id, vaultId } });
  },
};
