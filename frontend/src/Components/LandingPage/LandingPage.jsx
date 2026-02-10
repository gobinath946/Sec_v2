import React from 'react';
import Navbar from './Navbar';
import ScrollToTop from './ScrollToTop';
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
      <Navbar />
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
      <ScrollToTop />
    </div>
  );
};

export default LandingPage;
