import { useParams } from "react-router-dom";
import Dashboard from "../components/Dashboard";

const DashboardPage = () => {
  const { id } = useParams();

  const formatSensorId = (sensorId) => {
    if (sensorId.startsWith("sensor") && sensorId.length > 6) {
      const number = sensorId.substring(6); // Extract the number part
      return `Sensor ${number}`;
    }
    return sensorId;
  };

  const formattedId = formatSensorId(id);

  return (
    <div>
      <h2>Dashboard for {formattedId}</h2>
      <Dashboard datasetId={id} />
    </div>
  );
};

export default DashboardPage;
