import { AppError } from "../../common/errors/AppError";
import { vaultItemRepository } from "./vaultItem.repository";
import type { CreateVaultItemPayload, UpdateVaultItemPayload } from "./vaultItem.validation";

/** Wire-safe DTO returned to the frontend for every vault item operation. */
export interface VaultItemDto {
  id: string;
  type: string;
  folderId: string | null;
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
  recordVersion: number;
  createdAt: string;
  updatedAt: string;
}

/** Convert a Prisma record to a plain DTO (dates → ISO strings). */
function toDto(record: {
  id: string;
  type: string;
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
  /** Return all items in the vault, encrypted, ordered by creation time. */
  async list(vaultId: string): Promise<VaultItemDto[]> {
    const rows = await vaultItemRepository.list(vaultId);
    return rows.map(toDto);
  },

  /** Return a single item or throw 404. */
  async getById(vaultId: string, id: string): Promise<VaultItemDto> {
    const row = await vaultItemRepository.findById(vaultId, id);
    if (!row) throw AppError.notFound("Vault item not found", "VAULT_ITEM_NOT_FOUND");
    return toDto(row);
  },

  /** Create a new vault item. The optional pre-generated id avoids a re-encrypt round-trip. */
  async create(vaultId: string, input: CreateVaultItemPayload): Promise<VaultItemDto> {
    const row = await vaultItemRepository.create({
      id: input.id,
      vaultId,
      type: input.type,
      ciphertext: input.ciphertext,
      nonce: input.nonce,
      encryptionVersion: input.encryptionVersion,
    });
    return toDto(row);
  },

  /** Update ciphertext with optimistic concurrency check. */
  async update(vaultId: string, id: string, input: UpdateVaultItemPayload): Promise<VaultItemDto> {
    const updated = await vaultItemRepository.updateIfVersionMatches(
      vaultId,
      id,
      input.expectedRecordVersion,
      {
        ciphertext: input.ciphertext,
        nonce: input.nonce,
        encryptionVersion: input.encryptionVersion,
      }
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

  /** Hard-delete an item or throw 404 if not found. */
  async remove(vaultId: string, id: string): Promise<void> {
    const result = await vaultItemRepository.delete(vaultId, id);
    if (result.count === 0) {
      throw AppError.notFound("Vault item not found", "VAULT_ITEM_NOT_FOUND");
    }
  },
};
