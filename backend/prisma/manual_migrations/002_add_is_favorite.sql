-- AlterTable
ALTER TABLE "vault_items" ADD COLUMN IF NOT EXISTS "isFavorite" BOOLEAN NOT NULL DEFAULT false;
