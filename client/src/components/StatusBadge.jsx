import { cn, getPriorityTone, getStatusTone } from "../utils/helpers.js";

// Professional status badge with subtle dot indicator
const palette = {
  blue:   { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6" },
  orange: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa", dot: "#f97316" },
  yellow: { bg: "#fefce8", text: "#92400e", border: "#fde68a", dot: "#eab308" },
  green:  { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", dot: "#22c55e" },
  red:    { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca", dot: "#ef4444" },
  slate:  { bg: "#f8fafc", text: "#475569", border: "#e2e8f0", dot: "#94a3b8" },
};

export function StatusBadge({ status, type = "status", className = "" }) {
  const tone = type === "priority" ? getPriorityTone(status) : getStatusTone(status);
  const colors = palette[tone] || palette.slate;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        className
      )}
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: colors.dot }}
      />
      {status}
    </span>
  );
}
