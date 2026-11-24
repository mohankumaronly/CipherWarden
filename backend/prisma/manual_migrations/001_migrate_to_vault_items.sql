-- ============================================================
-- Migration: credentials → vault_items (safe, data-preserving)
-- Phase 6.0 — CipherWarden VaultItem unification
--
-- This migration:
--   1. Creates the folders table
--   2. Creates the vault_items table (new unified model)
--   3. Copies all existing credentials rows into vault_items
--      with type = 'LOGIN'
--   4. Does NOT drop the credentials table
--      (the app will stop reading it; it can be dropped in a
--       future cleanup migration once confirmed safe)
-- ============================================================

-- Step 1: Create folders table
CREATE TABLE IF NOT EXISTS "folders" (
  "id"        TEXT         NOT NULL,
  "vaultId"   TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT "folders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "folders_vaultId_fkey"
    FOREIGN KEY ("vaultId") REFERENCES "vaults"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "folders_vaultId_idx" ON "folders"("vaultId");

-- Step 2: Create vault_items table
CREATE TABLE IF NOT EXISTS "vault_items" (
  "id"                TEXT         NOT NULL,
  "vaultId"           TEXT         NOT NULL,
  "type"              TEXT         NOT NULL DEFAULT 'LOGIN',
  "folderId"          TEXT,
  "ciphertext"        TEXT         NOT NULL,
  "nonce"             TEXT         NOT NULL,
  "encryptionVersion" INTEGER      NOT NULL DEFAULT 1,
  "recordVersion"     INTEGER      NOT NULL DEFAULT 1,
  "createdAt"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT "vault_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vault_items_vaultId_fkey"
    FOREIGN KEY ("vaultId") REFERENCES "vaults"("id") ON DELETE CASCADE,
  CONSTRAINT "vault_items_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "vault_items_vaultId_idx" ON "vault_items"("vaultId");
CREATE INDEX IF NOT EXISTS "vault_items_folderId_idx" ON "vault_items"("folderId");

-- Step 3: Copy existing credentials → vault_items
-- Only insert rows that don't already exist in vault_items (idempotent)
INSERT INTO "vault_items" (
  "id", "vaultId", "type", "folderId",
  "ciphertext", "nonce", "encryptionVersion", "recordVersion",
  "createdAt", "updatedAt"
)
SELECT
  c."id",
  c."vaultId",
  'LOGIN'  AS "type",
  NULL     AS "folderId",
  c."ciphertext",
  c."nonce",
  c."encryptionVersion",
  c."recordVersion",
  c."createdAt",
  c."updatedAt"
FROM "credentials" c
WHERE NOT EXISTS (
  SELECT 1 FROM "vault_items" vi WHERE vi."id" = c."id"
);
