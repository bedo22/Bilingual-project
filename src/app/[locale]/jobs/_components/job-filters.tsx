import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";

type Props = {
  locale: string;
  currentFilters: {
    q?: string;
    category?: string;
    tags?: string;
    minBudget?: string;
    maxBudget?: string;
  };
};

export async function JobFilters({ locale, currentFilters }: Props) {
  const t = await getTranslations("PublicJobs");

  return (
    <form method="GET" className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="space-y-2">
        <Label htmlFor="q">{t("search_label")}</Label>
        <Input
          id="q"
          name="q"
          placeholder={t("search_placeholder")}
          defaultValue={currentFilters.q}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">{t("category_label")}</Label>
        <Input
          id="category"
          name="category"
          placeholder={t("all_categories")}
          defaultValue={currentFilters.category}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">{t("tags_label")}</Label>
        <Input
          id="tags"
          name="tags"
          placeholder={t("tags_placeholder")}
          defaultValue={currentFilters.tags}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="minBudget">{t("min_budget")}</Label>
          <Input
            id="minBudget"
            name="minBudget"
            type="number"
            placeholder="0"
            defaultValue={currentFilters.minBudget}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxBudget">{t("max_budget")}</Label>
          <Input
            id="maxBudget"
            name="maxBudget"
            type="number"
            placeholder="∞"
            defaultValue={currentFilters.maxBudget}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {t("filter")}
        </Button>
        <Link href="/jobs">
          <Button type="button" variant="outline">
            {t("clear_filters")}
          </Button>
        </Link>
      </div>
    </form>
  );
}
