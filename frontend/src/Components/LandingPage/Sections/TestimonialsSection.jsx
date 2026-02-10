import React from 'react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CEO, TechStart Inc',
      image: '👩‍💼',
      content: 'SecureGateway has transformed how we handle contracts. What used to take weeks now takes minutes. The ROI has been incredible.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'HR Director, Global Corp',
      image: '👨‍💼',
      content: 'Onboarding new employees is now seamless. The mobile experience is fantastic, and our new hires love the simplicity.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Real Estate Broker',
      image: '👩‍💻',
      content: 'I close deals 3x faster now. Clients appreciate the professional experience and the ability to sign from anywhere.',
      rating: 5
    },
    {
      name: 'David Thompson',
      role: 'Legal Counsel',
      image: '👨‍⚖️',
      content: 'The audit trail and compliance features give us complete confidence. Security is top-notch and legally binding.',
      rating: 5
    },
    {
      name: 'Lisa Anderson',
      role: 'Operations Manager',
      image: '👩‍🔧',
      content: 'We have reduced our document processing costs by 90%. The integration with our existing systems was smooth.',
      rating: 5
    },
    {
      name: 'James Wilson',
      role: 'Financial Advisor',
      image: '👨‍💼',
      content: 'Client satisfaction has improved dramatically. The signing process is intuitive and professional.',
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <span className="text-green-600 font-semibold text-xs uppercase tracking-wide">Testimonials</span>
          <h2 className="mt-1.5 text-2xl md:text-3xl font-bold text-gray-900">
            Loved by
            <span className="block text-green-600">Thousands of Users</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gradient-to-br from-white to-green-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-green-100">
              <div className="flex items-center gap-0.5 mb-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-3 text-xs leading-relaxed italic">"{testimonial.content}"</p>
              <div className="flex items-center gap-2">
                <div className="text-2xl">{testimonial.image}</div>
                <div>
                  <div className="font-bold text-gray-900 text-xs">{testimonial.name}</div>
                  <div className="text-xs text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
