"use client";

import { useEffect, useState } from "react";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "success" | "info";
  delay: number;
}

const DEMO_LINES: TerminalLine[] = [
  { text: "$ npx apimon login", type: "command", delay: 0 },
  { text: "✓ Authenticated as dev@example.com", type: "success", delay: 800 },
  { text: "", type: "output", delay: 1200 },
  {
    text: "$ apimon add https://api.example.com/health --interval 1m",
    type: "command",
    delay: 1600,
  },
  {
    text: '✓ Monitor created: "api.example.com" (every 1 min)',
    type: "success",
    delay: 2400,
  },
  { text: "", type: "output", delay: 2800 },
  { text: "$ apimon status", type: "command", delay: 3200 },
  { text: "", type: "output", delay: 3600 },
  {
    text: "  NAME                   STATUS   UPTIME    RESP",
    type: "info",
    delay: 3800,
  },
  {
    text: "  api.example.com        ● UP     99.98%    124ms",
    type: "success",
    delay: 4000,
  },
  {
    text: "  webhook.example.com    ● UP     99.95%    89ms",
    type: "success",
    delay: 4200,
  },
  {
    text: "  auth.example.com       ○ DOWN   98.50%    ---",
    type: "output",
    delay: 4400,
  },
  { text: "", type: "output", delay: 4800 },
  {
    text: "$ apimon check https://api.example.com/v1/users",
    type: "command",
    delay: 5200,
  },
  { text: "✓ 200 OK — 142ms", type: "success", delay: 6000 },
];

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    DEMO_LINES.forEach((line, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(index + 1);
        }, line.delay)
      );
    });

    const restartTimer = setTimeout(() => {
      setVisibleLines(0);
      // Restart the animation
      setTimeout(() => {
        DEMO_LINES.forEach((line, index) => {
          timers.push(
            setTimeout(() => {
              setVisibleLines(index + 1);
            }, line.delay)
          );
        });
      }, 500);
    }, 8000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(restartTimer);
    };
  }, []);

  return (
    <div className="rounded-lg border bg-[#0d1117] overflow-hidden shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
        <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
        <span className="ml-2 text-xs text-[#8b949e] font-mono">
          terminal — apimon
        </span>
      </div>
      {/* Terminal content */}
      <div className="p-4 font-mono text-sm leading-6 min-h-[320px]">
        {DEMO_LINES.slice(0, visibleLines).map((line, index) => (
          <div
            key={index}
            className={
              line.type === "command"
                ? "text-[#e6edf3]"
                : line.type === "success"
                  ? "text-[#3fb950]"
                  : line.type === "info"
                    ? "text-[#8b949e]"
                    : "text-[#f85149]"
            }
          >
            {line.text || "\u00A0"}
          </div>
        ))}
        {visibleLines < DEMO_LINES.length && (
          <span className="inline-block w-2 h-4 bg-[#e6edf3] animate-pulse" />
        )}
      </div>
    </div>
  );
}
