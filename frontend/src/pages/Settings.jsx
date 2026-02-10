import React from 'react';

const Settings = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-accent mb-8">Settings</h1>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button className="px-6 py-4 border-b-2 border-primary text-primary font-medium">
                Storage
              </button>
              <button className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                Email
              </button>
              <button className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                SMS
              </button>
            </nav>
          </div>

          <div className="p-6">
            <p className="text-gray-500">Configure your settings here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
