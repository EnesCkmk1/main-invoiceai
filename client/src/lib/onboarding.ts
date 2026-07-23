import type { Company } from "./types";

export function needsOnboarding(company: Company | null | undefined): boolean {
  if (!company) return false;
  return !company.onboardingCompleted;
}
