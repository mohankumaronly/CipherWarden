/**
 * Vault Item Service
 *
 * Business logic layer for vault item operations. Handles transformations between
 * Prisma database records and client-facing DTOs, including favorite flags and folder mappings.
 */
import { AppError } from "../../common/errors/AppError";
import { vaultItemRepository } from "./vaultItem.repository";
import type { CreateVaultItemPayload, UpdateVaultItemPayload } from "./vaultItem.validation";

/** Wire-safe DTO returned to the frontend for every vault item operation. */
export interface VaultItemDto {
  id: string;
  type: string;
  isFavorite: boolean;
  folderId: string | null;
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
  recordVersion: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert a Prisma record to a plain DTO (dates → ISO strings).
 *
 * @param record - Prisma VaultItem record
 * @returns Serialized VaultItemDto
 */
function toDto(record: {
  id: string;
  type: string;
  isFavorite: boolean;
  folderId: string | null;
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
  recordVersion: number;
  createdAt: Date;
  updatedAt: Date;
}): VaultItemDto {
  return {
    id: record.id,
    type: record.type,
    isFavorite: record.isFavorite,
    folderId: record.folderId,
    ciphertext: record.ciphertext,
    nonce: record.nonce,
    encryptionVersion: record.encryptionVersion,
    recordVersion: record.recordVersion,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export const vaultItemService = {
  /**
   * Return all items in the vault, encrypted, ordered by creation time.
   *
   * @param vaultId - Scoped vault identifier
   * @returns Array of VaultItemDto
   */
  async list(vaultId: string): Promise<VaultItemDto[]> {
    const rows = await vaultItemRepository.list(vaultId);
    return rows.map(toDto);
  },

  /**
   * Return a single item or throw 404 if not found.
   *
   * @param vaultId - Scoped vault identifier
   * @param id - Item UUID
   * @returns VaultItemDto
   */
  async getById(vaultId: string, id: string): Promise<VaultItemDto> {
    const row = await vaultItemRepository.findById(vaultId, id);
    if (!row) throw AppError.notFound("Vault item not found", "VAULT_ITEM_NOT_FOUND");
    return toDto(row);
  },

  /**
   * Create a new vault item. The optional pre-generated id avoids a re-encrypt round-trip.
   *
   * @param vaultId - Scoped vault identifier
   * @param input - Create payload
   * @returns Created VaultItemDto
   */
  async create(vaultId: string, input: CreateVaultItemPayload): Promise<VaultItemDto> {
    const row = await vaultItemRepository.create({
      id: input.id,
      vaultId,
      type: input.type,
      isFavorite: input.isFavorite ?? false,
      folderId: input.folderId,
      ciphertext: input.ciphertext,
      nonce: input.nonce,
      encryptionVersion: input.encryptionVersion,
    });
    return toDto(row);
  },

  /**
   * Update vault item fields (favorite status, folder assignment, or ciphertext).
   * Employs optimistic concurrency checking if expectedRecordVersion is supplied.
   *
   * @param vaultId - Scoped vault identifier
   * @param id - Item UUID
   * @param input - Update payload
   * @returns Updated VaultItemDto
   */
  async update(vaultId: string, id: string, input: UpdateVaultItemPayload): Promise<VaultItemDto> {
    const updateData: {
      isFavorite?: boolean;
      folderId?: string | null;
      ciphertext?: string;
      nonce?: string;
      encryptionVersion?: number;
    } = {};

    if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;
    if (input.folderId !== undefined) updateData.folderId = input.folderId;
    if (input.ciphertext !== undefined) updateData.ciphertext = input.ciphertext;
    if (input.nonce !== undefined) updateData.nonce = input.nonce;
    if (input.encryptionVersion !== undefined) updateData.encryptionVersion = input.encryptionVersion;

    const updated = await vaultItemRepository.updateIfVersionMatches(
      vaultId,
      id,
      input.expectedRecordVersion,
      updateData
    );

    if (!updated) {
      const exists = await vaultItemRepository.findById(vaultId, id);
      if (!exists) throw AppError.notFound("Vault item not found", "VAULT_ITEM_NOT_FOUND");
      throw AppError.conflict(
        "This item was modified by another session. Refresh and try again.",
        "STALE_RECORD"
      );
    }
    return toDto(updated);
  },

  /**
   * Hard-delete an item or throw 404 if not found.
   *
   * @param vaultId - Scoped vault identifier
   * @param id - Item UUID
   */
  async remove(vaultId: string, id: string): Promise<void> {
    const result = await vaultItemRepository.delete(vaultId, id);
    if (result.count === 0) {
      throw AppError.notFound("Vault item not found", "VAULT_ITEM_NOT_FOUND");
    }
  },
};
