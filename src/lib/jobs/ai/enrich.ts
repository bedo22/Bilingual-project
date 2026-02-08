import "server-only";
import { createClient } from "@/utils/supabase/server";
import type { Job } from "@/lib/types/jobs";

type EnrichmentResult = {
  ai_tags: string[];
  ai_summary: { en: string; ar: string };
};

export async function generateJobEnrichment(
  job: Job
): Promise<EnrichmentResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      ai_tags: job.skills_tags || [],
      ai_summary: {
        en: job.description.en.slice(0, 200),
        ar: job.description.ar.slice(0, 200),
      },
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const prompt = `You are a job analysis AI. Given a job posting, extract:
1. "tags": An array of 5-15 relevant lowercase skill/keyword tags
2. "summary_en": A concise 1-2 sentence summary in English
3. "summary_ar": A concise 1-2 sentence summary in Arabic

Job Title (EN): ${job.title.en}
Job Title (AR): ${job.title.ar}
Description (EN): ${job.description.en}
Description (AR): ${job.description.ar}
Category: ${job.category || "N/A"}
Skills: ${(job.skills_tags || []).join(", ")}

Respond with ONLY valid JSON: {"tags": [...], "summary_en": "...", "summary_ar": "..."}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(content);

    return {
      ai_tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean)
        : [],
      ai_summary: {
        en: parsed.summary_en || "",
        ar: parsed.summary_ar || "",
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function enrichJob(jobId: string): Promise<void> {
  const supabase = await createClient();

  const { data: job, error: fetchError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    return;
  }

  const typedJob = job as unknown as Job;

  try {
    const enrichment = await generateJobEnrichment(typedJob);

    await supabase
      .from("jobs")
      .update({
        ai_tags: enrichment.ai_tags as unknown as null,
        ai_summary: enrichment.ai_summary as unknown as null,
      })
      .eq("id", jobId);
  } catch {
    // Best-effort: don't block publishing if AI fails
  }
}
