"use client";

import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";

type HeroActionsProps = {
  primaryLabel: string;
  secondaryLabel: string;
  primaryHref: string;
  secondaryHref: string;
};

export function HeroActions({
  primaryLabel,
  secondaryLabel,
  primaryHref,
  secondaryHref,
}: HeroActionsProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 sm:flex-row rtl:sm:flex-row-reverse">
      <ShimmerButton
        className="h-12 w-full px-6 text-sm font-semibold sm:w-auto"
        background="linear-gradient(135deg, rgba(37, 99, 235, 1), rgba(59, 130, 246, 0.9))"
        shimmerColor="#93c5fd"
        onClick={() => router.push(primaryHref)}
      >
        {primaryLabel}
      </ShimmerButton>
      <Button
        variant="secondary"
        className="h-12 w-full px-6 text-sm font-semibold sm:w-auto"
        onClick={() => router.push(secondaryHref)}
      >
        {secondaryLabel}
      </Button>
    </div>
  );
}
