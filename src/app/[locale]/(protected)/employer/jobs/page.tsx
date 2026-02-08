import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { requireOnboarding } from "@/lib/auth";
import { fetchEmployerJobs } from "@/lib/jobs/queries";
import { Button } from "@/components/ui/button";
import { JobCard } from "./_components/job-card";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function EmployerJobsPage({ params }: Props) {
  const { locale } = await params;
  const user = await requireOnboarding(locale);
  const t = await getTranslations("Jobs");

  // Only employers should access this page
  if (user.profile?.role !== "employer") {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">
          This page is only accessible to employers.
        </p>
      </div>
    );
  }

  const { data: jobs, error } = await fetchEmployerJobs(user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("my_jobs")}</h1>
        <Link href="/employer/jobs/new">
          <Button>{t("create_job")}</Button>
        </Link>
      </div>

      {error && (
        <p className="text-center text-red-500 mb-4">{error}</p>
      )}

      {jobs && jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("no_jobs")}</p>
          <Link href="/employer/jobs/new" className="mt-4 inline-block">
            <Button variant="outline">{t("create_job")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs?.map((job) => (
            <JobCard key={job.id} job={job} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
