"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/fuel-log", label: "Fuel Log" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/config", label: "Config" },
];

const isActive = (currentPath: string, href: string) => {
  if (href === "/") {
    return currentPath === href || currentPath === "/dashboard";
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
};

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="text-lg font-semibold tracking-tight text-neutral-900">
          Fuel Tracker
        </span>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-600">
          {links.map((link) => {
            const classes = [
              "rounded px-3 py-1 transition hover:bg-neutral-100 hover:text-neutral-900",
              isActive(pathname, link.href) ? "bg-neutral-900 text-white" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <Link key={link.href} href={link.href} className={classes}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
