"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIGURATION } from "../lib/config";
import { formatCurrency } from "../lib/format";
import { createId } from "../lib/id";
import type { AppConfiguration, FuelRecord } from "../types";

const STORAGE_KEY = "fuel-tracker:fuel-records";

const formatNumber = (value: number, fractionDigits = 2) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

export default function FuelLogPage() {
  const [fuelRecords, setFuelRecords] = useLocalStorage<FuelRecord[]>(
    STORAGE_KEY,
    [],
  );
  const [configuration] = useLocalStorage<AppConfiguration>(
    CONFIG_STORAGE_KEY,
    DEFAULT_CONFIGURATION,
  );
  const [odometerInput, setOdometerInput] = useState("");
  const [volumeInput, setVolumeInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const currencyCode =
    configuration.currencyCode || DEFAULT_CONFIGURATION.currencyCode;
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastPrice = useMemo(() => {
    if (fuelRecords.length === 0) {
      return "";
    }
    const last = fuelRecords[fuelRecords.length - 1];
    return last.fuelPrice.toString();
  }, [fuelRecords]);

  useEffect(() => {
    if (!priceInput && lastPrice) {
      setPriceInput(lastPrice);
    }
  }, [lastPrice, priceInput]);

  const metricsById = useMemo(() => {
    const ordered = [...fuelRecords].sort((a, b) => a.odometer - b.odometer);
    const result = new Map<
      string,
      { distance: number | null; efficiency: number | null }
    >();

    for (let index = 0; index < ordered.length; index += 1) {
      const record = ordered[index];
      const previous = index > 0 ? ordered[index - 1] : undefined;
      if (!previous) {
        result.set(record.id, { distance: null, efficiency: null });
        continue;
      }
      const distance = record.odometer - previous.odometer;
      const efficiency =
        distance > 0 && record.fuelVolume > 0
          ? distance / record.fuelVolume
          : null;
      result.set(record.id, {
        distance: distance > 0 ? distance : null,
        efficiency: efficiency !== null ? efficiency : null,
      });
    }

    return result;
  }, [fuelRecords]);

  const sortedRecords = useMemo(() => {
    return [...fuelRecords].sort(
      (a, b) =>
        new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime(),
    );
  }, [fuelRecords]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const odometer = Number(odometerInput);
    const volume = Number(volumeInput);
    const price = Number(priceInput);

    if (!Number.isFinite(odometer) || odometer <= 0) {
      setError("Please enter a valid odometer reading.");
      return;
    }

    if (fuelRecords.length > 0) {
      const highestOdometer = fuelRecords.reduce(
        (max, record) => (record.odometer > max ? record.odometer : max),
        fuelRecords[0].odometer,
      );
      if (odometer <= highestOdometer) {
        setError(
          "Odometer must be greater than your last recorded reading (" +
            highestOdometer.toLocaleString() +
            " km).",
        );
        return;
      }
    }

    if (!Number.isFinite(volume) || volume <= 0) {
      setError("Fuel volume must be greater than zero.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Please provide a fuel price.");
      return;
    }

    const record: FuelRecord = {
      id: createId(),
      odometer: odometer,
      fuelVolume: volume,
      fuelPrice: price,
      entryDate: new Date().toISOString(),
    };

    setFuelRecords((current) => [...current, record]);
    setOdometerInput("");
    setVolumeInput("");
    setMessage("Fuel entry saved.");
  };

  const removeFuelRecord = (id: string) => {
    setFuelRecords((current) => current.filter((record) => record.id !== id));
    setError(null);
    setMessage("Fuel entry removed.");
  };

  const resetForm = () => {
    setOdometerInput("");
    setVolumeInput("");
    setPriceInput(lastPrice);
    setMessage(null);
    setError(null);
  };
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:py-10">
      <Card
        title="Log a refuel"
        subtitle="Record odometer, volume, and price to stay on top of your running costs."
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
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              <span>Odometer</span>
              <input
                value={odometerInput}
                onChange={(event) => setOdometerInput(event.target.value)}
                type="number"
                min="0"
                step="any"
                required
                placeholder="e.g. 45210"
                className="h-11 rounded-lg border border-neutral-300 px-3 text-base text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              <span>Fuel volume (L)</span>
              <input
                value={volumeInput}
                onChange={(event) => setVolumeInput(event.target.value)}
                type="number"
                min="0"
                step="any"
                required
                placeholder="e.g. 45.2"
                className="h-11 rounded-lg border border-neutral-300 px-3 text-base text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              <span>Fuel price ({currencyCode})</span>
              <input
                value={priceInput}
                onChange={(event) => setPriceInput(event.target.value)}
                type="number"
                min="0"
                step="any"
                required
                placeholder="e.g. 1.78"
                className="h-11 rounded-lg border border-neutral-300 px-3 text-base text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Save entry
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-300 px-6 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
            >
              Reset
            </button>
            <span className="text-xs text-neutral-500">
              Last price will prefill for you next time.
            </span>
          </div>
        </form>
      </Card>
      <Card
        title="Fuel history"
        subtitle="Latest refuels appear first. Distances are measured from the previous entry."
      >
        {sortedRecords.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No fuel entries yet. Save your first refuel to see your history.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3 sm:hidden">
              {sortedRecords.map((record) => {
                const metrics = metricsById.get(record.id);
                const distance = metrics ? metrics.distance : null;
                const efficiency = metrics ? metrics.efficiency : null;
                const distanceLabel =
                  distance !== null ? `${distance.toLocaleString()} km` : "N/A";
                const efficiencyLabel =
                  efficiency !== null
                    ? `${formatNumber(efficiency)} km per L`
                    : "N/A";
                return (
                  <div
                    key={record.id}
                    className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="font-semibold text-neutral-900">
                        {new Date(record.entryDate).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFuelRecord(record.id)}
                        className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                      >
                        Delete
                      </button>
                    </div>
                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                      <dt className="text-xs uppercase tracking-wide text-neutral-500">
                        Odometer
                      </dt>
                      <dd className="text-sm text-neutral-700">
                        {record.odometer.toLocaleString()} km
                      </dd>
                      <dt className="text-xs uppercase tracking-wide text-neutral-500">
                        Volume
                      </dt>
                      <dd className="text-sm text-neutral-700">
                        {formatNumber(record.fuelVolume)} L
                      </dd>
                      <dt className="text-xs uppercase tracking-wide text-neutral-500">
                        Price ({currencyCode})
                      </dt>
                      <dd className="text-sm text-neutral-700">
                        {formatCurrency(record.fuelPrice, currencyCode)}
                      </dd>
                      <dt className="text-xs uppercase tracking-wide text-neutral-500">
                        Distance
                      </dt>
                      <dd className="text-sm text-neutral-700">
                        {distanceLabel}
                      </dd>
                      <dt className="text-xs uppercase tracking-wide text-neutral-500">
                        Distance per L
                      </dt>
                      <dd className="text-sm text-neutral-700">
                        {efficiencyLabel}
                      </dd>
                    </dl>
                  </div>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="pb-3 pr-6">Date</th>
                    <th className="pb-3 pr-6">Odometer</th>
                    <th className="pb-3 pr-6">Volume (L)</th>
                    <th className="pb-3 pr-6">Price ({currencyCode})</th>
                    <th className="pb-3 pr-6">Distance</th>
                    <th className="pb-3">Distance per L</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {sortedRecords.map((record) => {
                    const metrics = metricsById.get(record.id);
                    const distance = metrics ? metrics.distance : null;
                    const efficiency = metrics ? metrics.efficiency : null;
                    const distanceLabel =
                      distance !== null
                        ? `${distance.toLocaleString()} km`
                        : "N/A";
                    const efficiencyLabel =
                      efficiency !== null
                        ? `${formatNumber(efficiency)} km per L`
                        : "N/A";
                    return (
                      <tr key={record.id} className="align-top">
                        <td className="py-3 pr-6 text-neutral-600">
                          {new Date(record.entryDate).toLocaleString()}
                        </td>
                        <td className="py-3 pr-6">
                          {record.odometer.toLocaleString()} km
                        </td>
                        <td className="py-3 pr-6">
                          {formatNumber(record.fuelVolume)} L
                        </td>
                        <td className="py-3 pr-6">
                          {formatCurrency(record.fuelPrice, currencyCode)}
                        </td>
                        <td className="py-3 pr-6">{distanceLabel}</td>
                        <td className="py-3">{efficiencyLabel}</td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeFuelRecord(record.id)}
                            className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
