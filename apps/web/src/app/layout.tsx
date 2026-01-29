import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "apimon — CLI-First API Monitoring & Alerting",
    template: "%s | apimon",
  },
  description:
    "API monitoring for developers who live in the terminal. Monitor uptime, get instant alerts, and share beautiful status pages.",
  keywords: [
    "API monitoring",
    "uptime",
    "CLI",
    "status page",
    "alerting",
    "developer tools",
  ],
  openGraph: {
    title: "apimon — CLI-First API Monitoring",
    description:
      "Monitor your APIs from the terminal. Instant alerts on Telegram, Slack, Discord & more.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
