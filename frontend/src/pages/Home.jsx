import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-2xl font-bold text-primary">
              Secure Gateway
            </div>
            <Link 
              to="/login" 
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-accent mb-6">
            Electronic Signature Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Secure, fast, and compliant e-signature solution for your business
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/login" 
              className="bg-primary text-white px-8 py-3 rounded-lg text-lg hover:bg-opacity-90 transition"
            >
              Get Started
            </Link>
            <button className="border-2 border-primary text-primary px-8 py-3 rounded-lg text-lg hover:bg-primary hover:text-white transition">
              Learn More
            </button>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Secure</h3>
            <p className="text-gray-600">
              Bank-level encryption and multi-factor authentication
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Fast</h3>
            <p className="text-gray-600">
              Sign documents in seconds from any device
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-xl font-semibold mb-2">Compliant</h3>
            <p className="text-gray-600">
              Full audit trail and legal compliance
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
