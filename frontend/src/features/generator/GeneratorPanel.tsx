/**
 * Container component orchestrating password generator UI and state.
 */

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/Button.tsx";
import { Card } from "../../components/ui/Card.tsx";
import { useToast } from "../../components/ui/Toast.tsx";
import { generatePassword } from "../../crypto/passwordGenerator.ts";
import { GeneratorModeTabs } from "./GeneratorModeTabs.tsx";
import { PasswordControls } from "./PasswordControls.tsx";
import { PassphraseControls } from "./PassphraseControls.tsx";
import { PinControls } from "./PinControls.tsx";
import { StrengthMeter } from "./StrengthMeter.tsx";
import {
  DEFAULT_PASSPHRASE_OPTIONS,
  DEFAULT_PASSWORD_OPTIONS,
  DEFAULT_PIN_OPTIONS,
} from "./generatorPresets.ts";
import type {
  GeneratorMode,
  GeneratorOptions,
  PassphraseOptions,
  PasswordOptions,
  PinOptions,
} from "./types.ts";

export interface GeneratorPanelProps {
  onGenerate: (password: string) => void;
  onClose: () => void;
}

/**
 * Top-level generator panel combining mode selector, controls, strength feedback, and clipboard actions.
 */
export function GeneratorPanel({ onGenerate, onClose }: GeneratorPanelProps) {
  const { toast } = useToast();

  const [mode, setMode] = useState<GeneratorMode>("password");
  const [passwordOpts, setPasswordOpts] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [passphraseOpts, setPassphraseOpts] = useState<PassphraseOptions>(DEFAULT_PASSPHRASE_OPTIONS);
  const [pinOpts, setPinOpts] = useState<PinOptions>(DEFAULT_PIN_OPTIONS);
  const [lastGenerated, setLastGenerated] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getActiveOptions = (targetMode: GeneratorMode = mode): GeneratorOptions => {
    switch (targetMode) {
      case "password":
        return passwordOpts;
      case "passphrase":
        return passphraseOpts;
      case "pin":
        return pinOpts;
    }
  };

  const executeGeneration = (opts: GeneratorOptions) => {
    try {
      const generated = generatePassword(opts);
      setLastGenerated(generated);
      setError(null);
      onGenerate(generated);
    } catch {
      setError("Could not generate with current settings");
    }
  };

  const handleGenerateClick = () => {
    executeGeneration(getActiveOptions());
  };

  const handleModeChange = (newMode: GeneratorMode) => {
    setMode(newMode);
    if (lastGenerated) {
      executeGeneration(getActiveOptions(newMode));
    }
  };

  const handlePasswordChange = (patch: Partial<PasswordOptions>) => {
    const next = { ...passwordOpts, ...patch };
    setPasswordOpts(next);
    if (lastGenerated && mode === "password") {
      executeGeneration(next);
    }
  };

  const handlePassphraseChange = (patch: Partial<PassphraseOptions>) => {
    const next = { ...passphraseOpts, ...patch };
    setPassphraseOpts(next);
    if (lastGenerated && mode === "passphrase") {
      executeGeneration(next);
    }
  };

  const handlePinChange = (patch: Partial<PinOptions>) => {
    const next = { ...pinOpts, ...patch };
    setPinOpts(next);
    if (lastGenerated && mode === "pin") {
      executeGeneration(next);
    }
  };

  const handleCopy = async () => {
    if (!lastGenerated) return;
    try {
      await navigator.clipboard.writeText(lastGenerated);
      setCopied(true);
      toast("Password copied to clipboard", "success");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Could not copy to clipboard", "error");
    }
  };

  return (
    <Card className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Password Generator
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} type="button">
          Cancel
        </Button>
      </div>

      <GeneratorModeTabs mode={mode} onChange={handleModeChange} />

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 overflow-hidden">
            {lastGenerated ? (
              <code className="block select-all truncate font-mono text-base font-medium text-slate-900 dark:text-slate-100">
                {lastGenerated}
              </code>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500">
                Click Generate to create a credential
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleGenerateClick}
              aria-label="Regenerate password"
              title="Regenerate"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!lastGenerated}
              onClick={handleCopy}
              aria-label="Copy password to clipboard"
              title="Copy"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-200/80 pt-2.5 dark:border-slate-800/80">
          <StrengthMeter password={lastGenerated} />
        </div>
      </div>

      <div className="pt-1">
        {mode === "password" && (
          <PasswordControls options={passwordOpts} onChange={handlePasswordChange} />
        )}
        {mode === "passphrase" && (
          <PassphraseControls options={passphraseOpts} onChange={handlePassphraseChange} />
        )}
        {mode === "pin" && (
          <PinControls options={pinOpts} onChange={handlePinChange} />
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2.5 pt-2">
        <Button variant="ghost" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleGenerateClick}
        >
          <RefreshCw className="h-4 w-4" />
          {lastGenerated ? "Regenerate" : "Generate"}
        </Button>
      </div>
    </Card>
  );
}
