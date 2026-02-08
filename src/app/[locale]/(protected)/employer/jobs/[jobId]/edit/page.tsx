import { getTranslations } from "next-intl/server";
import { requireOnboarding } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { fetchJobById } from "@/lib/jobs/queries";
import { JobForm } from "../../_components/job-form";

type Props = {
  params: Promise<{ locale: string; jobId: string }>;
};

export default async function EditJobPage({ params }: Props) {
  const { locale, jobId } = await params;
  const user = await requireOnboarding(locale);
  const t = await getTranslations("Jobs");

  // Only employers can edit jobs
  if (user.profile?.role !== "employer") {
    redirect({ href: "/dashboard", locale });
  }

  const { data: job, error } = await fetchJobById(jobId);

  // Job not found or doesn't belong to this employer
  if (!job || job.employer_id !== user.id) {
    redirect({ href: "/employer/jobs", locale });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">{t("edit_job")}</h1>
      <JobForm mode="edit" locale={locale} jobId={jobId} initial={job!} />
    </div>
  );
}
