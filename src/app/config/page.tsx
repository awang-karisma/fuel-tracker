"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIGURATION } from "../lib/config";
import type {
  AppConfiguration,
  FuelRecord,
  MaintenanceRecord,
} from "../types";

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

const FUEL_STORAGE_KEY = "fuel-tracker:fuel-records";
const MAINTENANCE_STORAGE_KEY = "fuel-tracker:maintenance-records";

type BackupPayload = {
  configuration?: AppConfiguration;
  fuelRecords?: FuelRecord[];
  maintenanceRecords?: MaintenanceRecord[];
};

type BackupEnvelope = {
  checksum: string;
  payload: BackupPayload;
};

const encodeBase64 = (value: string) => {
  if (typeof window === "undefined") {
    return "";
  }
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

const decodeBase64 = (value: string) => {
  if (typeof window === "undefined") {
    return value;
  }
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const readLocalJson = <T,>(key: string, fallback: T) => {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("Failed to read localStorage key", key, error);
    return fallback;
  }
};

const writeLocalJson = (key: string, value: unknown) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Failed to write localStorage key", key, error);
  }
};

const clearAllLocalData = () => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.clear();
  } catch (error) {
    console.warn("Failed to clear localStorage", error);
  }
};

const computeChecksum = async (value: string) => {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return "";
  }
  const data = new TextEncoder().encode(value);
  const hash = await window.crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

export default function ConfigPage() {
  const [config, setConfig] = useLocalStorage<AppConfiguration>(
    CONFIG_STORAGE_KEY,
    DEFAULT_CONFIGURATION,
  );
  const [customCode, setCustomCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [exportValue, setExportValue] = useState("");
  const [importValue, setImportValue] = useState("");
  const [dataStatus, setDataStatus] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showExportFields, setShowExportFields] = useState(false);
  const [showImportFields, setShowImportFields] = useState(false);

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

  const handleExport = async () => {
    setDataStatus(null);
    setDataError(null);

    try {
      const payload: BackupPayload = {
        configuration: readLocalJson<AppConfiguration>(
          CONFIG_STORAGE_KEY,
          DEFAULT_CONFIGURATION,
        ),
        fuelRecords: readLocalJson<FuelRecord[]>(FUEL_STORAGE_KEY, []),
        maintenanceRecords: readLocalJson<MaintenanceRecord[]>(
          MAINTENANCE_STORAGE_KEY,
          [],
        ),
      };
      const rawPayload = JSON.stringify(payload);
      const checksum = await computeChecksum(rawPayload);
      if (!checksum) {
        throw new Error("Checksum generation failed");
      }
      const envelope: BackupEnvelope = {
        checksum,
        payload,
      };
      const encoded = encodeBase64(JSON.stringify(envelope));
      if (!encoded) {
        throw new Error("Encoding failed");
      }
      setExportValue(encoded);
      setImportValue("");
      setDataStatus(
        "Data export ready. Copy the backup string below and store it safely.",
      );
    } catch (error) {
      console.error("Failed to export data", error);
      setDataError("Failed to export data. Please try again.");
    }
  };

  const requestImport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDataStatus(null);
    setDataError(null);

    if (!importValue.trim()) {
      setDataError("Paste a backup string before importing.");
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleImport = async () => {
    setDataStatus(null);
    setDataError(null);

    const value = importValue.trim();
    if (!value) {
      setDataError("Paste a backup string before importing.");
      setIsConfirmOpen(false);
      return;
    }

    try {
      const json = decodeBase64(value);
      const parsed = JSON.parse(json) as BackupEnvelope;
      if (!parsed?.payload || typeof parsed.checksum !== "string") {
        throw new Error("Invalid backup structure");
      }

      const rawPayload = JSON.stringify(parsed.payload);
      const expected = await computeChecksum(rawPayload);
      if (!expected || expected !== parsed.checksum) {
        throw new Error("Checksum mismatch");
      }

      const payload = parsed.payload;

      const configuration = payload.configuration?.currencyCode
        ? (() => {
            const nextCode = normaliseCode(payload.configuration.currencyCode);
            return /^[A-Z]{3}$/.test(nextCode)
              ? { currencyCode: nextCode }
              : DEFAULT_CONFIGURATION;
          })()
        : DEFAULT_CONFIGURATION;
      const fuelRecords = Array.isArray(payload.fuelRecords)
        ? payload.fuelRecords
        : [];
      const maintenanceRecords = Array.isArray(payload.maintenanceRecords)
        ? payload.maintenanceRecords
        : [];

      clearAllLocalData();

      setConfig(configuration);
      setCustomCode("");
      setStatus("Preferences restored from backup.");

      writeLocalJson(CONFIG_STORAGE_KEY, configuration);
      writeLocalJson(FUEL_STORAGE_KEY, fuelRecords);
      writeLocalJson(MAINTENANCE_STORAGE_KEY, maintenanceRecords);

      setDataStatus(
        "Backup imported after clearing existing data. Check your dashboards to confirm everything looks right.",
      );
      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Failed to import data", error);
      setDataError(
        "Could not import the backup. It may have been modified or is corrupted.",
      );
      setIsConfirmOpen(false);
    }
  };

  const toggleExportFields = () => {
    const next = !showExportFields;
    setShowExportFields(next);
    if (next) {
      setShowImportFields(false);
      void handleExport();
    }
  };

  const toggleImportFields = () => {
    const next = !showImportFields;
    setShowImportFields(next);
    if (next) {
      setShowExportFields(false);
    }
  };

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

      <Card
        title="Data backup"
        subtitle="Export or import everything saved in your browser."
      >
        {dataError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {dataError}
          </p>
        )}
        {dataStatus && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {dataStatus}
          </p>
        )}

        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleExportFields}
              className={`inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${
                showExportFields
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:text-neutral-900"
              }`}
            >
              Export
            </button>
            <button
              type="button"
              onClick={toggleImportFields}
              className={`inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${
                showImportFields
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:text-neutral-900"
              }`}
            >
              Import
            </button>
          </div>

          {showExportFields && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                Generate a backup that captures your preferences, fuel log, and
                maintenance reminders.
              </p>
              <p className="text-xs text-neutral-500">
                Copy the text below to keep a backup elsewhere.
              </p>
              <textarea
                value={exportValue}
                readOnly
                rows={4}
                placeholder="Your base64 export will appear here."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-mono text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
            </div>
          )}

          {showImportFields && (
            <form className="space-y-3" onSubmit={requestImport}>
              <p className="text-sm text-neutral-600">
                Restore data from a backup made on this device.
              </p>
              <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
                <span>Backup string</span>
                <textarea
                  value={importValue}
                  onChange={(event) => setImportValue(event.target.value)}
                  rows={4}
                  placeholder="Paste a base64 backup string to restore your data."
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-mono text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Import data
                </button>
                <button
                  type="button"
                  onClick={() => setImportValue("")}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
                >
                  Clear
                </button>
                <span className="text-xs text-neutral-500">
                  Importing wipes the current data on this device before
                  restoring the backup.
                </span>
              </div>
            </form>
          )}
        </section>
      </Card>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-import-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3
              id="confirm-import-title"
              className="text-lg font-semibold text-neutral-900"
            >
              Replace local data?
            </h3>
            <p className="mt-3 text-sm text-neutral-600">
              Importing a backup first deletes everything stored on this device
              and then loads the backup you provide. Continue?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleImport();
                }}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Yes, replace data
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
