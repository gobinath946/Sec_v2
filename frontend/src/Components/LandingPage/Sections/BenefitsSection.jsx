import React from 'react';

const BenefitsSection = () => {
  const benefits = [
    {
      stat: '80%',
      label: 'Faster Turnaround',
      description: 'Complete document signing in minutes instead of days'
    },
    {
      stat: '95%',
      label: 'Cost Reduction',
      description: 'Eliminate printing, scanning, and shipping costs'
    },
    {
      stat: '100%',
      label: 'Legally Binding',
      description: 'Compliant with international e-signature laws'
    },
    {
      stat: '24/7',
      label: 'Always Available',
      description: 'Sign documents anytime, anywhere, on any device'
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-green-600 font-semibold text-xs uppercase tracking-wide">Benefits</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transform Your
              <span className="block text-green-600">Document Workflow</span>
            </h2>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              SecureGateway streamlines your entire document signing process, saving time and reducing costs.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Accelerate Business Processes</h4>
                  <p className="text-gray-600 text-sm">Close deals faster with instant document delivery</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Reduce Environmental Impact</h4>
                  <p className="text-gray-600 text-sm">Go paperless and contribute to sustainability</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Improve Customer Experience</h4>
                  <p className="text-gray-600 text-sm">Provide a seamless, modern signing experience</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-white rounded-lg p-5 border border-green-100 hover:shadow-md transition-all duration-300">
                <div className="text-3xl font-bold text-green-600 mb-1">{benefit.stat}</div>
                <div className="text-base font-bold text-gray-900 mb-1">{benefit.label}</div>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
