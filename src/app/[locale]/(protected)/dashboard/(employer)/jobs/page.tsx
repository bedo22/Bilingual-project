import { getTranslations } from "next-intl/server";
import { requireOnboarding } from "@/lib/auth";
import {
  fetchEmployerJobs,
  getEmployerJobStats,
  getApplicationCount,
} from "@/lib/jobs/queries";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function EmployerJobsDashboardPage({ params }: Props) {
  const { locale } = await params;
  const user = await requireOnboarding(locale);
  const t = await getTranslations("DashboardEmployer");

  const [{ data: jobs }, stats] = await Promise.all([
    fetchEmployerJobs(user.id),
    getEmployerJobStats(user.id),
  ]);

  const applicationCounts = await Promise.all(
    (jobs || []).map(async (job) => ({
      jobId: job.id,
      count: await getApplicationCount(job.id),
    }))
  );

  const countMap = Object.fromEntries(
    applicationCounts.map((c) => [c.jobId, c.count])
  );

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    open: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("my_jobs")}</h1>
        <Link href="/employer/jobs/new">
          <Button>{t("my_jobs")}</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("total_jobs")}</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("open_jobs")}</p>
            <p className="text-3xl font-bold text-green-600">{stats.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("draft_jobs")}</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("closed_jobs")}</p>
            <p className="text-3xl font-bold text-gray-600">{stats.closed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      {jobs && jobs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const title = locale === "ar" ? job.title.ar : job.title.en;
            const count = countMap[job.id] || 0;

            return (
              <Card key={job.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {title}
                    </CardTitle>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[job.status] || ""}`}
                    >
                      {job.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("applicants")}: {count}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/jobs/${job.id}/applicants`}>
                      <Button variant="outline" size="sm">
                        {t("view_applicants")}
                      </Button>
                    </Link>
                    <Link href={`/employer/jobs/${job.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        ✎
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">
          {t("no_applicants")}
        </p>
      )}
    </div>
  );
}
