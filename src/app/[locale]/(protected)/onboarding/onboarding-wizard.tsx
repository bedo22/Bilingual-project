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
import { completeOnboarding, skipOnboarding } from "./actions";

type Props = {
  userId: string;
  role: "employer" | "professional";
  initialData: {
    bio: { en?: string; ar?: string };
    fullName: { en: string; ar: string };
  };
  locale: string;
};

export function OnboardingWizard({ userId, role, initialData, locale }: Props) {
  const t = useTranslations("Onboarding");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bioEn: initialData.bio.en || "",
    bioAr: initialData.bio.ar || "",
    skills: "",
    companyName: "",
    companyWebsite: "",
  });

  const totalSteps = role === "professional" ? 2 : 2;

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

    const result = await completeOnboarding({
      userId,
      role,
      locale,
      bioEn: formData.bioEn,
      bioAr: formData.bioAr,
      skills: formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      companyName: formData.companyName,
      companyWebsite: formData.companyWebsite,
    });

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    setError(null);

    const result = await skipOnboarding({ userId, locale });

    if (result?.error) {
      setError(result.error);
      setIsSkipping(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("step")} {step} {t("of")} {totalSteps}
        </CardTitle>
        <CardDescription>
          {step === 1 && t("step1_description")}
          {step === 2 && role === "professional" && t("step2_professional")}
          {step === 2 && role === "employer" && t("step2_employer")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="bioEn">{t("bio_en")}</Label>
              <textarea
                id="bioEn"
                className="border-input bg-background flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
                placeholder={t("bio_placeholder")}
                value={formData.bioEn}
                onChange={(e) =>
                  setFormData({ ...formData, bioEn: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bioAr">{t("bio_ar")}</Label>
              <textarea
                id="bioAr"
                dir="rtl"
                className="border-input bg-background flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
                placeholder={t("bio_placeholder_ar")}
                value={formData.bioAr}
                onChange={(e) =>
                  setFormData({ ...formData, bioAr: e.target.value })
                }
              />
            </div>
          </>
        )}

        {step === 2 && role === "professional" && (
          <div className="space-y-2">
            <Label htmlFor="skills">{t("skills_label")}</Label>
            <Input
              id="skills"
              placeholder={t("skills_placeholder")}
              value={formData.skills}
              onChange={(e) =>
                setFormData({ ...formData, skills: e.target.value })
              }
            />
            <p className="text-muted-foreground text-xs">{t("skills_hint")}</p>
          </div>
        )}

        {step === 2 && role === "employer" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">{t("company_name")}</Label>
              <Input
                id="companyName"
                placeholder={t("company_name_placeholder")}
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyWebsite">{t("company_website")}</Label>
              <Input
                id="companyWebsite"
                type="url"
                placeholder="https://example.com"
                value={formData.companyWebsite}
                onChange={(e) =>
                  setFormData({ ...formData, companyWebsite: e.target.value })
                }
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <div className="flex w-full justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isSubmitting || isSkipping}
          >
            {t("back")}
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext}>{t("next")}</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || isSkipping}>
              {isSubmitting ? t("submitting") : t("complete")}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={handleSkip}
          disabled={isSubmitting || isSkipping}
        >
          {isSkipping ? t("skipping") : t("skip")}
        </Button>
      </CardFooter>
    </Card>
  );
}
