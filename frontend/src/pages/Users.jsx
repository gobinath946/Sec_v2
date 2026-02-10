import React from 'react';

const Users = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-accent">Users</h1>
          <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition">
            Add User
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <p className="text-gray-500">No users yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
