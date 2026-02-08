import { getTranslations } from "next-intl/server";
import { requireOnboarding } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { JobForm } from "../_components/job-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewJobPage({ params }: Props) {
  const { locale } = await params;
  const user = await requireOnboarding(locale);
  const t = await getTranslations("Jobs");

  // Only employers can create jobs
  if (user.profile?.role !== "employer") {
    redirect({ href: "/dashboard", locale });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">{t("new_job")}</h1>
      <JobForm mode="create" locale={locale} />
    </div>
  );
}
