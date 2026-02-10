import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/80 backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-7 h-7 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">SecureGateway</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-5">
            <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors text-xs font-medium">Features</a>
            <a href="#how-it-works" className="text-gray-700 hover:text-green-600 transition-colors text-xs font-medium">How It Works</a>
            <a href="#security" className="text-gray-700 hover:text-green-600 transition-colors text-xs font-medium">Security</a>
            <a href="#pricing" className="text-gray-700 hover:text-green-600 transition-colors text-xs font-medium">Pricing</a>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Login
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
