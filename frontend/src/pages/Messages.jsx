import React from 'react';

const Messages = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-accent mb-8">Messages</h1>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <p className="text-gray-500">No messages yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
