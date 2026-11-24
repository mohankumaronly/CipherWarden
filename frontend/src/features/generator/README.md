## Password Generator

This module provides client-side, zero-knowledge password, passphrase, and PIN generation built on Web Cryptography (`crypto.getRandomValues`). Generation occurs entirely in memory within the client browser: no network requests are dispatched, no telemetry is gathered, no console logs are emitted, and generated secrets are never saved to persistent storage (`localStorage`, `sessionStorage`, or cookies).

## Modes

| Mode | Range | Default | Charset / Source |
| :--- | :--- | :--- | :--- |
| Password | 8–64 chars | 20 | Lowercase + Uppercase + Digits + Symbols (each toggleable) |
| Passphrase | 3–10 words | 4 | EFF Short Wordlist 1 (1,296 words) |
| PIN | 4–12 digits | 6 | 0–9 (optionally unique digits) |

## Options Reference

### Password Options (`PasswordOptions`)

- `mode`: `"password"`
- `length`: `number` (8–64 inclusive, default: `20`)
- `includeLowercase`: `boolean` (default: `true`)
- `includeUppercase`: `boolean` (default: `true`)
- `includeDigits`: `boolean` (default: `true`)
- `includeSymbols`: `boolean` (default: `true`)
- `avoidAmbiguous`: `boolean` (default: `false`, filters out `Il1O0o`)

*Example output:* `Xk7#mQp2!vR9$wLz^bT4`

### Passphrase Options (`PassphraseOptions`)

- `mode`: `"passphrase"`
- `wordCount`: `number` (3–10 inclusive, default: `4`)
- `separator`: `"-" | "_" | "." | " "` (default: `"-"`)
- `capitalize`: `boolean` (default: `false`, capitalizes first letter of each word)

*Example output:* `civic-essay-olive-sleek`

### PIN Options (`PinOptions`)

- `mode`: `"pin"`
- `length`: `number` (4–12 inclusive, default: `6`)
- `noRepeats`: `boolean` (default: `false`, enforces unique digits)

*Example output:* `891455`

## Entropy Notes

| Mode | Formula | Approx. Entropy |
| :--- | :--- | :--- |
| Password at length $N$ | $\log_2(\text{charset\_size}^N)$ bits | ~131 bits (all classes, len 20) |
| Passphrase at $W$ words | $\log_2(1296^W) \approx W \times 10.34$ bits | ~41.4 bits ($W=4$), ~62.0 bits ($W=6$) |
| PIN at $L$ digits | $\log_2(10^L) \approx L \times 3.32$ bits | ~19.9 bits ($L=6$) |

For high-value accounts, use ≥ 6 passphrase words (~62 bits) or ≥ 20 password characters with all classes.

## Security Properties

- **CSPRNG only**: `crypto.getRandomValues` (never `Math.random`).
- **Rejection sampling**: Eliminates modulo bias for both 8-bit ($\le 256$) and 32-bit ($> 256$) draws.
- **Guaranteed class inclusion**: At least one character from each selected class.
- **Fisher-Yates shuffle**: CSPRNG-driven in-place shuffle prevents positional leakage of the guaranteed characters.
- **No data leakage**: No network calls, no `localStorage`/`sessionStorage`/cookies, no console output, no telemetry.
- **Autofill protection**: Generated values are displayed in a `<code>` element (not an `<input>`) to avoid accidental browser autofill.

## Testing

Unit and security test suite covering generation constraints, distributions, exhaustiveness guards, and source leak audits:

```bash
cd frontend
node --test src/crypto/__tests__/passwordGenerator.test.ts
```

19 tests covering correctness, distributions, security greps, and exhaustiveness.

## Spec Amendments

- **AM-01**: Dual-width rejection sampling (8-bit $\le 256$, 32-bit $> 256$).
- **AM-02**: EFF Short Wordlist 1, with "yo-yo" replaced by "yoke" to satisfy strict `[a-z]+` requirement. Word count and entropy unchanged (1,296 words, ~10.34 bits/word).

## Integration

Integrated into `CredentialFormDialog` as an inline expandable panel below the Password field. See `features/credentials/CredentialFormDialog.tsx`.

## License Notes

EFF Short Wordlist is CC-BY-3.0 (https://www.eff.org/dice).
