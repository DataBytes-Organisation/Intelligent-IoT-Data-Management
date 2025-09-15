import React from "react";
import { BellIcon } from "lucide-react";

const NotificationBanner = ({ message }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center">
        <BellIcon className="h-5 w-5 text-green-600 mr-2" />
        <p className="text-green-800 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default NotificationBanner;
