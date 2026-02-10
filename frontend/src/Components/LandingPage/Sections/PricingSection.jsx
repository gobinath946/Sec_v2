import React from 'react';

const PricingSection = () => {
  const plans = [
    {
      name: 'Starter',
      price: '0',
      period: 'Forever Free',
      description: 'Perfect for individuals and small teams',
      features: [
        '5 documents per month',
        'Basic e-signature',
        'Email support',
        'Mobile app access',
        'Audit trail',
        '1 user'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Professional',
      price: '29',
      period: 'per month',
      description: 'For growing businesses and teams',
      features: [
        'Unlimited documents',
        'Advanced e-signature',
        'Priority support',
        'Custom branding',
        'API access',
        'Up to 10 users',
        'Templates library',
        'Bulk sending'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'Contact us',
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'Unlimited users',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee',
        'Advanced security',
        'Training & onboarding',
        'Custom contracts'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">Pricing</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-gray-900">
            Simple, Transparent
            <span className="block text-green-600">Pricing</span>
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={`relative rounded-2xl p-8 ${plan.popular ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-2xl transform scale-105' : 'bg-white border-2 border-gray-200'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">Most Popular</span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="mb-2">
                  <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price === 'Custom' ? plan.price : `$${plan.price}`}
                  </span>
                  {plan.price !== 'Custom' && plan.price !== '0' && (
                    <span className={`text-lg ${plan.popular ? 'text-green-100' : 'text-gray-600'}`}>/{plan.period}</span>
                  )}
                </div>
                <p className={`${plan.popular ? 'text-green-100' : 'text-gray-600'}`}>{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className={`w-6 h-6 flex-shrink-0 ${plan.popular ? 'text-green-200' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={plan.popular ? 'text-white' : 'text-gray-700'}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${plan.popular ? 'bg-white text-green-600 hover:bg-gray-100' : 'bg-green-600 text-white hover:bg-green-700'} shadow-lg hover:shadow-xl`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
