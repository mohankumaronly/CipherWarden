import { api } from "./api";
import type { VaultItemRecord } from "../types";

export interface CreateVaultItemRequest {
  /** Client-generated UUID. Provided so the frontend encrypts with the final id,
   *  avoiding the two-step create→re-encrypt pattern. */
  id: string;
  /** Discriminator stored server-side ("LOGIN" | "CARD"). */
  type: string;
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
}

export interface UpdateVaultItemRequest {
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
  expectedRecordVersion: number;
}

/** API client for the /credentials endpoint (name kept for backend compat). */
export const vaultItemApi = {
  list() {
    return api.raw<VaultItemRecord[]>("/credentials");
  },

  get(id: string) {
    return api.raw<VaultItemRecord>(`/credentials/${id}`);
  },

  create(payload: CreateVaultItemRequest) {
    return api.raw<VaultItemRecord>("/credentials", { method: "POST", body: payload, csrf: true });
  },

  update(id: string, payload: UpdateVaultItemRequest) {
    return api.raw<VaultItemRecord>(`/credentials/${id}`, {
      method: "PUT",
      body: payload,
      csrf: true,
    });
  },

  remove(id: string) {
    return api.raw<null>(`/credentials/${id}`, { method: "DELETE", csrf: true });
  },
};
