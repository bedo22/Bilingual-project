"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createEmployerJob, updateEmployerJob } from "../actions";
import type { Job, JobStatus } from "@/lib/types/jobs";

type Props = {
  mode: "create" | "edit";
  locale: string;
  jobId?: string;
  initial?: Job;
};

export function JobForm({ mode, locale, jobId, initial }: Props) {
  const t = useTranslations("Jobs");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    titleEn: initial?.title.en ?? "",
    titleAr: initial?.title.ar ?? "",
    descriptionEn: initial?.description.en ?? "",
    descriptionAr: initial?.description.ar ?? "",
    category: initial?.category ?? "",
    budget: initial?.budget?.toString() ?? "",
    skillsTagsText: initial?.skills_tags?.join(", ") ?? "",
    status: initial?.status ?? "draft",
  });

  const totalSteps = 2;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const skillsTags = formData.skillsTagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const budget = formData.budget ? Number(formData.budget) : undefined;

    const payload = {
      locale,
      titleEn: formData.titleEn,
      titleAr: formData.titleAr,
      descriptionEn: formData.descriptionEn,
      descriptionAr: formData.descriptionAr,
      category: formData.category || undefined,
      budget,
      skillsTags,
      status: formData.status as "open" | "closed" | "draft",
    };

    let result;
    if (mode === "create") {
      result = await createEmployerJob(payload);
    } else {
      result = await updateEmployerJob({ ...payload, jobId: jobId! });
    }

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? t("new_job") : t("edit_job")}
        </CardTitle>
        <CardDescription>
          {t("step")} {step} {t("of")} {totalSteps} —{" "}
          {step === 1 ? t("step1_description") : t("step2_description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="titleEn">{t("title_en")}</Label>
              <Input
                id="titleEn"
                placeholder={t("title_placeholder")}
                value={formData.titleEn}
                onChange={(e) =>
                  setFormData({ ...formData, titleEn: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titleAr">{t("title_ar")}</Label>
              <Input
                id="titleAr"
                dir="rtl"
                placeholder={t("title_placeholder_ar")}
                value={formData.titleAr}
                onChange={(e) =>
                  setFormData({ ...formData, titleAr: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionEn">{t("description_en")}</Label>
              <textarea
                id="descriptionEn"
                className="border-input bg-background flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
                placeholder={t("description_placeholder")}
                value={formData.descriptionEn}
                onChange={(e) =>
                  setFormData({ ...formData, descriptionEn: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionAr">{t("description_ar")}</Label>
              <textarea
                id="descriptionAr"
                dir="rtl"
                className="border-input bg-background flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
                placeholder={t("description_placeholder_ar")}
                value={formData.descriptionAr}
                onChange={(e) =>
                  setFormData({ ...formData, descriptionAr: e.target.value })
                }
                required
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="category">{t("category")}</Label>
              <Input
                id="category"
                placeholder={t("category_placeholder")}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">{t("budget")}</Label>
              <Input
                id="budget"
                type="number"
                placeholder={t("budget_placeholder")}
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillsTags">{t("skills_tags")}</Label>
              <Input
                id="skillsTags"
                placeholder={t("skills_placeholder")}
                value={formData.skillsTagsText}
                onChange={(e) =>
                  setFormData({ ...formData, skillsTagsText: e.target.value })
                }
              />
              <p className="text-muted-foreground text-xs">{t("skills_hint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t("status")}</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as JobStatus })
                }
              >
                <option value="draft">{t("status_draft")}</option>
                <option value="open">{t("status_open")}</option>
                <option value="closed">{t("status_closed")}</option>
              </select>
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || isSubmitting}
        >
          {t("back")}
        </Button>

        {step < totalSteps ? (
          <Button onClick={handleNext}>{t("next")}</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? mode === "create"
                ? t("saving")
                : t("updating")
              : mode === "create"
                ? t("save")
                : t("update")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
