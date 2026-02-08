import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireOnboarding } from "@/lib/auth";
import { fetchJobById, fetchApplicationsForJob } from "@/lib/jobs/queries";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusUpdater } from "./_components/status-updater";

type Props = {
  params: Promise<{ locale: string; jobId: string }>;
};

export default async function ApplicantsPage({ params }: Props) {
  const { locale, jobId } = await params;
  const user = await requireOnboarding(locale);
  const t = await getTranslations("DashboardEmployer");

  const { data: job } = await fetchJobById(jobId);

  if (!job || job.employer_id !== user.id) {
    notFound();
  }

  const { data: applications } = await fetchApplicationsForJob(jobId);
  const jobTitle = locale === "ar" ? job.title.ar : job.title.en;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        ← {t("my_jobs")}
      </Link>

      <h1 className="text-3xl font-bold mb-2">
        {t("applicants_for")}
      </h1>
      <p className="text-lg text-muted-foreground mb-6">{jobTitle}</p>

      {applications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("no_applicants")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => {
            const applicantName =
              locale === "ar"
                ? app.applicant?.full_name?.ar
                : app.applicant?.full_name?.en;
            const status = app.status ?? "pending";
            const appliedDate = new Date(app.created_at).toLocaleDateString(
              locale === "ar" ? "ar-SA" : "en-US",
              { year: "numeric", month: "short", day: "numeric" }
            );

            return (
              <Card key={app.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {app.applicant?.avatar_url ? (
                        <img
                          src={app.applicant.avatar_url}
                          alt={applicantName || ""}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {applicantName?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          {applicantName || t("applicant_name")}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {t("applied_on")} {appliedDate}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || ""}`}
                    >
                      {t(`status_${status}`)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Skills */}
                  {app.applicant?.skills &&
                    Array.isArray(app.applicant.skills) &&
                    app.applicant.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {app.applicant.skills.map((skill: string) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 text-xs bg-secondary rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* Cover letter */}
                  {app.cover_letter && (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        {t("cover_letter")}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {app.cover_letter}
                      </p>
                    </div>
                  )}

                  {/* Status update */}
                  <StatusUpdater
                    applicationId={app.id}
                    currentStatus={status}
                    locale={locale}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
