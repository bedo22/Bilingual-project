import { getUser } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import {
  fetchMyApplications,
  fetchSavedJobs,
  getEmployerJobStats,
} from "@/lib/jobs/queries";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const user = await getUser();
  const t = await getTranslations("Dashboard");

  if (!user) {
    return redirect({ href: "/login", locale });
  }

  if (!user.profile?.onboarding_completed) {
    return redirect({ href: "/onboarding", locale });
  }

  const displayName =
    locale === "ar"
      ? user.profile?.full_name?.ar
      : user.profile?.full_name?.en;

  // Fetch real counts
  let postedJobs = 0;
  let applicationsReceived = 0;
  let appliedJobs = 0;
  let savedJobs = 0;

  if (user.profile?.role === "employer") {
    const stats = await getEmployerJobStats(user.id);
    postedJobs = stats.total;
    applicationsReceived = stats.open;
  } else {
    const [appsResult, savedResult] = await Promise.all([
      fetchMyApplications(user.id),
      fetchSavedJobs(user.id),
    ]);
    appliedJobs = appsResult.data.length;
    savedJobs = savedResult.data.length;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {t("welcome", { name: displayName || user.email })}
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {user.profile?.role === "employer" ? (
          <>
            <Link href="/dashboard/jobs">
              <DashboardCard
                title={t("postedJobs")}
                value={String(postedJobs)}
              />
            </Link>
            <Link href="/dashboard/jobs">
              <DashboardCard
                title={t("applications")}
                value={String(applicationsReceived)}
              />
            </Link>
            <DashboardCard title={t("messages")} value="0" />
          </>
        ) : (
          <>
            <Link href="/dashboard/applications">
              <DashboardCard
                title={t("appliedJobs")}
                value={String(appliedJobs)}
              />
            </Link>
            <Link href="/dashboard/saved">
              <DashboardCard
                title={t("savedJobs")}
                value={String(savedJobs)}
              />
            </Link>
            <DashboardCard title={t("messages")} value="0" />
          </>
        )}
      </div>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md cursor-pointer">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
