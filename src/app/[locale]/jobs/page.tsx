import { getTranslations } from "next-intl/server";
import { fetchPublicJobs } from "@/lib/jobs/queries";
import { JobFilters } from "./_components/job-filters";
import { PublicJobCard } from "./_components/public-job-card";
import { Pagination } from "./_components/pagination";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    tags?: string;
    minBudget?: string;
    maxBudget?: string;
    page?: string;
  }>;
};

export default async function PublicJobsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const filters = await searchParams;
  const t = await getTranslations("PublicJobs");

  // Parse search params
  const q = filters.q?.trim() || undefined;
  const category = filters.category?.trim() || undefined;
  const tags = filters.tags
    ? filters.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : undefined;
  const minBudget = filters.minBudget ? Number(filters.minBudget) : undefined;
  const maxBudget = filters.maxBudget ? Number(filters.maxBudget) : undefined;
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = 12;
  const offset = (page - 1) * limit;

  // Fetch jobs
  const { data: jobs, error } = await fetchPublicJobs({
    q,
    category,
    tags,
    minBudget: Number.isFinite(minBudget) ? minBudget : undefined,
    maxBudget: Number.isFinite(maxBudget) ? maxBudget : undefined,
    limit: limit + 1, // Fetch one extra to check if there's more
    offset,
  });

  // Check if there are more pages
  const hasMore = jobs ? jobs.length > limit : false;
  const displayJobs = jobs ? jobs.slice(0, limit) : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <JobFilters
            locale={locale}
            currentFilters={{
              q: filters.q,
              category: filters.category,
              tags: filters.tags,
              minBudget: filters.minBudget,
              maxBudget: filters.maxBudget,
            }}
          />
        </aside>

        {/* Jobs Grid */}
        <main className="lg:col-span-3">
          {error && (
            <p className="text-center text-red-500 mb-4">{error}</p>
          )}

          {displayJobs.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">
                {t("no_results_title")}
              </h2>
              <p className="text-muted-foreground">
                {t("no_results_description")}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {displayJobs.map((job) => (
                  <PublicJobCard key={job.id} job={job} locale={locale} />
                ))}
              </div>

              <Pagination
                currentPage={page}
                hasMore={hasMore}
                baseParams={{
                  q: filters.q,
                  category: filters.category,
                  tags: filters.tags,
                  minBudget: filters.minBudget,
                  maxBudget: filters.maxBudget,
                }}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
