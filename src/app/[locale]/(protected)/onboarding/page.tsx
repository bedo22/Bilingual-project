import { getUser } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { OnboardingWizard } from "./onboarding-wizard";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params;
  const user = await getUser();
  const t = await getTranslations("Onboarding");

  if (!user) {
    return redirect({ href: "/login", locale });
  }

  if (user.profile?.onboarding_completed) {
    return redirect({ href: "/dashboard", locale });
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("description")}</p>
      </div>

      <OnboardingWizard
        userId={user.id}
        role={user.profile?.role || "professional"}
        initialData={{
          bio: user.profile?.bio || { en: "", ar: "" },
          fullName: user.profile?.full_name || { en: "", ar: "" },
        }}
        locale={locale}
      />
    </div>
  );
}
