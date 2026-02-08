import { getTranslations } from "next-intl/server";
import { requireOnboarding } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { fetchPublicJobs } from "@/lib/jobs/queries";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Job } from "@/lib/types/jobs";

type Props = {
  params: Promise<{ locale: string }>;
};

function computeMatchScore(
  profileSkills: string[],
  jobTags: string[]
): number {
  const normalizedSkills = new Set(
    profileSkills.map((s) => s.toLowerCase().trim())
  );
  const normalizedTags = jobTags.map((t) => t.toLowerCase().trim());
  return normalizedTags.filter((tag) => normalizedSkills.has(tag)).length;
}

function getMatchedTags(
  profileSkills: string[],
  jobTags: string[]
): string[] {
  const normalizedSkills = new Set(
    profileSkills.map((s) => s.toLowerCase().trim())
  );
  return jobTags.filter((tag) =>
    normalizedSkills.has(tag.toLowerCase().trim())
  );
}

export default async function RecommendedJobsPage({ params }: Props) {
  const { locale } = await params;
  const user = await requireOnboarding(locale);
  const t = await getTranslations("DashboardPro");

  // Fetch user's skills from profile
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("skills")
    .eq("id", user.id)
    .single();

  const userSkills = Array.isArray(profile?.skills)
    ? (profile.skills as string[])
    : [];

  // Fetch open jobs
  const { data: jobs } = await fetchPublicJobs({ limit: 100 });

  // Score and rank jobs by tag overlap
  const scoredJobs = (jobs || [])
    .map((job) => {
      const allTags = [
        ...(job.skills_tags || []),
        ...(job.ai_tags || []),
      ];
      const score = computeMatchScore(userSkills, allTags);
      const matched = getMatchedTags(userSkills, allTags);
      return { job, score, matched };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("recommended_jobs")}</h1>

      {scoredJobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("no_recommendations")}</p>
          <Link href="/jobs" className="mt-4 inline-block">
            <Button variant="outline">{t("view_job")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scoredJobs.map(({ job, score, matched }) => {
            const title =
              locale === "ar" ? job.title.ar : job.title.en;
            const description =
              locale === "ar" ? job.description.ar : job.description.en;

            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">
                        {title}
                      </CardTitle>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                        {t("match_score")}: {score}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {description}
                    </p>

                    {matched.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">
                          {t("skills_match")}:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {matched.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {job.budget && (
                        <span>${job.budget.toLocaleString()}</span>
                      )}
                      {job.category && <span>{job.category}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
