import { useTranslations } from "next-intl";
import { HeroActions } from "@/components/marketing/hero-actions";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Marquee } from "@/components/ui/marquee";
import { NeonGradientCard } from "@/components/ui/neon-gradient-card";
import { Particles } from "@/components/ui/particles";
import { Spotlight } from "@/components/ui/spotlight";
import {
  BrainCircuit,
  Globe2,
  Sparkles,
  Wand2,
} from "lucide-react";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_50%)]" />
        <Spotlight className="-top-32 left-0" fill="rgba(59,130,246,0.6)" />
        <Particles
          className="absolute inset-0"
          quantity={140}
          color="#60a5fa"
          ease={80}
          staticity={30}
          size={0.8}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-6xl flex-col items-start justify-center gap-10 px-6 py-24 sm:px-10 lg:px-16 rtl:items-end">
          <NeonGradientCard className="inline-flex items-center gap-2 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            <AnimatedShinyText className="text-blue-600">
              {t("hero_badge")}
            </AnimatedShinyText>
          </NeonGradientCard>
          <div className="max-w-3xl space-y-6 rtl:text-right">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              <AnimatedGradientText
                className="font-semibold"
                colorFrom="#60a5fa"
                colorTo="#2563eb"
              >
                {t("hero_highlight")}
              </AnimatedGradientText>{" "}
              {t("title")}
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              {t("description")}
            </p>
          </div>
          <HeroActions
            primaryLabel={t("cta_primary")}
            secondaryLabel={t("cta_secondary")}
            primaryHref="/employer/jobs"
            secondaryHref="/jobs"
          />
          <div className="grid w-full gap-6 pt-6 sm:grid-cols-3">
            {[t("stats_jobs"), t("stats_talent"), t("stats_match")].map(
              (stat) => (
                <div
                  key={stat}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent p-4 text-sm font-semibold text-foreground shadow-lg shadow-blue-500/10 dark:text-blue-100"
                >
                  {stat}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-16">
        <Marquee pauseOnHover className="[--duration:30s]">
          {[
            "Stripe",
            "Notion",
            "Linear",
            "Vercel",
            "Figma",
            "Supabase",
          ].map((brand) => (
            <div
              key={brand}
              className="rounded-full border border-blue-500/20 bg-blue-500/5 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-500"
            >
              {brand}
            </div>
          ))}
        </Marquee>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10 lg:px-16 rtl:text-right">
        <div className="flex flex-col gap-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">
              {t("section_features")}
            </p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              {t("section_features")}
            </h2>
          </div>
          <BentoGrid className="auto-rows-[20rem] grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                title: t("feature_1_title"),
                description: t("feature_1_description"),
                icon: BrainCircuit,
              },
              {
                title: t("feature_2_title"),
                description: t("feature_2_description"),
                icon: Globe2,
              },
              {
                title: t("feature_3_title"),
                description: t("feature_3_description"),
                icon: Sparkles,
              },
              {
                title: t("feature_4_title"),
                description: t("feature_4_description"),
                icon: Wand2,
              },
            ].map((feature) => (
              <BentoCard
                key={feature.title}
                name={feature.title}
                description={feature.description}
                Icon={feature.icon}
                href="/jobs"
                cta={t("cta_secondary")}
                className="md:col-span-1"
                background={
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent" />
                }
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24 sm:px-10 lg:px-16 rtl:text-right">
        <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-500/15 via-blue-400/10 to-transparent p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">
            {t("section_flow")}
          </p>
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            {t("section_flow")}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: t("flow_1_title"),
                description: t("flow_1_description"),
              },
              {
                title: t("flow_2_title"),
                description: t("flow_2_description"),
              },
              {
                title: t("flow_3_title"),
                description: t("flow_3_description"),
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/10 bg-background/70 p-6"
              >
                <div className="text-sm font-semibold text-blue-500">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24 sm:px-10 lg:px-16 rtl:text-right">
        <div className="rounded-3xl border border-border/60 bg-card/60 p-10 text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            {t("section_cta")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("description")}
          </p>
          <div className="mt-8 flex justify-center">
            <HeroActions
              primaryLabel={t("cta_primary")}
              secondaryLabel={t("cta_secondary")}
              primaryHref="/employer/jobs"
              secondaryHref="/jobs"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
