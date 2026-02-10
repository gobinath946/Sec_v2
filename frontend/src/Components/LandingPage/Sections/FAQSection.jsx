import React, { useState } from 'react';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'Are digital signatures legally binding?',
      answer: 'Yes, digital signatures created with SecureGateway are legally binding and compliant with international e-signature laws including the ESIGN Act, UETA, and eIDAS. Our signatures meet the highest legal standards and are admissible in court.'
    },
    {
      question: 'How secure is SecureGateway?',
      answer: 'We use bank-level 256-bit AES encryption to protect all documents. Our platform is SOC 2 Type II certified, GDPR compliant, and ISO 27001 certified. Every signature includes a complete audit trail with timestamps and IP addresses.'
    },
    {
      question: 'Can I sign documents on my mobile device?',
      answer: 'Absolutely! SecureGateway is fully responsive and works seamlessly on smartphones and tablets. You can sign documents anywhere, anytime using our mobile-optimized interface or dedicated mobile apps.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support all major document formats including PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX), and image files (JPG, PNG). Documents are automatically converted to PDF for signing.'
    },
    {
      question: 'How does the free plan work?',
      answer: 'Our free plan allows you to send up to 5 documents per month with full e-signature functionality. There are no hidden fees or credit card requirements. You can upgrade anytime as your needs grow.'
    },
    {
      question: 'Can multiple people sign the same document?',
      answer: 'Yes, you can add multiple signers to any document. You can set the signing order, assign specific fields to each signer, and track the progress in real-time. Automatic reminders ensure timely completion.'
    },
    {
      question: 'Do recipients need an account to sign?',
      answer: 'No, recipients don\'t need a SecureGateway account to sign documents. They simply click the link in their email and can sign immediately using our secure signing interface.'
    },
    {
      question: 'What happens to my documents after signing?',
      answer: 'Completed documents are securely stored in your account with full encryption. You can download, share, or archive them anytime. We also provide a complete audit trail for compliance and legal purposes.'
    }
  ];

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">FAQ</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-gray-900">
            Frequently Asked
            <span className="block text-green-600">Questions</span>
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Everything you need to know about SecureGateway
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-green-500 transition-colors duration-200">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</span>
                <svg
                  className={`w-6 h-6 text-green-600 flex-shrink-0 transition-transform duration-200 ${openIndex === index ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <button className="text-green-600 hover:text-green-700 font-semibold text-lg">
            Contact our support team →
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
