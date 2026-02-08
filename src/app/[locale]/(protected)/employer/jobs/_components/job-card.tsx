"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteEmployerJob, toggleEmployerJobPublish } from "../actions";
import type { Job } from "@/lib/types/jobs";
import { Link } from "@/i18n/routing";

type Props = {
  job: Job;
  locale: string;
  applicationCount?: number;
};

export function JobCard({ job, locale, applicationCount = 0 }: Props) {
  const t = useTranslations("Jobs");
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const title = locale === "ar" ? job.title.ar : job.title.en;
  const description = locale === "ar" ? job.description.ar : job.description.en;

  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    open: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  const handleDelete = async () => {
    if (!confirm(t("confirm_delete"))) return;

    setIsDeleting(true);
    const result = await deleteEmployerJob({ jobId: job.id, locale });

    if (result?.error) {
      alert(result.error);
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async () => {
    setIsToggling(true);
    const result = await toggleEmployerJobPublish({
      jobId: job.id,
      publish: job.status !== "open",
      locale,
    });

    if (result?.error) {
      alert(result.error);
    }

    setIsToggling(false);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[job.status]}`}
          >
            {t(`status_${job.status}`)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>

        {job.skills_tags && job.skills_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.skills_tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-secondary rounded-full"
              >
                {tag}
              </span>
            ))}
            {job.skills_tags.length > 5 && (
              <span className="px-2 py-0.5 text-xs text-muted-foreground">
                +{job.skills_tags.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {job.budget && <span>${job.budget.toLocaleString()}</span>}
          {job.category && <span>{job.category}</span>}
          <span>{t("applications_count", { count: applicationCount })}</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Link href={`/employer/jobs/${job.id}/edit`}>
          <Button variant="outline" size="sm">
            {t("edit")}
          </Button>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={handleTogglePublish}
          disabled={isToggling}
        >
          {job.status === "open" ? t("unpublish") : t("publish")}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? t("deleting") : t("delete")}
        </Button>
      </CardFooter>
    </Card>
  );
}
