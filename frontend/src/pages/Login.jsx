import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, formData);
      console.log('Success:', response.data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - 70% content */}
      <div className="w-full lg:w-7/10 bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center p-8">
        <div className="text-white max-w-2xl">
          <h1 className="text-5xl font-bold mb-6">Welcome to Secure Gateway</h1>
          <p className="text-xl mb-8">
            The most trusted electronic signature platform for businesses worldwide
          </p>
          <ul className="space-y-4 text-lg">
            <li className="flex items-center">
              <span className="mr-3">✓</span>
              Multi-tenant architecture
            </li>
            <li className="flex items-center">
              <span className="mr-3">✓</span>
              Advanced security features
            </li>
            <li className="flex items-center">
              <span className="mr-3">✓</span>
              Comprehensive audit logging
            </li>
          </ul>
        </div>
      </div>

      {/* Right side - 30% form */}
      <div className="w-full lg:w-3/10 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-accent mb-8">
            {isLogin ? 'Login' : 'Register'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Company Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </>
            )}
            
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-opacity-90 transition font-semibold"
            >
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
