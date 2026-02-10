import React from 'react';
import HeroSection from './Sections/HeroSection';
import FeaturesSection from './Sections/FeaturesSection';
import HowItWorksSection from './Sections/HowItWorksSection';
import SecuritySection from './Sections/SecuritySection';
import BenefitsSection from './Sections/BenefitsSection';
import UseCasesSection from './Sections/UseCasesSection';
import TestimonialsSection from './Sections/TestimonialsSection';
import PricingSection from './Sections/PricingSection';
import FAQSection from './Sections/FAQSection';
import CTASection from './Sections/CTASection';
import Footer from '../Footer/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <BenefitsSection />
      <UseCasesSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
