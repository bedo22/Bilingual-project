import { createClient } from "@/utils/supabase/server";
import { redirect } from "@/i18n/routing";
import type { Database } from "@/lib/types/supabase";

type UserRole = Database["public"]["Enums"]["user_role"];

export type UserWithProfile = {
  id: string;
  email: string;
  profile: {
    full_name: { en: string; ar: string };
    role: UserRole | null;
    bio: { en?: string; ar?: string };
    avatar_url: string | null;
    onboarding_completed: boolean;
  } | null;
};

export async function getUser(): Promise<UserWithProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, bio, avatar_url, onboarding_completed")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    profile: profile
      ? {
          full_name: profile.full_name as unknown as { en: string; ar: string },
          role: profile.role,
          bio: profile.bio as unknown as { en?: string; ar?: string },
          avatar_url: profile.avatar_url,
          onboarding_completed: profile.onboarding_completed ?? false,
        }
      : null,
  };
}

export async function requireAuth(locale: string): Promise<UserWithProfile> {
  const user = await getUser();
  if (!user) {
    return redirect({ href: "/login", locale });
  }
  return user;
}

export async function requireOnboarding(
  locale: string
): Promise<UserWithProfile> {
  const user = await requireAuth(locale);
  if (!user.profile?.onboarding_completed) {
    return redirect({ href: "/onboarding", locale });
  }
  return user;
}
