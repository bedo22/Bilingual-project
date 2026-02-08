import { z } from "zod";

// Reusable localized text schema
export const localizedTextSchema = z.object({
  en: z.string().trim().min(1, "English text is required"),
  ar: z.string().trim().min(1, "Arabic text is required"),
});

// Helper for optional number from form input
const optionalNumber = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().nonnegative().optional());

// Create job schema (flat form inputs)
export const createJobSchema = z.object({
  locale: z.string().default("en"),
  titleEn: z.string().trim().min(1, "English title is required"),
  titleAr: z.string().trim().min(1, "Arabic title is required"),
  descriptionEn: z.string().trim().min(1, "English description is required"),
  descriptionAr: z.string().trim().min(1, "Arabic description is required"),
  category: z.string().trim().optional(),
  budget: optionalNumber,
  skillsTags: z.array(z.string().trim().min(1)).default([]),
  status: z.enum(["open", "closed", "draft"]).default("draft"),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

// Update job schema
export const updateJobSchema = createJobSchema.extend({
  jobId: z.string().uuid("Invalid job ID"),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

// Delete job schema
export const deleteJobSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
  locale: z.string().default("en"),
});

export type DeleteJobInput = z.infer<typeof deleteJobSchema>;

// Publish/unpublish job schema
export const publishJobSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
  locale: z.string().default("en"),
  publish: z.boolean(),
});

export type PublishJobInput = z.infer<typeof publishJobSchema>;

// Apply to job schema
export const applyToJobSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
  locale: z.string().default("en"),
  coverLetter: z.string().trim().max(5000, "Cover letter too long").optional(),
});

export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;

// Update application status schema (for employers)
export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
  locale: z.string().default("en"),
  status: z.enum(["pending", "accepted", "rejected"]),
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

// Save/unsave job schema
export const saveJobSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
  locale: z.string().default("en"),
});

export type SaveJobInput = z.infer<typeof saveJobSchema>;

// Job search/filter schema (for URL params)
export const jobSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["open", "closed", "draft"]).optional(),
  remote: z.coerce.boolean().optional(),
  minBudget: optionalNumber,
  maxBudget: optionalNumber,
  tags: z.string().optional(), // comma-separated
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(50).default(10),
});

export type JobSearchParams = z.infer<typeof jobSearchSchema>;
