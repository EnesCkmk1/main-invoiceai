-- AlterTable
ALTER TABLE "Company" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Existing companies with profile data already filled should skip onboarding
UPDATE "Company"
SET "onboardingCompleted" = true
WHERE "email" IS NOT NULL
   OR "vatNumber" IS NOT NULL
   OR "address" IS NOT NULL;
