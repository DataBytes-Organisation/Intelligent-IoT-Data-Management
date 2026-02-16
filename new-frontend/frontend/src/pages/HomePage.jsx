import Header from "../components/Header";
import Section from "../components/Section";
import DatasetsGrid from "../components/DatasetsGrid";
import Footer from "../components/Footer";
import useDatasets from "../hooks/useDatasets";

export default function HomePage({ toggleTheme, isDarkMode }) {
  const { datasets, loading, error } = useDatasets();

  return (
    // Light: soft gradient | Dark: pure black (no gradient)
    <div className="app-shell min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:bg-black dark:bg-none">
      <Header toggleTheme={toggleTheme} isDarkMode={isDarkMode} />

      <Section id="hero" className="pt-10 pb-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          IoT Sensors Dashboard
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-white">
          Time-series data, anomaly awareness, and correlation insights — all in one place.
        </p>
      </Section>

      <DatasetsGrid datasets={datasets} loading={loading} error={error} />
      <Footer />
    </div>
  );
}
