export default function StatusBadge({ status = "offline" }) {
  const palette = {
    live:   { pill: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-600", text: "Live" },
    offline:{ pill: "bg-rose-100 text-rose-700",       dot: "bg-rose-600",    text: "Offline" },
    degraded:{ pill:"bg-amber-100 text-amber-800",     dot: "bg-amber-600",   text: "Degraded" },
  };
  const s = palette[status] || palette.offline;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> {s.text}
    </span>
  );
}
