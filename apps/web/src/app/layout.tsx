import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "apimon — API Monitoring & Alerting",
  description: "CLI-first API monitoring for developers who live in the terminal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
