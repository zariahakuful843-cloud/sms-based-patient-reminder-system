import { statusColor } from "@/lib/utils";

export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(status)}`}>
      {label ?? status}
    </span>
  );
}
