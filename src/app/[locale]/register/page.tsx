"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DotPattern } from "@/components/ui/dot-pattern";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signup } from "@/app/auth/actions";
import { useState } from "react";
import { useLocale } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.append("locale", locale);

    const result = await signup(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]",
        )}
      />

      <div className="z-10 w-full max-w-md px-4 py-8">
        <form action={handleSubmit}>
          <Card className="border-none bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-black/80">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {t("register_title")}
              </CardTitle>
              <CardDescription>{t("register_description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">{t("name_label")}</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  className="bg-transparent"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">{t("role_label")}</Label>
                <select 
                  id="role" 
                  name="role" 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                    <option value="professional">{t("role_professional")}</option>
                    <option value="employer">{t("role_employer")}</option>
                </select>
              </div>
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
                  {loading ? "..." : t("create_account_button")}
                </span>
              </ShimmerButton>
              
              <div className="text-center text-sm text-muted-foreground">
                {t("have_account")}{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("login_link")}
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
