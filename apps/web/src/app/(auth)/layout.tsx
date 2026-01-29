import Link from "next/link";
import { Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold"
          >
            <Activity className="h-6 w-6 text-emerald-400" />
            apimon
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
