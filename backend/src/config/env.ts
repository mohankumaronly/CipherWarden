import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// ── Pre-trim CLIENT_ORIGIN so a leading/trailing space in .env never silently
// breaks CORS (the raw value with space is a valid string but fails url() and
// does not match the allowed-origin check in app.ts).
const rawClientOrigin = process.env.CLIENT_ORIGIN ?? "";
if (rawClientOrigin !== rawClientOrigin.trim() && rawClientOrigin.trim() !== "") {
  console.warn(
    "[env] CLIENT_ORIGIN has leading/trailing whitespace. " +
      "It has been trimmed. Update your .env file to avoid this warning."
  );
}
// Overwrite in-process so Zod and all subsequent consumers see the clean value.
process.env.CLIENT_ORIGIN = rawClientOrigin.trim() || undefined;

if (!process.env.MASTER_KEY || process.env.MASTER_KEY.trim() === "") {
  delete process.env.MASTER_KEY;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),
  SESSION_DURATION_MINUTES: z.coerce.number().int().positive().default(30),
  COOKIE_NAME: z.string().default("my_vault_session"),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("strict"),
  TEST_MODE: z.string().default("false"),
  TEST_API_KEY: z.string().default(""),
  // ── Self-hosted master key ──────────────────────────────
  // The single master key that grants access to the dashboard.
  // When set, the server auto-provisions the vault on startup.
  MASTER_KEY: z.string().min(8, "MASTER_KEY must be at least 8 characters").optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

// ── Post-parse startup guard: SameSite=None requires Secure=true.
// Browsers silently reject the cookie when this invariant is violated,
// causing every API call to return 401 after page refresh.
if (env.COOKIE_SAME_SITE === "none" && env.COOKIE_SECURE !== true) {
  console.warn(
    "[env] COOKIE_SAME_SITE=none requires COOKIE_SECURE=true " +
      "(browsers reject None+Secure=false). " +
      "For localhost cross-port dev, use COOKIE_SAME_SITE=lax."
  );
}
