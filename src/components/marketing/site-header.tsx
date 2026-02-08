"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { Briefcase, Menu, X } from "lucide-react";

export function SiteHeader() {
  const t = useTranslations("Header");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="flex items-center gap-3 text-sm font-semibold tracking-wide"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
            <Briefcase className="h-4 w-4" />
          </span>
          <span className="text-foreground">{t("brand")}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex rtl:space-x-reverse">
          <Link className="transition hover:text-foreground" href="/">
            {t("home")}
          </Link>
          <Link className="transition hover:text-foreground" href="/jobs">
            {t("jobs")}
          </Link>
          <Link className="transition hover:text-foreground" href="/dashboard">
            {t("dashboard")}
          </Link>
        </nav>
        <Button className="hidden md:inline-flex" asChild>
          <Link href="/employer/jobs">{t("cta")}</Link>
        </Button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={t("cta")}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {isOpen ? (
        <div className="border-t border-white/5 bg-background px-6 py-4 sm:px-10 lg:px-16 md:hidden">
          <div className="flex flex-col gap-4 text-sm font-medium text-muted-foreground">
            <Link
              className="transition hover:text-foreground"
              href="/"
              onClick={() => setIsOpen(false)}
            >
              {t("home")}
            </Link>
            <Link
              className="transition hover:text-foreground"
              href="/jobs"
              onClick={() => setIsOpen(false)}
            >
              {t("jobs")}
            </Link>
            <Link
              className="transition hover:text-foreground"
              href="/dashboard"
              onClick={() => setIsOpen(false)}
            >
              {t("dashboard")}
            </Link>
            <Button asChild>
              <Link href="/employer/jobs" onClick={() => setIsOpen(false)}>
                {t("cta")}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
