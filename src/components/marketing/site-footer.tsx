import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t border-white/5 bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-10 lg:px-16">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("brand")}</p>
            <p className="mt-2 max-w-sm text-xs text-muted-foreground">
              {t("tagline")}
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            <Link className="transition hover:text-foreground" href="/">
              {t("home")}
            </Link>
            <Link className="transition hover:text-foreground" href="/jobs">
              {t("jobs")}
            </Link>
            <Link className="transition hover:text-foreground" href="/login">
              {t("login")}
            </Link>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between gap-4 border-t border-blue-500/10 pt-6 text-[11px] text-muted-foreground">
          <span>{t("copyright")}</span>
          <span>{t("built_with")}</span>
        </div>
      </div>
    </footer>
  );
}
