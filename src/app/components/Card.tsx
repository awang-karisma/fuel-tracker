"use client";

import type { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
}

export function Card({ title, subtitle, children }: CardProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      {(title || subtitle) && (
        <header className="mb-4 space-y-1">
          {title && (
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          )}
          {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
        </header>
      )}
      <div className="space-y-4 text-sm text-neutral-700">{children}</div>
    </section>
  );
}
