import React from 'react';
import { useParams } from 'react-router-dom';

const DocumentSign = () => {
  const { sessionId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-accent mb-6">Document Signature</h1>
          <p className="text-gray-600 mb-4">Session ID: {sessionId}</p>
          <p className="text-gray-500">Document signing interface will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentSign;
