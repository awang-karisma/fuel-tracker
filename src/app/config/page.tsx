"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIGURATION } from "../lib/config";
import type { AppConfiguration } from "../types";

const COMMON_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "NZD",
  "JPY",
  "SGD",
  "MYR",
  "IDR",
];

const normaliseCode = (code: string) => code.trim().toUpperCase();

export default function ConfigPage() {
  const [config, setConfig] = useLocalStorage<AppConfiguration>(
    CONFIG_STORAGE_KEY,
    DEFAULT_CONFIGURATION,
  );
  const [customCode, setCustomCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextCode = normaliseCode(customCode || config.currencyCode);
    if (!/^[A-Z]{3}$/.test(nextCode)) {
      setStatus("Currency codes must be three letters (e.g. USD).");
      return;
    }
    setConfig((current) => ({ ...current, currencyCode: nextCode }));
    setStatus("Preferences saved.");
  };

  const options = useMemo(() => {
    const unique = new Set(COMMON_CURRENCIES.concat(config.currencyCode));
    return Array.from(unique.values()).sort();
  }, [config.currencyCode]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:py-10">
      <Card
        title="Preferences"
        subtitle="Choose where prices should display which currency."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-6 text-sm text-neutral-700"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 font-medium text-neutral-700">
              <span>Currency</span>
              <select
                value={config.currencyCode}
                onChange={(event) => {
                  const value = normaliseCode(event.target.value);
                  setConfig((current) => ({ ...current, currencyCode: value }));
                  setCustomCode("");
                  setStatus("Preferences saved.");
                }}
                className="h-11 rounded-lg border border-neutral-300 px-3 text-base text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              >
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 font-medium text-neutral-700">
              <span>Custom code</span>
              <input
                value={customCode}
                onChange={(event) => {
                  setCustomCode(event.target.value);
                  setStatus(null);
                }}
                maxLength={3}
                placeholder="e.g. INR"
                className="h-11 uppercase rounded-lg border border-neutral-300 px-3 text-base text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
              <span className="text-xs text-neutral-500">
                Leave blank to keep the selection above or enter a custom
                3-letter ISO code.
              </span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Save configuration
            </button>
            {status && <p className="text-xs text-neutral-500">{status}</p>}
          </div>
        </form>
      </Card>
    </main>
  );
}
