"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "@/i18n/routing";

type OnboardingData = {
  userId: string;
  role: "employer" | "professional";
  locale: string;
  bioEn: string;
  bioAr: string;
  skills?: string[];
  companyName?: string;
  companyWebsite?: string;
};

export async function skipOnboarding(data: { userId: string; locale: string }) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", data.userId);

  if (error) {
    return { error: error.message };
  }

  redirect({ href: "/dashboard", locale: data.locale });
}

export async function completeOnboarding(data: OnboardingData) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    bio: { en: data.bioEn, ar: data.bioAr },
    onboarding_completed: true,
  };

  if (data.role === "professional") {
    updateData.skills = data.skills || [];
  } else if (data.role === "employer") {
    updateData.company_branding = {
      name: data.companyName || "",
      website: data.companyWebsite || "",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", data.userId);

  if (error) {
    return { error: error.message };
  }

  redirect({ href: "/dashboard", locale: data.locale });
}
