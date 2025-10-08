import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure system preferences and user settings</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">
          Settings page will be implemented here with risk threshold configuration, 
          user preferences, API status monitoring, and system configuration options.
        </p>
      </div>
    </div>
  );
};

export default Settings;
