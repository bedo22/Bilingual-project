"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { unsaveJob } from "@/lib/jobs/actions";

type Props = {
  jobId: string;
  locale: string;
};

export function UnsaveButton({ jobId, locale }: Props) {
  const t = useTranslations("DashboardPro");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUnsave = async () => {
    setLoading(true);
    const result = await unsaveJob({ jobId, locale });
    if (!result.error) {
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleUnsave}
      disabled={loading}
    >
      {loading ? t("unsaving") : t("unsave")}
    </Button>
  );
}
