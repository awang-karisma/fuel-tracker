"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { createId } from "../lib/id";
import type { MaintenanceRecord } from "../types";

const STORAGE_KEY = "fuel-tracker:maintenance-records";

export default function MaintenancePlannerPage() {
  const [records, setRecords] = useLocalStorage<MaintenanceRecord[]>(
    STORAGE_KEY,
    [],
  );
  const [odometerInput, setOdometerInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => a.targetOdometer - b.targetOdometer);
  }, [records]);

  const nextMaintenance = sortedRecords.length > 0 ? sortedRecords[0] : null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const targetOdometer = Number(odometerInput);
    const description = descriptionInput.trim();

    if (!Number.isFinite(targetOdometer) || targetOdometer <= 0) {
      setError("Please enter a valid odometer target.");
      return;
    }
    if (!description) {
      setError("Add a short description so you know what needs attention.");
      return;
    }

    const record: MaintenanceRecord = {
      id: createId(),
      targetOdometer: targetOdometer,
      description: description,
      createdAt: new Date().toISOString(),
    };

    setRecords((current) => [...current, record]);
    setOdometerInput("");
    setDescriptionInput("");
    setMessage("Maintenance reminder saved.");
  };

  const removeRecord = (id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id));
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:py-10">
      <Card
        title="Plan upcoming maintenance"
        subtitle="Capture the odometer reading and a quick note for what needs to happen next."
      >
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              <span>Target odometer</span>
              <input
                value={odometerInput}
                onChange={(event) => setOdometerInput(event.target.value)}
                type="number"
                min="0"
                step="any"
                required
                placeholder="e.g. 50000"
                className="h-11 rounded-lg border border-neutral-300 px-3 text-base text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              <span>What needs to be done?</span>
              <textarea
                value={descriptionInput}
                onChange={(event) => setDescriptionInput(event.target.value)}
                rows={3}
                required
                placeholder="Oil change, rotate tyres, brake inspection..."
                className="rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Save reminder
            </button>
            <span className="text-xs text-neutral-500">
              Jot down several so you are always one step ahead.
            </span>
          </div>
        </form>
      </Card>

      <Card
        title="Scheduled maintenance"
        subtitle={
          nextMaintenance
            ? "Nearest reminder sits at the top."
            : "Add a reminder to start building your maintenance plan."
        }
      >
        {sortedRecords.length === 0 ? (
          <p className="text-sm text-neutral-500">
            You have not saved any maintenance reminders yet.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedRecords.map((record) => (
              <div
                key={record.id}
                className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-neutral-900">
                    Odometer {record.targetOdometer.toLocaleString()} km
                  </p>
                  <p className="text-sm text-neutral-600">
                    {record.description}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-neutral-400">
                    Added {new Date(record.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRecord(record.id)}
                  className="self-start rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
