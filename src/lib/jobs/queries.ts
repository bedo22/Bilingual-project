import "server-only";
import { createClient } from "@/utils/supabase/server";
import type {
  Job,
  JobStatus,
  Application,
  SavedJob,
  JobWithEmployer,
  ApplicationWithApplicant,
  ApplicationWithJob,
  SavedJobWithDetails,
} from "@/lib/types/jobs";

type QueryResult<T> = { data: T | null; error: string | null };
type QueryListResult<T> = { data: T[]; error: string | null };

// Fetch published jobs for public job board
export async function fetchPublicJobs(params?: {
  category?: string;
  q?: string;
  tags?: string[];
  minBudget?: number;
  maxBudget?: number;
  limit?: number;
  offset?: number;
}): Promise<QueryListResult<Job>> {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (params?.category) {
    query = query.eq("category", params.category);
  }
  if (params?.minBudget) {
    query = query.gte("budget", params.minBudget);
  }
  if (params?.maxBudget) {
    query = query.lte("budget", params.maxBudget);
  }
  if (params?.tags && params.tags.length > 0) {
    query = query.overlaps("skills_tags", params.tags);
  }
  if (params?.limit) {
    query = query.limit(params.limit);
  }
  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  // Filter by search query in application layer (for JSONB title/description)
  let jobs = data as unknown as Job[];
  if (params?.q) {
    const searchLower = params.q.toLowerCase();
    jobs = jobs.filter(
      (job) =>
        job.title.en.toLowerCase().includes(searchLower) ||
        job.title.ar.toLowerCase().includes(searchLower) ||
        job.description.en.toLowerCase().includes(searchLower) ||
        job.description.ar.toLowerCase().includes(searchLower)
    );
  }

  return { data: jobs, error: null };
}

// Fetch single job by ID
export async function fetchJobById(jobId: string): Promise<QueryResult<Job>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as Job, error: null };
}

// Fetch job with employer details
export async function fetchJobWithEmployer(
  jobId: string
): Promise<QueryResult<JobWithEmployer>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      *,
      employer:profiles!employer_id (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("id", jobId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as JobWithEmployer, error: null };
}

// Fetch jobs for employer (their own jobs)
export async function fetchEmployerJobs(
  employerId: string,
  status?: JobStatus
): Promise<QueryListResult<Job>> {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("employer_id", employerId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as unknown as Job[], error: null };
}

// Fetch applications for a job (employer view)
export async function fetchApplicationsForJob(
  jobId: string
): Promise<QueryListResult<ApplicationWithApplicant>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      applicant:profiles!applicant_id (
        id,
        full_name,
        avatar_url,
        skills
      )
    `
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as unknown as ApplicationWithApplicant[], error: null };
}

// Fetch user's applications (professional view)
export async function fetchMyApplications(
  applicantId: string
): Promise<QueryListResult<Application>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as unknown as Application[], error: null };
}

// Fetch user's applications with job details
export async function fetchMyApplicationsWithJob(
  applicantId: string
): Promise<QueryListResult<ApplicationWithJob>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("*, job:jobs(id, title, status, category, budget, created_at)")
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as unknown as ApplicationWithJob[], error: null };
}

// Check if user has applied to a job
export async function hasAppliedToJob(
  jobId: string,
  applicantId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("applicant_id", applicantId)
    .single();

  return !!data;
}

// Fetch user's saved jobs
export async function fetchSavedJobs(
  userId: string
): Promise<QueryListResult<SavedJobWithDetails>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("saved_jobs")
    .select(
      `
      *,
      job:jobs (*)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as unknown as SavedJobWithDetails[], error: null };
}

// Check if user has saved a job
export async function hasSavedJob(
  jobId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .single();

  return !!data;
}

// Get job counts for dashboard
export async function getEmployerJobStats(employerId: string): Promise<{
  total: number;
  open: number;
  closed: number;
  draft: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("status")
    .eq("employer_id", employerId);

  if (error || !data) {
    return { total: 0, open: 0, closed: 0, draft: 0 };
  }

  return {
    total: data.length,
    open: data.filter((j) => j.status === "open").length,
    closed: data.filter((j) => j.status === "closed").length,
    draft: data.filter((j) => j.status === "draft").length,
  };
}

// Get application count for a job
export async function getApplicationCount(jobId: string): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId);

  return count || 0;
}
