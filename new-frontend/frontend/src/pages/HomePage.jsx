import { Link } from "react-router-dom";

const ThermometerIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 12v4.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const DropletIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 3s6 6.5 6 10a6 6 0 1 1-12 0c0-3.5 6-10 6-10Z" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const AirIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M3 8h11a3 3 0 1 0-3-3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 12h15a3 3 0 1 1-3 3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 16h6" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const datasets = [
  {
    id: "sensor1",
    name: "Sensor 1",
    desc: "Temperature readings",
    gradient: "from-teal-600 to-teal-500",
    icon: ThermometerIcon,
    status: "live",
    anomalies24h: 2,
  },
  {
    id: "sensor2",
    name: "Sensor 2",
    desc: "Humidity monitoring",
    gradient: "from-orange-600 to-amber-500",
    icon: DropletIcon,
    status: "live",
    anomalies24h: 0,
  },
  {
    id: "sensor3",
    name: "Sensor 3",
    desc: "Air quality index",
    gradient: "from-violet-600 to-fuchsia-500",
    icon: AirIcon,
    status: "offline",
    anomalies24h: 5,
  },
];

function StatusBadge({ status }) {
  const isLive = status === "live";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isLive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
      title={isLive ? "Streaming now" : "No recent data"}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isLive ? "bg-emerald-600" : "bg-rose-600"
        }`}
      />
      {isLive ? "Live" : "Offline"}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">

      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">

            <span className="inline-grid h-7 w-7 md:h-8 md:w-8 place-items-center rounded bg-gradient-to-tr from-indigo-600 to-blue-500 text-white text-xs font-bold">
              IoT
            </span>
            <span className="text-base font-semibold tracking-wide">Intelligent IoT</span>
          </div>
          <nav className="hidden gap-6 text-sm md:flex">
            <a href="#datasets" className="hover:text-indigo-600">Datasets</a>
            <a href="#about" className="hover:text-indigo-600">About</a>
            <a href="#contact" className="hover:text-indigo-600">Contact</a>
          </nav>

        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          IoT Sensors Dashboard
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Time-series data, anomaly awareness, and correlation insights — all in one place.
        </p>
      </section>

      <main id="datasets" className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="mb-8 text-center text-2xl font-semibold">Available Sensor Datasets</h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((ds) => {
            const Icon = ds.icon;
            return (
              <Link
                key={ds.id}
                to={`/dashboard/${ds.id}`}
                className="group rounded-2xl overflow-hidden bg-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300"
              >
                <div className={`bg-gradient-to-r ${ds.gradient} text-white`}>
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                        <Icon className="h-6 w-6" />
                      </span>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide opacity-90">Dataset</div>
                        <h3 className="text-2xl font-semibold">
                          {ds.name}
                        </h3>
                      </div>
                    </div>
                    <StatusBadge status={ds.status} />
                  </div>
                  <div className="h-2 bg-white/25" />
                </div>

                <div className="p-6 divide-y divide-gray-100">
                  <div className="pb-4">
                    <p className="text-slate-600">{ds.desc}</p>
                  </div>
                  <div className="py-4 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Last 24h anomalies</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-sm font-semibold ${
                        ds.anomalies24h > 0
                          ? "bg-rose-50 text-rose-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {ds.anomalies24h}
                    </span>
                  </div>
                  <div className="pt-4">
                    <span className="inline-flex items-center gap-1 text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform">
                      View dashboard →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-gray-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 text-sm text-slate-500">
          © {new Date().getFullYear()} Intelligent IoT · Built with React & Tailwind
        </div>
      </footer>
    </div>
  );
}
