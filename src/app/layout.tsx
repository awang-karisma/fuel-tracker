import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "./components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fuel Tracker",
  description: "Track fuel usage and maintenance locally in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyClasses = [
    geistSans.variable,
    geistMono.variable,
    "bg-neutral-100",
    "text-neutral-900",
    "antialiased",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang="en">
      <body className={bodyClasses}>
        <NavBar />
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
