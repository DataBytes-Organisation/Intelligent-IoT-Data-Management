import { Link } from "react-router-dom";

const datasets = [
  { id: "sensor1", name: "Sensor 1" },
  { id: "sensor2", name: "Sensor 2" },
  { id: "sensor3", name: "Sensor 3" },
];

const HomePage = () => (
  <div className="max-w-2xl mx-auto p-6">
    <h2 className="text-2xl font-semibold text-center mb-6">
      Available Sensor Datasets
    </h2>
    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {datasets.map((ds) => (
        <li key={ds.id}>
          <Link
            to={`/dashboard/${ds.id}`}
            className="block bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm hover:shadow-md hover:border-gray-300 transition"
          >
            {ds.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default HomePage;
