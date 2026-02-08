import { Link } from "@/i18n/routing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Job } from "@/lib/types/jobs";

type Props = {
  job: Job;
  locale: string;
};

export function PublicJobCard({ job, locale }: Props) {
  const title = locale === "ar" ? job.title.ar : job.title.en;
  const description = locale === "ar" ? job.description.ar : job.description.en;

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          {job.skills_tags && job.skills_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.skills_tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-secondary rounded-full"
                >
                  {tag}
                </span>
              ))}
              {job.skills_tags.length > 4 && (
                <span className="px-2 py-0.5 text-xs text-muted-foreground">
                  +{job.skills_tags.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {job.budget && (
              <span className="font-medium text-foreground">
                ${job.budget.toLocaleString()}
              </span>
            )}
            {job.category && <span>{job.category}</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
