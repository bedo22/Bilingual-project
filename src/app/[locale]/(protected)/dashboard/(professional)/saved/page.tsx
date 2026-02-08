import { getTranslations } from "next-intl/server";
import { requireOnboarding } from "@/lib/auth";
import { fetchSavedJobs } from "@/lib/jobs/queries";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnsaveButton } from "./_components/unsave-button";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SavedJobsPage({ params }: Props) {
  const { locale } = await params;
  const user = await requireOnboarding(locale);
  const t = await getTranslations("DashboardPro");

  const { data: savedJobs } = await fetchSavedJobs(user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("saved_jobs")}</h1>

      {savedJobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("no_saved_jobs")}</p>
          <Link href="/jobs" className="mt-4 inline-block">
            <Button variant="outline">{t("view_job")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedJobs.map((saved) => {
            const title =
              locale === "ar" ? saved.job.title.ar : saved.job.title.en;
            const description =
              locale === "ar"
                ? saved.job.description.ar
                : saved.job.description.en;

            return (
              <Card key={saved.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-1">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {description}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {saved.job.budget && (
                      <span>${saved.job.budget.toLocaleString()}</span>
                    )}
                    {saved.job.category && <span>{saved.job.category}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/jobs/${saved.job_id}`}>
                      <Button variant="outline" size="sm">
                        {t("view_job")}
                      </Button>
                    </Link>
                    <UnsaveButton
                      jobId={saved.job_id}
                      locale={locale}
                    />
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
