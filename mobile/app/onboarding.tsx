import { OnboardingScreen } from '../src/features/onboarding/onboarding-screen';
import { useOnboarding } from '../src/features/onboarding/use-onboarding';

export default function OnboardingRoute() {
  const { complete } = useOnboarding();
  return <OnboardingScreen onFinish={complete} />;
}
