"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { applyToJob, saveJob, unsaveJob } from "@/lib/jobs/actions";

type Props = {
  jobId: string;
  locale: string;
  userRole: "professional" | "employer" | null;
  hasSaved: boolean;
  hasApplied: boolean;
};

export function SaveApplyButtons({
  jobId,
  locale,
  userRole,
  hasSaved,
  hasApplied,
}: Props) {
  const t = useTranslations("PublicJobs");
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [saved, setSaved] = useState(hasSaved);
  const [applied, setApplied] = useState(hasApplied);

  // Not logged in - show login CTAs
  if (userRole === null) {
    return (
      <div className="flex flex-col gap-3">
        <Link href={`/login?next=/jobs/${jobId}`}>
          <Button className="w-full">{t("sign_in_to_apply")}</Button>
        </Link>
        <Link href={`/login?next=/jobs/${jobId}`}>
          <Button variant="outline" className="w-full">
            {t("sign_in_to_save")}
          </Button>
        </Link>
      </div>
    );
  }

  // Employer - cannot apply/save
  if (userRole === "employer") {
    return (
      <p className="text-sm text-muted-foreground text-center">
        {t("employers_cannot_apply")}
      </p>
    );
  }

  // Professional - show save/apply buttons
  const handleSave = async () => {
    setIsSaving(true);
    if (saved) {
      const result = await unsaveJob({ jobId, locale });
      if (!result.error) {
        setSaved(false);
      }
    } else {
      const result = await saveJob({ jobId, locale });
      if (!result.error) {
        setSaved(true);
      }
    }
    setIsSaving(false);
  };

  const handleApply = async () => {
    setIsApplying(true);
    const result = await applyToJob({ jobId, locale });
    if (!result.error) {
      setApplied(true);
    } else {
      alert(result.error);
    }
    setIsApplying(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={handleApply}
        disabled={applied || isApplying}
        className="w-full"
      >
        {applied ? t("applied") : isApplying ? "..." : t("apply")}
      </Button>

      <Button
        variant="outline"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full"
      >
        {saved ? t("saved") : isSaving ? "..." : t("save")}
      </Button>
    </div>
  );
}
