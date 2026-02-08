import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getUser } from "@/lib/auth";
import { fetchJobWithEmployer, hasSavedJob, hasAppliedToJob } from "@/lib/jobs/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaveApplyButtons } from "../_components/save-apply-buttons";

type Props = {
  params: Promise<{ locale: string; jobId: string }>;
};

export default async function JobDetailPage({ params }: Props) {
  const { locale, jobId } = await params;
  const t = await getTranslations("PublicJobs");

  // Fetch job with employer info
  const { data: job, error } = await fetchJobWithEmployer(jobId);

  // Job not found or not open
  if (!job || error) {
    notFound();
  }

  if (job.status !== "open") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("job_closed")}</h1>
        <Link href="/jobs">
          <Button variant="outline">{t("back_to_jobs")}</Button>
        </Link>
      </div>
    );
  }

  // Get current user (optional - don't require auth)
  const user = await getUser();
  const userRole = user?.profile?.role ?? null;

  // Check save/apply status for professionals
  let hasSaved = false;
  let hasApplied = false;
  if (user && userRole === "professional") {
    [hasSaved, hasApplied] = await Promise.all([
      hasSavedJob(jobId, user.id),
      hasAppliedToJob(jobId, user.id),
    ]);
  }

  // Localized content
  const title = locale === "ar" ? job.title.ar : job.title.en;
  const description = locale === "ar" ? job.description.ar : job.description.en;
  const employerName =
    locale === "ar"
      ? job.employer?.full_name?.ar
      : job.employer?.full_name?.en;

  const formattedDate = new Date(job.created_at).toLocaleDateString(
    locale === "ar" ? "ar-SA" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        ← {t("back_to_jobs")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <main className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {job.category && <span>{job.category}</span>}
              {job.budget && (
                <span className="font-medium text-foreground">
                  ${job.budget.toLocaleString()}
                </span>
              )}
              <span>
                {t("posted_on")} {formattedDate}
              </span>
            </div>
          </div>

          {/* Skills Tags */}
          {job.skills_tags && job.skills_tags.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t("required_skills")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills_tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-secondary rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("about_role")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {description.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Apply/Save Card */}
          <Card>
            <CardContent className="pt-6">
              <SaveApplyButtons
                jobId={jobId}
                locale={locale}
                userRole={userRole}
                hasSaved={hasSaved}
                hasApplied={hasApplied}
              />
            </CardContent>
          </Card>

          {/* Employer Info */}
          {job.employer && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t("posted_by")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {job.employer.avatar_url ? (
                    <img
                      src={job.employer.avatar_url}
                      alt={employerName || "Employer"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {employerName?.charAt(0) || "E"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{employerName || "Employer"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
