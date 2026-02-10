import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-gradient-to-br from-green-50 to-white pt-20">
      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div className="inline-block">
              <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                Trusted Digital Signatures
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Sign Documents
              <span className="block text-green-600">Securely Online</span>
            </h1>
            
            <p className="text-base text-gray-600 leading-relaxed">
              Legally binding digital e-signatures with enterprise-grade security. 
              Sign, send, and manage documents from anywhere.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                Get Started Free
              </button>
              <button className="bg-white hover:bg-gray-50 text-gray-900 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 border-2 border-gray-200 hover:border-green-600">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center gap-4 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">No credit card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Free trial</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 bg-white rounded-lg shadow-lg p-4 border border-gray-100">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-700 font-semibold text-xs">Document Ready</span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Active</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-xs">Contract Agreement</p>
                      <p className="text-xs text-gray-500">Ready for signature</p>
                    </div>
                  </div>
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-3 text-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1.5">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-medium text-xs">Click to Sign</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-lg -z-0"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
