import { requireOnboarding } from "@/lib/auth";
import { redirect } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProfessionalLayout({ children, params }: Props) {
  const { locale } = await params;
  const user = await requireOnboarding(locale);

  if (user.profile?.role !== "professional") {
    redirect({ href: "/dashboard", locale });
  }

  return <>{children}</>;
}
