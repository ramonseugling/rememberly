import { CtaSection } from '@/components/landing-page/cta-section';
import { FeaturesSection } from '@/components/landing-page/features-section';
import { HeroSection } from '@/components/landing-page/hero-section';
import { HowItWorksSection } from '@/components/landing-page/how-it-works-section';
import { MockupSection } from '@/components/landing-page/mockup-section';

export const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <MockupSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
    </div>
  );
};
