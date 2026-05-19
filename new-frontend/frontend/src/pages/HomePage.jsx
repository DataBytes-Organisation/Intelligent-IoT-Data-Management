import Header from "../components/Header";
import Section from "../components/Section";
import DatasetsGrid from "../components/DatasetsGrid";
import Footer from "../components/Footer";
import useDatasets from "../hooks/useDatasets";

export default function HomePage() {
  const { datasets, loading, error } = useDatasets();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header brand="Intelligent IoT" nav={[{href:"#datasets",label:"Datasets"}]} />
      <Section id="hero" className="pt-10 pb-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          IoT Sensors Dashboard
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Time-series data, anomaly awareness, and correlation insights — all in one place.
        </p>
      </Section>
      <DatasetsGrid datasets={datasets} loading={loading} error={error} />
      <Footer />
    </div>
  );
}
