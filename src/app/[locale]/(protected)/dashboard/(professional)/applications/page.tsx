import { getTranslations } from "next-intl/server";
import { requireOnboarding } from "@/lib/auth";
import { fetchMyApplicationsWithJob } from "@/lib/jobs/queries";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WithdrawButton } from "./_components/withdraw-button";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MyApplicationsPage({ params }: Props) {
  const { locale } = await params;
  const user = await requireOnboarding(locale);
  const t = await getTranslations("DashboardPro");

  const { data: applications } = await fetchMyApplicationsWithJob(user.id);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("applied_jobs")}</h1>

      {applications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("no_applications")}</p>
          <Link href="/jobs" className="mt-4 inline-block">
            <Button variant="outline">{t("view_job")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => {
            const jobTitle =
              locale === "ar" ? app.job.title.ar : app.job.title.en;
            const status = app.status ?? "pending";
            const appliedDate = new Date(app.created_at).toLocaleDateString(
              locale === "ar" ? "ar-SA" : "en-US",
              { year: "numeric", month: "short", day: "numeric" }
            );

            return (
              <Card key={app.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {jobTitle}
                    </CardTitle>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusColors[status] || ""}`}
                    >
                      {t(`status_${status}`)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("applied_on")} {appliedDate}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/jobs/${app.job_id}`}>
                      <Button variant="outline" size="sm">
                        {t("view_job")}
                      </Button>
                    </Link>
                    {status === "pending" && (
                      <WithdrawButton
                        applicationId={app.id}
                        locale={locale}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
