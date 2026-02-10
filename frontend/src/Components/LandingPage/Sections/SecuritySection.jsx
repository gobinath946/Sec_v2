import React from 'react';

const SecuritySection = () => {
  const securityFeatures = [
    {
      title: '256-bit Encryption',
      description: 'All documents are encrypted with AES 256-bit encryption, the same standard used by banks and government agencies.',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: 'Audit Trail',
      description: 'Complete audit trail with timestamps, IP addresses, and authentication details for every action.',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Compliance Certified',
      description: 'Compliant with GDPR, SOC 2, ISO 27001, and meets global e-signature regulations.',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: 'Two-Factor Authentication',
      description: 'Optional 2FA adds an extra layer of security to protect sensitive documents and signatures.',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <section id="security" className="py-12 bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10">
          <span className="text-green-400 font-semibold text-xs uppercase tracking-wide">Security First</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold">
            Your Documents Are
            <span className="block text-green-400">Safe With Us</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-5 border border-white/10 hover:border-green-500/50 transition-all duration-300">
              <div className="text-green-400 mb-3">{feature.icon}</div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Trusted by 10,000+ Organizations Worldwide</h3>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Join leading companies who trust SecureGateway for their critical document signing needs
          </p>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
