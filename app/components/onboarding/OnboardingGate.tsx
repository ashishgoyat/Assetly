"use client";

/**
 * OnboardingGate — thin client wrapper that mounts the OnboardingWizard.
 * This exists so `app/dashboard/layout.tsx` (a Server Component) can import
 * a client component without converting the layout itself to a client component.
 */

import OnboardingWizard from "@/app/components/onboarding/OnboardingWizard";

export default function OnboardingGate() {
  return <OnboardingWizard />;
}
