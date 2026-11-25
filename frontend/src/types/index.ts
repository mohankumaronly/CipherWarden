export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface KdfParameters {
  memoryKiB: number;
  iterations: number;
  parallelism: number;
  outputLength: number;
}

export interface VaultMetadata {
  kdfAlgorithm: string;
  kdfParameters: KdfParameters;
  salt: string;
  keyEncryptionAlgo: string;
  wrappedVaultKey: string;
  keyNonce: string;
  encryptionVersion: number;
}

export interface SessionResponse {
  vaultId: string;
  csrfToken: string;
  expiresAt: string;
}

/** Discriminator for vault item types. Open string allows future types without schema changes. */
export type VaultItemType = "LOGIN" | "CARD";

/** Wire record returned by the backend for every vault item (ciphertext not yet decrypted). */
export interface VaultItemRecord {
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

/** Decrypted login credential. */
export interface VaultLoginItem {
  id: string;
  type: "LOGIN";
  isFavorite: boolean;
  folderId: string | null;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  recordVersion: number;
  encryptionVersion: number;
  createdAt: string;
  updatedAt: string;
}

/** Decrypted card entry (future use — Phase 6.1+). */
export interface VaultCardItem {
  id: string;
  type: "CARD";
  isFavorite: boolean;
  folderId: string | null;
  title: string;
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  notes?: string;
  recordVersion: number;
  encryptionVersion: number;
  createdAt: string;
  updatedAt: string;
}

/** Discriminated union of all decrypted vault item types. */
export type VaultItem = VaultLoginItem | VaultCardItem;

/** Representation of an organisational folder. */
export interface VaultFolder {
  id: string;
  name: string;
  createdAt: string;
}

/** Active filter selection in the vault dashboard sidebar. */
export type VaultFilter =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "type"; type: VaultItemType }
  | { kind: "folder"; folderId: string };

// ---------------------------------------------------------------------------
// Backwards-compat aliases kept so old imports still compile during migration.
// Remove in Phase 6.1 cleanup.
// ---------------------------------------------------------------------------
/** @deprecated Use VaultItemRecord */
export type CredentialRecord = VaultItemRecord;
/** @deprecated Use VaultLoginItem */
export type VaultCredential = VaultLoginItem;

export interface VaultSession {
  vaultId: string;
  dek: Uint8Array;
  dekKey: CryptoKey;
  csrfToken: string;
  expiresAt: number;
}
