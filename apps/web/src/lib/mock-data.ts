// Mock data utilities — can be used from both server and client components

export interface ResponseTimeDataPoint {
  time: string;
  responseTime: number;
}

export function generateMockResponseTimeData(
  hours: number = 24
): ResponseTimeDataPoint[] {
  const data: ResponseTimeDataPoint[] = [];
  const now = new Date();
  for (let i = hours * 6; i >= 0; i--) {
    const time = new Date(now);
    time.setMinutes(time.getMinutes() - i * 10);
    const baseTime = 120 + Math.sin(i / 10) * 30;
    const noise = ((i * 7919) % 100 - 50) * 0.4; // deterministic "noise"
    data.push({
      time: time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      responseTime: Math.round(Math.max(50, baseTime + noise)),
    });
  }
  return data;
}

export interface UptimeDay {
  date: string;
  uptimePercent: number;
  checksTotal: number;
  checksFailed: number;
}

// Deterministic mock uptime data using a simple seeded random
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function generateMockUptimeDays(
  numDays: number = 90,
  seed: number = 42
): UptimeDay[] {
  const days: UptimeDay[] = [];
  const rand = seededRandom(seed);
  const now = new Date();
  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const r = rand();
    let uptimePercent: number;
    if (r > 0.95) {
      uptimePercent = 85 + rand() * 14;
    } else if (r > 0.9) {
      uptimePercent = 95 + rand() * 4.5;
    } else {
      uptimePercent = 99.5 + rand() * 0.5;
    }
    const checksTotal = 288;
    const checksFailed = Math.round(
      checksTotal * ((100 - uptimePercent) / 100)
    );
    days.push({
      date: date.toISOString().split("T")[0]!,
      uptimePercent,
      checksTotal,
      checksFailed,
    });
  }
  return days;
}
