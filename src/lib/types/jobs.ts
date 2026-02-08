import type { Database } from "@/lib/types/supabase";

export type LocalizedText = { en: string; ar: string };

// Derive enums from generated types
export type JobStatus = Database["public"]["Enums"]["job_status"];
export type ApplicationStatus = Database["public"]["Enums"]["application_status"];

// Row types from generated schema
type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
type SavedJobRow = Database["public"]["Tables"]["saved_jobs"]["Row"];

// App-facing DTOs with typed JSONB fields
export type Job = Omit<
  JobRow,
  "title" | "description" | "skills_tags" | "ai_tags" | "ai_summary" | "status"
> & {
  title: LocalizedText;
  description: LocalizedText;
  skills_tags: string[];
  ai_tags: string[];
  ai_summary: LocalizedText;
  status: JobStatus;
};

export type Application = Omit<ApplicationRow, "status"> & {
  status: ApplicationStatus;
};

export type SavedJob = SavedJobRow;

// Insert/Update shapes
export type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"];
export type JobUpdate = Database["public"]["Tables"]["jobs"]["Update"];
export type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];
export type SavedJobInsert = Database["public"]["Tables"]["saved_jobs"]["Insert"];

// Extended types with relations (for joined queries)
export type JobWithEmployer = Job & {
  employer: {
    id: string;
    full_name: LocalizedText;
    avatar_url: string | null;
  };
};

export type ApplicationWithJob = Application & {
  job: Job;
};

export type ApplicationWithApplicant = Application & {
  applicant: {
    id: string;
    full_name: LocalizedText;
    avatar_url: string | null;
    skills: string[];
  };
};

export type SavedJobWithDetails = SavedJob & {
  job: Job;
};
