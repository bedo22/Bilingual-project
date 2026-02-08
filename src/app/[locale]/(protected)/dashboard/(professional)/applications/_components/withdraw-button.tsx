"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { withdrawApplication } from "@/lib/jobs/actions";

type Props = {
  applicationId: string;
  locale: string;
};

export function WithdrawButton({ applicationId, locale }: Props) {
  const t = useTranslations("DashboardPro");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!confirm(t("confirm_withdraw"))) return;

    setLoading(true);
    const result = await withdrawApplication({ applicationId, locale });
    if (!result.error) {
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleWithdraw}
      disabled={loading}
    >
      {loading ? t("withdrawing") : t("withdraw")}
    </Button>
  );
}
