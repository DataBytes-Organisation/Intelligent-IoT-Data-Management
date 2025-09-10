import DatasetCard from "./DatasetCard";
import Section from "./Section";

function Skeleton() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-md">
          <div className="h-20 bg-slate-200 animate-pulse" />
          <div className="p-6 space-y-3">
            <div className="h-4 w-1/3 bg-slate-200 animate-pulse" />
            <div className="h-4 w-2/3 bg-slate-200 animate-pulse" />
            <div className="h-8 w-24 bg-slate-200 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DatasetsGrid({ datasets = [], loading = false, error = null }) {
  return (
    <Section id="datasets" title="Available Sensor Datasets" center className="pb-16">
      {error && (
        <div className="mb-6 rounded-lg bg-rose-50 p-4 text-rose-700">
          Could not load datasets. Please try again.
        </div>
      )}
      {loading ? (
        <Skeleton />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((ds) => <DatasetCard key={ds.id} dataset={ds} />)}
        </div>
      )}
    </Section>
  );
}
