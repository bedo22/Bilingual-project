import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

type Props = {
  currentPage: number;
  hasMore: boolean;
  baseParams: Record<string, string | undefined>;
};

export async function Pagination({ currentPage, hasMore, baseParams }: Props) {
  const t = await getTranslations("PublicJobs");

  // Build query string preserving existing params
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(baseParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", String(page));
    return `/jobs?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      {currentPage > 1 ? (
        <Link href={buildUrl(currentPage - 1)}>
          <Button variant="outline">{t("previous")}</Button>
        </Link>
      ) : (
        <Button variant="outline" disabled>
          {t("previous")}
        </Button>
      )}

      <span className="text-sm text-muted-foreground">
        {t("page", { current: currentPage })}
      </span>

      {hasMore ? (
        <Link href={buildUrl(currentPage + 1)}>
          <Button variant="outline">{t("next")}</Button>
        </Link>
      ) : (
        <Button variant="outline" disabled>
          {t("next")}
        </Button>
      )}
    </div>
  );
}
