import { useEffect, useState } from "react";
import { datasets as seed } from "../data/datasets";

export default function useDatasets() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Try real API here later; for now just use seed
        await new Promise(r => setTimeout(r, 120)); // optional tiny delay for skeleton
        if (!cancelled) {
          setDatasets(seed);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { datasets, loading, error };
}
