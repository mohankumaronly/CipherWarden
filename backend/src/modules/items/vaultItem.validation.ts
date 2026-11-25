/**
 * Vault Item Validation Schemas
 *
 * Provides Zod validation schemas for creating, updating, and querying vault items.
 * Supports metadata properties like `isFavorite` and `folderId` along with zero-knowledge
 * ciphertext payloads and versioning fields.
 */
import { z } from "zod";

const base64 = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9+/_-]+=*$/, "Must be base64/base64url encoded");

/** UUID schema reused for both param and optional pre-generated id. */
const uuidSchema = z.string().uuid("Invalid vault item id");

/**
 * Validation schema for creating a new vault item.
 * Allows client-side UUID generation and optional favorite/folder metadata.
 */
export const createVaultItemSchema = z.object({
  /** Client-generated UUID. When provided the backend uses it as the record id,
   *  avoiding the two-step create→re-encrypt pattern. */
  id: uuidSchema.optional(),
  /** Discriminator stored server-side for listing/filtering without decryption. */
  type: z.string().min(1).max(32).default("LOGIN"),
  /** Favorite marker for quick access. Defaults to false. */
  isFavorite: z.boolean().optional().default(false),
  /** Optional folder ID to assign this item to. */
  folderId: uuidSchema.nullable().optional(),
  ciphertext: base64,
  nonce: base64,
  encryptionVersion: z.number().int().min(1).max(100).default(1),
});

/**
 * Validation schema for updating a vault item.
 * Supports partial updates for metadata (such as favorite toggle or quick folder assignment)
 * as well as full ciphertext updates with optimistic concurrency checks.
 */
export const updateVaultItemSchema = z.object({
  /** Favorite status toggle. */
  isFavorite: z.boolean().optional(),
  /** Optional folder ID to assign this item to or null to unassign. */
  folderId: uuidSchema.nullable().optional(),
  /** Updated ciphertext if re-encrypting. */
  ciphertext: base64.optional(),
  /** Updated nonce if re-encrypting. */
  nonce: base64.optional(),
  /** Encryption version used for ciphertext. */
  encryptionVersion: z.number().int().min(1).max(100).optional(),
  /** Expected record version for optimistic concurrency control. */
  expectedRecordVersion: z.number().int().min(1).optional(),
});

/** Schema for validating UUID route parameters. */
export const vaultItemIdParamSchema = z.object({
  id: uuidSchema,
});

export type CreateVaultItemPayload = z.infer<typeof createVaultItemSchema>;
export type UpdateVaultItemPayload = z.infer<typeof updateVaultItemSchema>;
