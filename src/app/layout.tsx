import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { NavBar } from "./components/NavBar";

const SITE_NAME = "Fuel Tracker";
const SITE_DESCRIPTION =
  "Track fuel usage and maintenance locally in your browser.";
const OG_IMAGE_PATH = "/og-image.png";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_PATH,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
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
