import React, { useState } from "react";
import {
  Home,
  Database,
  BarChart2,
  FileText,
  Thermometer,
  Droplet,
  Wind,
  Bell,
  Settings,
} from "lucide-react";

const SideBar = () => {
  const [active, setActive] = useState("Dashboard");
  const [sensorOpen, setSensorOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} /> },
    { name: "Data Sources", icon: <Database size={18} /> },
    { name: "Analytics", icon: <BarChart2 size={18} /> },
    { name: "Reports", icon: <FileText size={18} /> },
  ];

  const sensorItems = [
    { name: "Temperature", icon: <Thermometer size={16} /> },
    { name: "Humidity", icon: <Droplet size={16} /> },
    { name: "Air Quality", icon: <Wind size={16} /> },
  ];

  const bottomItems = [
    { name: "Alerts", icon: <Bell size={18} /> },
    { name: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <aside className="w-64 h-screen bg-gray-900 text-gray-200 shadow-lg flex flex-col">
      {/* Title */}
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        SensorDash
      </div>

      {/* Scrollable Top Section */}
      <div className="flex-1 overflow-y-auto">
        <ul className="p-2 space-y-2">
          {menuItems.map((item) => (
            <li
              key={item.name}
              onClick={() => setActive(item.name)}
              className={`flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer transition 
                ${
                  active === item.name
                    ? "bg-gray-800 text-blue-400 border-l-4 border-blue-500"
                    : "hover:bg-gray-800 hover:text-blue-300"
                }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </li>
          ))}

          {/* Sensors Group */}
          <li>
            <button
              onClick={() => setSensorOpen(!sensorOpen)}
              className="flex items-center w-full gap-3 px-4 py-2 rounded-md cursor-pointer hover:bg-gray-800 hover:text-blue-300 transition"
            >
              <Thermometer size={18} />
              <span>Sensors</span>
            </button>
            {sensorOpen && (
              <ul className="ml-6 mt-1 space-y-1">
                {sensorItems.map((sub) => (
                  <li
                    key={sub.name}
                    onClick={() => setActive(sub.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition
                      ${
                        active === sub.name
                          ? "bg-gray-800 text-blue-400 border-l-4 border-blue-500"
                          : "hover:bg-gray-800 hover:text-blue-300"
                      }`}
                  >
                    {sub.icon}
                    <span>{sub.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </div>

      {/* Bottom Fixed Section */}
      <div className="p-2 border-t border-gray-700">
        {bottomItems.map((item) => (
          <div
            key={item.name}
            onClick={() => setActive(item.name)}
            className={`flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer transition 
              ${
                active === item.name
                  ? "bg-gray-800 text-blue-400 border-l-4 border-blue-500"
                  : "hover:bg-gray-800 hover:text-blue-300"
              }`}
          >
            {item.icon}
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SideBar;
