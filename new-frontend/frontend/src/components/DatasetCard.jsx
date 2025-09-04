import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import Icon from "./Icon";

const GRADIENT = {
  temperature: "from-teal-600 to-teal-500",
  humidity:    "from-orange-600 to-amber-500",
  air:         "from-violet-600 to-fuchsia-500",
  default:     "from-slate-600 to-slate-500",
};

export default function DatasetCard({ dataset }) {
  const { id, name, description, type, status, anomalies24h, gradient } = dataset;
  const g = gradient || GRADIENT[type] || GRADIENT.default;

  return (
    <Link
      to={`/dashboard/${encodeURIComponent(id)}`}
      className="
        group rounded-2xl overflow-hidden
        bg-white border border-slate-200 shadow-md
        transition-all hover:-translate-y-0.5 hover:shadow-xl
        focus:outline-none focus:ring-4 focus:ring-indigo-300
        dark:bg-black dark:border-neutral-800 dark:shadow-black/30
        dark:focus:ring-indigo-800/40
      "
    >
      {/* Top gradient header */}
      <div className={`bg-gradient-to-r ${g} text-white`}>
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
              <Icon name={type} />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-wide opacity-90">Dataset</div>
              <h3 className="text-2xl font-semibold">{name}</h3>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="h-2 bg-white/25" />
      </div>

      {/* Body */}
      <div className="p-6 divide-y divide-gray-100 dark:divide-neutral-800">
        <div className="pb-4">
          <p className="text-slate-600 dark:text-white text-center">{description}</p>
        </div>

        <div className="py-4 flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-white">Last 24h anomalies</span>
          <span
            className={`
              rounded-full px-2.5 py-1 text-sm font-semibold
              ${(anomalies24h ?? 0) > 0
                ? "bg-rose-50 text-rose-600 dark:bg-rose-600/30 dark:text-rose-200"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-600/30 dark:text-emerald-200"}
            `}
          >
            {anomalies24h ?? 0}
          </span>
        </div>

        <div className="pt-4">
          <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-300 font-medium group-hover:translate-x-0.5 transition-transform">
            View dashboard →
          </span>
        </div>
      </div>
    </Link>
  );
}
