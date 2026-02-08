"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { updateApplicationStatus } from "@/lib/jobs/actions";

type Props = {
  applicationId: string;
  currentStatus: string;
  locale: string;
};

export function StatusUpdater({ applicationId, currentStatus, locale }: Props) {
  const t = useTranslations("DashboardEmployer");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (status: "accepted" | "rejected") => {
    setLoading(true);
    const result = await updateApplicationStatus({
      applicationId,
      status,
      locale,
    });
    if (!result.error) {
      router.refresh();
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  if (currentStatus !== "pending") {
    return null;
  }

  return (
    <div className="flex gap-2 pt-2">
      <Button
        size="sm"
        onClick={() => handleUpdate("accepted")}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700"
      >
        {t("accept")}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleUpdate("rejected")}
        disabled={loading}
      >
        {t("reject")}
      </Button>
    </div>
  );
}
