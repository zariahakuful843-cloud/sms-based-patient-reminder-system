import { type ReactNode } from "react";
import { statusColor } from "@/lib/utils";

export function Badge({
  status,
  label,
  className,
  children,
}: {
  status?: string;
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={
        className ??
        `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(status ?? "")}`
      }
    >
      {children ?? label ?? status}
    </span>
  );
}
