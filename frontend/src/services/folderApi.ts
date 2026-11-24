/**
 * @file folderApi.ts
 * @description API client for folder CRUD operations on /api/v1/folders.
 */

import { api } from "./api";
import type { VaultFolder } from "../types";

export interface CreateFolderRequest {
  name: string;
}

export const folderApi = {
  /**
   * Fetch all folders belonging to the user's unlocked vault.
   */
  list() {
    return api.raw<VaultFolder[]>("/folders");
  },

  /**
   * Create a new folder.
   * @param name - The human-readable folder name.
   */
  create(name: string) {
    return api.raw<VaultFolder>("/folders", {
      method: "POST",
      body: { name },
      csrf: true,
    });
  },

  /**
   * Delete an existing folder.
   * @param id - The UUID of the folder to delete.
   */
  remove(id: string) {
    return api.raw<null>(`/folders/${id}`, {
      method: "DELETE",
      csrf: true,
    });
  },
};
