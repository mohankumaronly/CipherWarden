import { prisma } from "../../config/prisma";

export const vaultItemRepository = {
  /**
   * List all vault items for a vault, ordered oldest first.
   */
  list(vaultId: string) {
    return prisma.vaultItem.findMany({
      where: { vaultId },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Find a single item by id scoped to the vault (prevents cross-vault leakage).
   */
  findById(vaultId: string, id: string) {
    return prisma.vaultItem.findFirst({ where: { id, vaultId } });
  },

  /**
   * Create a new vault item. Accepts an optional pre-generated id so the
   * frontend can encrypt with the final id before the first round-trip.
   */
  create(data: {
    id?: string;
    vaultId: string;
    type: string;
    folderId?: string | null;
    ciphertext: string;
    nonce: string;
    encryptionVersion: number;
  }) {
    return prisma.vaultItem.create({ data });
  },

  /**
   * Atomic optimistic-concurrency update.
   * Returns null when the record was modified by another session (stale version).
   */
  async updateIfVersionMatches(
    vaultId: string,
    id: string,
    expectedVersion: number,
    data: {
      folderId?: string | null;
      ciphertext: string;
      nonce: string;
      encryptionVersion: number;
    }
  ) {
    const result = await prisma.vaultItem.updateMany({
      where: { id, vaultId, recordVersion: expectedVersion },
      data: { ...data, recordVersion: { increment: 1 } },
    });
    if (result.count === 0) return null;
    return prisma.vaultItem.findFirst({ where: { id, vaultId } });
  },

  /**
   * Hard-delete a vault item scoped to its vault.
   */
  delete(vaultId: string, id: string) {
    return prisma.vaultItem.deleteMany({ where: { id, vaultId } });
  },
};
