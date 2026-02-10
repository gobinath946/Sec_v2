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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">Benefits</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Transform Your
              <span className="block text-green-600">Document Workflow</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              SecureGateway streamlines your entire document signing process, saving time, reducing costs, 
              and improving efficiency across your organization.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Accelerate Business Processes</h4>
                  <p className="text-gray-600">Close deals faster with instant document delivery and signing</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Reduce Environmental Impact</h4>
                  <p className="text-gray-600">Go paperless and contribute to sustainability goals</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Improve Customer Experience</h4>
                  <p className="text-gray-600">Provide a seamless, modern signing experience</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-white rounded-xl p-8 border border-green-100 hover:shadow-lg transition-all duration-300">
                <div className="text-5xl font-bold text-green-600 mb-2">{benefit.stat}</div>
                <div className="text-xl font-bold text-gray-900 mb-2">{benefit.label}</div>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
