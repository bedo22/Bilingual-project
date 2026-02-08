"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DotPattern } from "@/components/ui/dot-pattern";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/app/auth/actions";
import { useState } from "react";
import { useLocale } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.append("locale", locale);

    const result = await login(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // Redirect is handled by the server action
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background Pattern */}
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]",
        )}
      />

      <div className="z-10 w-full max-w-md px-4">
        <form action={handleSubmit}>
          <Card className="border-none bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-black/80">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {t("login_title")}
              </CardTitle>
              <CardDescription>{t("login_description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("email_label")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-transparent"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">{t("password_label")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="bg-transparent"
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-500 font-medium text-center">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <ShimmerButton className="w-full" type="submit" disabled={loading}>
                <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                  {loading ? "..." : t("sign_in_button")}
                </span>
              </ShimmerButton>
              
              <div className="text-center text-sm text-muted-foreground">
                {t("no_account")}{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("sign_up_link")}
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
