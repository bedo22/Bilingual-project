"use server";

import { createClient } from "@/utils/supabase/server";
import { requireOnboarding } from "@/lib/auth";
import {
  createJobSchema,
  updateJobSchema,
  deleteJobSchema,
  publishJobSchema,
  applyToJobSchema,
  updateApplicationStatusSchema,
  saveJobSchema,
} from "@/lib/validators/jobs";
import type { Job, Application, SavedJob } from "@/lib/types/jobs";

type ActionResult<T> = { data?: T; error?: string };

// Create a new job (employers only)
export async function createJob(input: unknown): Promise<ActionResult<Job>> {
  const parsed = createJobSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;
  const user = await requireOnboarding(data.locale);

  if (user.profile?.role !== "employer") {
    return { error: "Only employers can create jobs" };
  }

  const supabase = await createClient();

  const insertData = {
    employer_id: user.id,
    title: { en: data.titleEn, ar: data.titleAr },
    description: { en: data.descriptionEn, ar: data.descriptionAr },
    category: data.category || null,
    budget: data.budget || null,
    skills_tags: data.skillsTags,
    status: data.status,
  };

  const { data: job, error } = await supabase
    .from("jobs")
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: job as unknown as Job };
}

// Update an existing job (employers only, own jobs)
export async function updateJob(input: unknown): Promise<ActionResult<Job>> {
  const parsed = updateJobSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;
  const user = await requireOnboarding(data.locale);

  if (user.profile?.role !== "employer") {
    return { error: "Only employers can update jobs" };
  }

  const supabase = await createClient();

  const updateData = {
    title: { en: data.titleEn, ar: data.titleAr },
    description: { en: data.descriptionEn, ar: data.descriptionAr },
    category: data.category || null,
    budget: data.budget || null,
    skills_tags: data.skillsTags,
    status: data.status,
  };

  const { data: job, error } = await supabase
    .from("jobs")
    .update(updateData)
    .eq("id", data.jobId)
    .eq("employer_id", user.id) // Ensure ownership
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: job as unknown as Job };
}

// Delete a job (employers only, own jobs)
export async function deleteJob(input: unknown): Promise<ActionResult<boolean>> {
  const parsed = deleteJobSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;
  const user = await requireOnboarding(data.locale);

  if (user.profile?.role !== "employer") {
    return { error: "Only employers can delete jobs" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", data.jobId)
    .eq("employer_id", user.id); // Ensure ownership

  if (error) {
    return { error: error.message };
  }

  return { data: true };
}

// Publish or unpublish a job
export async function toggleJobPublish(input: unknown): Promise<ActionResult<Job>> {
  const parsed = publishJobSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;
  const user = await requireOnboarding(data.locale);

  if (user.profile?.role !== "employer") {
    return { error: "Only employers can publish jobs" };
  }

  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .update({ status: data.publish ? "open" : "draft" })
    .eq("id", data.jobId)
    .eq("employer_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Trigger AI enrichment on publish (best-effort, non-blocking)
  if (data.publish) {
    try {
      const { enrichJob } = await import("@/lib/jobs/ai/enrich");
      await enrichJob(data.jobId);
    } catch {
      // Don't fail publish if AI enrichment fails
    }
  }

  return { data: job as unknown as Job };
}

// Apply to a job (professionals only)
export async function applyToJob(input: unknown): Promise<ActionResult<Application>> {
  const parsed = applyToJobSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;
  const user = await requireOnboarding(data.locale);

  if (user.profile?.role !== "professional") {
    return { error: "Only professionals can apply to jobs" };
  }

  const supabase = await createClient();

  // Check if job exists and is open
  const { data: job } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", data.jobId)
    .single();

  if (!job) {
    return { error: "Job not found" };
  }

  if (job.status !== "open") {
    return { error: "This job is not accepting applications" };
  }

  const { data: application, error } = await supabase
    .from("applications")
    .insert({
      job_id: data.jobId,
      applicant_id: user.id,
      cover_letter: data.coverLetter || null,
    })
    .select("*")
    .single();

  if (error) {
    // Handle duplicate application
    if (error.code === "23505") {
      return { error: "You have already applied to this job" };
    }
    return { error: error.message };
  }

  return { data: application as unknown as Application };
}

// Update application status (employers only, for their jobs)
export async function updateApplicationStatus(
  input: unknown
): Promise<ActionResult<Application>> {
  const parsed = updateApplicationStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;
  const user = await requireOnboarding(data.locale);

  if (user.profile?.role !== "employer") {
    return { error: "Only employers can update application status" };
  }

  const supabase = await createClient();

  // RLS handles ownership check, but we verify explicitly for better error messages
  const { data: application, error: fetchError } = await supabase
    .from("applications")
    .select("job_id")
    .eq("id", data.applicationId)
    .single();

  if (fetchError || !application) {
    return { error: "Application not found" };
  }

  // Verify the job belongs to this employer
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", application.job_id)
    .eq("employer_id", user.id)
    .single();

  if (!job) {
    return { error: "You can only update applications for your own jobs" };
  }

  const { data: updated, error } = await supabase
    .from("applications")
    .update({ status: data.status })
    .eq("id", data.applicationId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: updated as unknown as Application };
}

// Save a job (any authenticated user, but mainly for professionals)
export async function saveJob(input: unknown): Promise<ActionResult<SavedJob>> {
  const parsed = saveJobSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;
  const user = await requireOnboarding(data.locale);

  const supabase = await createClient();

  const { data: saved, error } = await supabase
    .from("saved_jobs")
    .insert({
      job_id: data.jobId,
      user_id: user.id,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Job already saved" };
    }
    return { error: error.message };
  }

  return { data: saved as unknown as SavedJob };
}

// Unsave a job
export async function unsaveJob(input: unknown): Promise<ActionResult<boolean>> {
  const parsed = saveJobSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;
  const user = await requireOnboarding(data.locale);

  const supabase = await createClient();

  const { error } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("job_id", data.jobId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { data: true };
}

// Withdraw an application (professionals only)
export async function withdrawApplication(input: {
  applicationId: string;
  locale: string;
}): Promise<ActionResult<boolean>> {
  const user = await requireOnboarding(input.locale);

  if (user.profile?.role !== "professional") {
    return { error: "Only professionals can withdraw applications" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", input.applicationId)
    .eq("applicant_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { data: true };
}
