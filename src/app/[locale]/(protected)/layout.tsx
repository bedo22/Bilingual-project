import { getUser } from "@/lib/auth";
import { redirect } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProtectedLayout({ children, params }: Props) {
  const { locale } = await params;
  const user = await getUser();

  if (!user) {
    redirect({ href: "/login", locale });
  }

  return <>{children}</>;
}
