import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_KDF_PARAMS, deriveMasterKey } from "../crypto/argon2";
import { generateSalt } from "../crypto/aes";
import { base64ToBytes, bytesToBase64 } from "../crypto/encoding";
import {
  dekToCryptoKey,
  decryptCredential,
  encryptCredential,
  unwrapDek,
  wrapDek,
  type PlainVaultPayload,
} from "../crypto/vaultKey";
import { vaultItemApi } from "../services/vaultItemApi";
import { folderApi } from "../services/folderApi";
import { setCsrfToken } from "../services/api";
import { vaultApi } from "../services/vaultApi";
import type { VaultFilter, VaultFolder, VaultItem } from "../types";

const AUTO_LOCK_MS = 3 * 60 * 1000; // 3 minutes inactivity
const MAX_SESSION_MS = 5 * 60 * 1000; // 5 minutes hard cap

interface VaultContextValue {
  status: "checking" | "setup" | "locked" | "unlocked";
  vaultId: string | null;
  credentials: VaultItem[];
  folders: VaultFolder[];
  activeFilter: VaultFilter;
  setActiveFilter: (filter: VaultFilter) => void;
  loadingCredentials: boolean;
  error: string | null;
  unlockExpiresAt: number | null;

  refreshStatus: () => Promise<void>;
  setupVault: (masterKey: string) => Promise<void>;
  unlockVault: (masterKey: string) => Promise<void>;
  lockVault: () => Promise<void>;

  addCredential: (input: PlainVaultPayload) => Promise<void>;
  updateCredential: (id: string, input: PlainVaultPayload) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  reloadCredentials: () => Promise<void>;

  loadFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<VaultFolder>;
  deleteFolder: (id: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

interface SessionState {
  dekKey: CryptoKey;
  saltB64: string;
  encryptionVersion: number;
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VaultContextValue["status"]>("checking");
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<VaultItem[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [activeFilter, setActiveFilter] = useState<VaultFilter>({ kind: "all" });
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockExpiresAt, setUnlockExpiresAt] = useState<number | null>(null);

  const sessionRef = useRef<SessionState | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hardCapRef = useRef<number | null>(null);

  const clearSession = useCallback(() => {
    sessionRef.current = null;
    hardCapRef.current = null;
    setVaultId(null);
    setCredentials([]);
    setFolders([]);
    setActiveFilter({ kind: "all" });
    setUnlockExpiresAt(null);
    setCsrfToken(null);

    // Clear persistent session data on lock
    sessionStorage.removeItem("vault_dek");
    sessionStorage.removeItem("vault_csrf");
    sessionStorage.removeItem("vault_id");
    sessionStorage.removeItem("vault_salt");
    sessionStorage.removeItem("vault_enc_version");
  }, []);

  const refreshStatus = useCallback(async () => {
    setError(null);
    try {
      const metadata = await vaultApi.getMetadata();
      setStatus(metadata ? "locked" : "setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check vault status");
      setStatus("locked");
    }
  }, []);

  const decryptAll = useCallback(async (vaultIdValue: string, dekKey: CryptoKey) => {
    setLoadingCredentials(true);
    try {
      const records = await vaultItemApi.list();
      const decrypted = await Promise.all(
        records.map(async (r) => {
          try {
            const plain = await decryptCredential(
              dekKey,
              vaultIdValue,
              r.id,
              r.ciphertext,
              r.nonce,
              r.encryptionVersion
            );
            // Legacy items encrypted before Phase 6.0 don't have `type` in the
            // JSON payload. Fall back to the `type` column returned by the backend.
            const resolvedType = plain.type ?? (r.type as "LOGIN" | "CARD") ?? "LOGIN";
            return {
              ...plain,
              type: resolvedType,
              id: r.id,
              folderId: r.folderId,
              recordVersion: r.recordVersion,
              encryptionVersion: r.encryptionVersion,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
            } as VaultItem;
          } catch {
            return null;
          }
        })
      );
      setCredentials(decrypted.filter((c): c is VaultItem => c !== null));
    } finally {
      setLoadingCredentials(false);
    }
  }, []);

  const loadFolders = useCallback(async () => {
    try {
      const list = await folderApi.list();
      setFolders(list);
    } catch {
      // Best-effort folder loading
    }
  }, []);

  const createFolder = useCallback(async (name: string) => {
    const newFolder = await folderApi.create(name);
    setFolders((prev) => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
    return newFolder;
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    await folderApi.remove(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setActiveFilter((prev) => (prev.kind === "folder" && prev.folderId === id ? { kind: "all" } : prev));
    setCredentials((prev) =>
      prev.map((c) => (c.folderId === id ? { ...c, folderId: null } : c))
    );
  }, []);

  const finalizeUnlock = useCallback(
    async (
      vaultIdValue: string,
      dek: Uint8Array,
      saltB64: string,
      encryptionVersion: number,
      csrfToken: string,
      expiresAtIso: string
    ) => {
      const key = await dekToCryptoKey(dek);
      sessionRef.current = { dekKey: key, saltB64, encryptionVersion };
      lastActivityRef.current = Date.now();
      hardCapRef.current = Date.now() + MAX_SESSION_MS;
      const serverExpiry = new Date(expiresAtIso).getTime();
      const localExpiry = Math.min(hardCapRef.current, serverExpiry || hardCapRef.current);
      setUnlockExpiresAt(localExpiry);
      setVaultId(vaultIdValue);
      setCsrfToken(csrfToken);
      setStatus("unlocked");

      // Save to sessionStorage so it survives page refreshes
      sessionStorage.setItem("vault_dek", bytesToBase64(dek));
      sessionStorage.setItem("vault_csrf", csrfToken);
      sessionStorage.setItem("vault_id", vaultIdValue);
      sessionStorage.setItem("vault_salt", saltB64);
      sessionStorage.setItem("vault_enc_version", encryptionVersion.toString());

      await Promise.all([decryptAll(vaultIdValue, key), loadFolders()]);
    },
    [decryptAll, loadFolders]
  );

  const setupVault = useCallback(
    async (masterKey: string) => {
      setError(null);
      const salt = generateSalt();
      const saltB64 = bytesToBase64(salt);
      const { kek, authVerifier } = await deriveMasterKey(masterKey, salt, DEFAULT_KDF_PARAMS);
      const { dek, wrapped } = await wrapDek(kek, saltB64, 1);

      const session = await vaultApi.setup({
        kdfAlgorithm: "ARGON2ID",
        kdfParameters: DEFAULT_KDF_PARAMS,
        salt: saltB64,
        keyEncryptionAlgo: "AES-256-GCM",
        wrappedVaultKey: wrapped.wrappedVaultKey,
        keyNonce: wrapped.keyNonce,
        authVerifier: bytesToBase64(authVerifier),
        encryptionVersion: 1,
      });

      await finalizeUnlock(
        session.vaultId,
        dek,
        saltB64,
        1,
        session.csrfToken,
        session.expiresAt
      );
    },
    [finalizeUnlock]
  );

  const unlockVault = useCallback(
    async (masterKey: string) => {
      setError(null);
      const metadata = await vaultApi.getMetadata();
      if (!metadata) throw new Error("Vault has not been set up yet");

      const salt = base64ToBytes(metadata.salt);
      const { kek, authVerifier } = await deriveMasterKey(masterKey, salt, metadata.kdfParameters);

      // Unwrap DEK locally first — a wrong master key fails here without a network call.
      let dek: Uint8Array;
      try {
        dek = await unwrapDek(
          kek,
          metadata.salt,
          { wrappedVaultKey: metadata.wrappedVaultKey, keyNonce: metadata.keyNonce },
          metadata.encryptionVersion
        );
      } catch {
        throw new Error("Incorrect master key. The vault could not be unlocked.");
      }

      const session = await vaultApi.unlock(bytesToBase64(authVerifier));
      await finalizeUnlock(
        session.vaultId,
        dek,
        metadata.salt,
        metadata.encryptionVersion,
        session.csrfToken,
        session.expiresAt
      );
    },
    [finalizeUnlock]
  );

  const lockVault = useCallback(async () => {
    try {
      if (vaultId) await vaultApi.lock();
    } catch {
      // Best-effort.
    }
    clearSession();
    setStatus("locked");
  }, [vaultId, clearSession]);

  const reloadCredentials = useCallback(async () => {
    const session = sessionRef.current;
    if (!vaultId || !session) return;
    await decryptAll(vaultId, session.dekKey);
  }, [vaultId, decryptAll]);

  const addCredential = useCallback(
    async (input: PlainVaultPayload) => {
      const session = sessionRef.current;
      if (!vaultId || !session) throw new Error("Vault is locked");
      // Generate the id on the frontend so the AAD is bound to the final id
      // from the first encrypt — no two-step create/re-encrypt needed.
      const newId = crypto.randomUUID();
      const enc = await encryptCredential(session.dekKey, vaultId, newId, input, 1);
      await vaultItemApi.create({
        id: newId,
        type: input.type,
        folderId: input.folderId ?? null,
        ciphertext: enc.ciphertext,
        nonce: enc.nonce,
        encryptionVersion: 1,
      });
      await reloadCredentials();
    },
    [vaultId, reloadCredentials]
  );

  const updateCredential = useCallback(
    async (id: string, input: PlainVaultPayload) => {
      const session = sessionRef.current;
      if (!vaultId || !session) throw new Error("Vault is locked");
      const existing = credentials.find((c) => c.id === id);
      if (!existing) throw new Error("Credential not found");
      const enc = await encryptCredential(
        session.dekKey,
        vaultId,
        id,
        input,
        existing.encryptionVersion
      );
      await vaultItemApi.update(id, {
        folderId: input.folderId !== undefined ? input.folderId : existing.folderId,
        ciphertext: enc.ciphertext,
        nonce: enc.nonce,
        encryptionVersion: existing.encryptionVersion,
        expectedRecordVersion: existing.recordVersion,
      });
      await reloadCredentials();
    },
    [vaultId, credentials, reloadCredentials]
  );

  const deleteCredential = useCallback(
    async (id: string) => {
      if (!vaultId) throw new Error("Vault is locked");
      await vaultItemApi.remove(id);
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    },
    [vaultId]
  );

  // UPDATED: Session restoration on refresh
  useEffect(() => {
    const initSession = async () => {
      const savedDek = sessionStorage.getItem("vault_dek");
      const savedCsrf = sessionStorage.getItem("vault_csrf");
      const savedId = sessionStorage.getItem("vault_id");
      const savedSalt = sessionStorage.getItem("vault_salt");
      const savedEncVer = sessionStorage.getItem("vault_enc_version");

      if (savedDek && savedCsrf && savedId && savedSalt && savedEncVer) {
        try {
          // 1. Restore the CSRF token immediately so credentialApi.list() can send it
          setCsrfToken(savedCsrf);

          // 2. Rebuild the CryptoKey from storage
          const dekBytes = base64ToBytes(savedDek);
          const key = await dekToCryptoKey(dekBytes);

          // 3. Stage session in ref — do NOT set status="unlocked" yet.
          //    decryptAll calls credentialApi.list() which requires a live backend
          //    cookie. If the cookie is expired the call throws a 401. We only
          //    surface the unlocked status to the UI once we know the backend
          //    session is healthy.
          sessionRef.current = {
            dekKey: key,
            saltB64: savedSalt,
            encryptionVersion: parseInt(savedEncVer, 10),
          };
          lastActivityRef.current = Date.now();
          hardCapRef.current = Date.now() + MAX_SESSION_MS;

          // 4. Verify backend session is alive by fetching credentials and folders.
          //    Throws ApiError(401) if the cookie is missing or expired.
          await Promise.all([decryptAll(savedId, key), loadFolders()]);

          // 5. Backend confirmed healthy — now commit the unlocked state.
          setVaultId(savedId);
          setUnlockExpiresAt(hardCapRef.current);
          setStatus("unlocked");
          return;
        } catch {
          // Backend session is dead (401) or crypto failed.
          // Clear everything so the UI shows the lock screen, not a zombie state.
          sessionRef.current = null;
          hardCapRef.current = null;
          setCsrfToken(null);
          sessionStorage.removeItem("vault_dek");
          sessionStorage.removeItem("vault_csrf");
          sessionStorage.removeItem("vault_id");
          sessionStorage.removeItem("vault_salt");
          sessionStorage.removeItem("vault_enc_version");
        }
      }
      
      // Fallback: Check if vault exists, then lock
      await refreshStatus();
    };

    void initSession();
  }, [decryptAll, loadFolders, refreshStatus]);

  useEffect(() => {
    if (status !== "unlocked") return;
    const bump = () => {
      lastActivityRef.current = Date.now();
    };
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, bump));
  }, [status]);

  useEffect(() => {
    if (status !== "unlocked") return;
    const interval = setInterval(() => {
      const now = Date.now();
      const inactive = now - lastActivityRef.current > AUTO_LOCK_MS;
      const capped = hardCapRef.current !== null && now > hardCapRef.current;
      if (inactive || capped) void lockVault();
    }, 5000);
    return () => clearInterval(interval);
  }, [status, lockVault]);

  const value = useMemo<VaultContextValue>(
    () => ({
      status,
      vaultId,
      credentials,
      folders,
      activeFilter,
      setActiveFilter,
      loadingCredentials,
      error,
      unlockExpiresAt,
      refreshStatus,
      setupVault,
      unlockVault,
      lockVault,
      addCredential,
      updateCredential,
      deleteCredential,
      reloadCredentials,
      loadFolders,
      createFolder,
      deleteFolder,
    }),
    [
      status,
      vaultId,
      credentials,
      folders,
      activeFilter,
      setActiveFilter,
      loadingCredentials,
      error,
      unlockExpiresAt,
      refreshStatus,
      setupVault,
      unlockVault,
      lockVault,
      addCredential,
      updateCredential,
      deleteCredential,
      reloadCredentials,
      loadFolders,
      createFolder,
      deleteFolder,
    ]
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}