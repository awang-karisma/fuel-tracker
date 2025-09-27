"use client";

import { useMemo } from "react";
import { Card } from "../components/Card";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { FuelRecord, MaintenanceRecord } from "../types";

const FUEL_KEY = "fuel-tracker:fuel-records";
const MAINTENANCE_KEY = "fuel-tracker:maintenance-records";

export default function DashboardPage() {
  return <DashboardView />;
}

export function DashboardView() {
  const [fuelRecords] = useLocalStorage<FuelRecord[]>(FUEL_KEY, []);
  const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>(
    MAINTENANCE_KEY,
    [],
  );

  const sortedFuel = useMemo(() => {
    return [...fuelRecords].sort((a, b) => a.odometer - b.odometer);
  }, [fuelRecords]);

  const sortedMaintenance = useMemo(() => {
    return [...maintenanceRecords].sort(
      (a, b) => a.targetOdometer - b.targetOdometer,
    );
  }, [maintenanceRecords]);

  const chartPoints = useMemo<ChartPoint[]>(() => {
    if (sortedFuel.length < 2) {
      return [];
    }
    const points: ChartPoint[] = [];
    for (let index = 1; index < sortedFuel.length; index += 1) {
      const current = sortedFuel[index];
      const previous = sortedFuel[index - 1];
      const distance = current.odometer - previous.odometer;
      if (distance <= 0 || current.fuelVolume <= 0) {
        continue;
      }
      const litresPerHundred = (current.fuelVolume / distance) * 100;
      const label = new Date(current.entryDate).toLocaleDateString();
      const details =
        "From " +
        previous.odometer.toLocaleString() +
        " km to " +
        current.odometer.toLocaleString() +
        " km";
      points.push({
        id: current.id,
        label,
        details,
        value: litresPerHundred,
      });
    }
    return points;
  }, [sortedFuel]);

  const latestFuelRecord =
    sortedFuel.length > 0 ? sortedFuel[sortedFuel.length - 1] : null;

  const nextMaintenance = useMemo(() => {
    if (sortedMaintenance.length === 0) {
      return null;
    }
    if (!latestFuelRecord) {
      return sortedMaintenance[0];
    }
    const upcoming = sortedMaintenance.find(
      (record) => record.targetOdometer >= latestFuelRecord.odometer,
    );
    return upcoming
      ? upcoming
      : sortedMaintenance[sortedMaintenance.length - 1];
  }, [latestFuelRecord, sortedMaintenance]);

  const maintenancePrediction = useMemo(() => {
    if (sortedMaintenance.length < 2) {
      return null;
    }
    const gaps: number[] = [];
    for (let index = 1; index < sortedMaintenance.length; index += 1) {
      const current = sortedMaintenance[index];
      const previous = sortedMaintenance[index - 1];
      const gap = current.targetOdometer - previous.targetOdometer;
      if (gap > 0) {
        gaps.push(gap);
      }
    }
    if (gaps.length === 0) {
      return null;
    }
    const totalGap = gaps.reduce((sum, value) => sum + value, 0);
    const averageGap = totalGap / gaps.length;
    const latestTarget =
      sortedMaintenance[sortedMaintenance.length - 1].targetOdometer;
    const predictedOdometer = Math.round(latestTarget + averageGap);
    const distanceRemaining = latestFuelRecord
      ? predictedOdometer - latestFuelRecord.odometer
      : null;
    return {
      predictedOdometer,
      averageGap,
      distanceRemaining,
    };
  }, [latestFuelRecord, sortedMaintenance]);

  const totalDistance = useMemo(() => {
    if (sortedFuel.length < 2) {
      return 0;
    }
    return sortedFuel[sortedFuel.length - 1].odometer - sortedFuel[0].odometer;
  }, [sortedFuel]);

  const totalFuel = useMemo(() => {
    return sortedFuel.reduce((sum, record) => sum + record.fuelVolume, 0);
  }, [sortedFuel]);

  const averageEfficiency = useMemo(() => {
    if (sortedFuel.length < 2) {
      return null;
    }
    let distanceSum = 0;
    let fuelSum = 0;
    for (let index = 1; index < sortedFuel.length; index += 1) {
      const current = sortedFuel[index];
      const previous = sortedFuel[index - 1];
      const distance = current.odometer - previous.odometer;
      if (distance > 0) {
        distanceSum += distance;
        fuelSum += current.fuelVolume;
      }
    }
    if (distanceSum === 0 || fuelSum === 0) {
      return null;
    }
    return distanceSum / fuelSum;
  }, [sortedFuel]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:py-10">
      <Card
        title="Overview"
        subtitle="Quick metrics based on your saved refuels."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Refuels
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {sortedFuel.length}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Total fuel added
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {totalFuel > 0 ? `${formatNumber(totalFuel)} L` : "N/A"}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Distance covered
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {totalDistance > 0
                ? `${totalDistance.toLocaleString()} km`
                : "N/A"}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Average efficiency
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {averageEfficiency !== null
                ? `${formatNumber(averageEfficiency)} km per L`
                : "N/A"}
            </p>
          </div>
        </div>
      </Card>

      <Card
        title="Fuel efficiency"
        subtitle="Monitor litres burned per 100 km between your refuels."
      >
        <FuelEfficiencyChart points={chartPoints} />
      </Card>

      <Card
        title="Next maintenance"
        subtitle="Keep an eye on the next job and when the following one might land."
      >
        {nextMaintenance ? (
          <div className="space-y-4 text-sm text-neutral-700">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-600">
                Upcoming task
              </p>
              <p className="mt-2 text-lg font-semibold text-amber-900">
                {nextMaintenance.description}
              </p>
              <p className="text-neutral-600">
                Scheduled at {nextMaintenance.targetOdometer.toLocaleString()}{" "}
                km
              </p>
              {latestFuelRecord && (
                <p className="text-neutral-600">
                  Current odometer {latestFuelRecord.odometer.toLocaleString()}{" "}
                  km
                </p>
              )}
            </div>
            {maintenancePrediction ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Forecast
                </p>
                <p className="font-semibold text-neutral-900">
                  Expect the following reminder around{" "}
                  {maintenancePrediction.predictedOdometer.toLocaleString()} km
                </p>
                <p className="text-neutral-600">
                  Average gap between entries sits near{" "}
                  {Math.round(
                    maintenancePrediction.averageGap,
                  ).toLocaleString()}{" "}
                  km.
                </p>
                {maintenancePrediction.distanceRemaining !== null &&
                  latestFuelRecord && (
                    <p className="text-neutral-600">
                      {maintenancePrediction.distanceRemaining > 0
                        ? "Roughly " +
                          maintenancePrediction.distanceRemaining.toLocaleString() +
                          " km away based on your latest reading."
                        : "You are " +
                          Math.abs(
                            maintenancePrediction.distanceRemaining,
                          ).toLocaleString() +
                          " km past that projection — consider booking soon."}
                    </p>
                  )}
              </div>
            ) : (
              <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-neutral-600">
                Log a couple more maintenance reminders to forecast the one
                after this.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Add a maintenance reminder to surface your next job here.
          </p>
        )}
      </Card>
    </main>
  );
}

interface ChartPoint {
  id: string;
  label: string;
  details: string;
  value: number;
}

const formatNumber = (value: number, fractionDigits = 2) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

function FuelEfficiencyChart({ points }: { points: ChartPoint[] }) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Log at least two refuels to unlock the efficiency chart.
      </p>
    );
  }

  const width = 640;
  const height = 280;
  const padding = 40;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const maxValue = points.reduce(
    (max, point) => (point.value > max ? point.value : max),
    0,
  );
  const yMax = maxValue > 0 ? maxValue : 1;
  const coordinates = points.map((point, index) => {
    const ratio = points.length === 1 ? 0 : index / (points.length - 1);
    const x = padding + ratio * innerWidth;
    const y = padding + (1 - point.value / yMax) * innerHeight;
    return { ...point, x, y };
  });
  const polylinePoints = coordinates
    .map(
      (coordinate) => `${coordinate.x.toFixed(2)},${coordinate.y.toFixed(2)}`,
    )
    .join(" ");

  const ticks = [] as Array<{ value: number; y: number }>;
  const tickCount = 4;
  for (let index = 0; index <= tickCount; index += 1) {
    const value = (yMax / tickCount) * index;
    const y = padding + (1 - value / yMax) * innerHeight;
    ticks.push({ value, y });
  }

  return (
    <div className="space-y-4">
      <svg
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
      >
        <title>Fuel consumption per 100 km</title>
        <desc>
          Each point represents litres used for every 100 km between consecutive
          refuels.
        </desc>
        <rect
          x={padding}
          y={padding}
          width={innerWidth}
          height={innerHeight}
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth={1}
          rx={12}
        />
        {ticks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={padding}
              x2={padding + innerWidth}
              y1={tick.y}
              y2={tick.y}
              stroke="#e2e8f0"
              strokeDasharray="4 8"
            />
            <text
              x={padding - 12}
              y={tick.y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="#64748b"
            >
              {formatNumber(tick.value, 1)}
            </text>
          </g>
        ))}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coordinates.map((coordinate) => (
          <g key={coordinate.id}>
            <circle cx={coordinate.x} cy={coordinate.y} r={5} fill="#1d4ed8" />
          </g>
        ))}
        <text
          x={width / 2}
          y={height - padding / 2}
          textAnchor="middle"
          fontSize="11"
          fill="#475569"
        >
          Litres per 100 km
        </text>
      </svg>
    </div>
  );
}
