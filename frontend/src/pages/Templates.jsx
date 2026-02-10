import React from 'react';

const Templates = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-accent">Templates</h1>
          <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition">
            Create Template
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <p className="text-gray-500">No templates yet. Create your first template to get started.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Templates;
