import { HeaderLanding } from '@/components/header-landing/header-landing';
import { LandingFooter } from '@/components/landing-footer/landing-footer';
import { CtaSection } from '@/components/landing-page/cta-section';
import { GroupsSection } from '@/components/landing-page/groups-section';
import { HeroSection } from '@/components/landing-page/hero-section';
import { HowItWorksSection } from '@/components/landing-page/how-it-works-section';
import { MockupSection } from '@/components/landing-page/mockup-section';

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderLanding />
      <main className="flex-1">
        <HeroSection />
        <MockupSection />
        <HowItWorksSection />
        <GroupsSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
};
