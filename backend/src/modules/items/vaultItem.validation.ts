import { z } from "zod";

const base64 = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9+/_-]+=*$/, "Must be base64/base64url encoded");

/** UUID schema reused for both param and optional pre-generated id. */
const uuidSchema = z.string().uuid("Invalid vault item id");

export const createVaultItemSchema = z.object({
  /** Client-generated UUID. When provided the backend uses it as the record id,
   *  avoiding the two-step create→re-encrypt pattern. */
  id: uuidSchema.optional(),
  /** Discriminator stored server-side for listing/filtering without decryption. */
  type: z.string().min(1).max(32).default("LOGIN"),
  ciphertext: base64,
  nonce: base64,
  encryptionVersion: z.number().int().min(1).max(100).default(1),
});

export const updateVaultItemSchema = z.object({
  ciphertext: base64,
  nonce: base64,
  encryptionVersion: z.number().int().min(1).max(100).default(1),
  expectedRecordVersion: z.number().int().min(1),
});

export const vaultItemIdParamSchema = z.object({
  id: uuidSchema,
});

export type CreateVaultItemPayload = z.infer<typeof createVaultItemSchema>;
export type UpdateVaultItemPayload = z.infer<typeof updateVaultItemSchema>;
