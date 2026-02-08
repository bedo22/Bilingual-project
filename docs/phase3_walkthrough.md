# Phase 3 Walkthrough: Job Board Module

This document explains the implementation of Phase 3 (Job Board Module) for the Bilingual Job Platform. It covers the architectural decisions, patterns used, and the reasoning behind each component.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Jobs Module Architecture](#jobs-module-architecture)
4. [Employer CRUD Implementation](#employer-crud-implementation)
5. [Public Job Board Implementation](#public-job-board-implementation)
6. [Patterns & Conventions](#patterns--conventions)
7. [File Structure](#file-structure)

---

## Overview

### Goal
Enable job posting and discovery with:
- Employer job CRUD (create, read, update, delete)
- Bilingual support (English/Arabic) for all job content
- AI-ready fields for future enrichment
- Role-based access (employers create jobs, professionals apply)

### Build Sequence
We followed a layered approach:
1. **Database first** - Schema and RLS policies
2. **Domain layer** - Types, validators, queries, actions
3. **UI layer** - Routes, pages, components

---

## Database Schema

### File: `supabase/migration_phase3_jobs.sql`

#### What We Added

##### 1. AI Summary Column
```sql
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS ai_summary jsonb NOT NULL DEFAULT '{}'::jsonb;
```
**Why:** Prepares for AI-assisted matching. Uses JSONB to support bilingual summaries `{ en: "...", ar: "..." }`.

##### 2. Saved Jobs Table
```sql
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (job_id, user_id)
);
```
**Why:** 
- Professionals need to bookmark jobs for later
- `UNIQUE (job_id, user_id)` prevents duplicate saves
- `ON DELETE CASCADE` cleans up when jobs/users are deleted

##### 3. RLS Policies for saved_jobs
```sql
-- Only view own saves
CREATE POLICY "Users can view their saved jobs" ON public.saved_jobs 
FOR SELECT USING (auth.uid() = user_id);

-- Only professionals can save
CREATE POLICY "Professionals can save jobs" ON public.saved_jobs 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'professional')
);

-- Only delete own saves
CREATE POLICY "Users can unsave jobs" ON public.saved_jobs 
FOR DELETE USING (auth.uid() = user_id);
```
**Why:** Defense in depth - even if app code has bugs, database enforces security.

##### 4. Tightened UPDATE Policies
```sql
-- Jobs: prevent employer_id from being changed
CREATE POLICY "Employers can update their own jobs." ON public.jobs 
FOR UPDATE
USING (auth.uid() = employer_id)
WITH CHECK (auth.uid() = employer_id);
```
**Why:** `WITH CHECK` ensures the row still belongs to the user after update, preventing ownership transfer attacks.

##### 5. Performance Indexes
```sql
CREATE INDEX IF NOT EXISTS jobs_status_created_idx ON public.jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_ai_tags_idx ON public.jobs USING GIN (ai_tags);
```
**Why:** 
- Status + created_at: Fast filtering of open jobs sorted by date
- GIN on ai_tags: Efficient array overlap queries for tag-based search

---

## Jobs Module Architecture

### Layer Separation

```
src/lib/
├── types/jobs.ts      # Data shapes (DTOs)
├── validators/jobs.ts # Input validation (Zod)
└── jobs/
    ├── queries.ts     # Read operations (server-only)
    └── actions.ts     # Write operations (server actions)
```

### File: `src/lib/types/jobs.ts`

#### Purpose
Define TypeScript types that match our database schema with proper JSONB typing.

#### Key Types
```typescript
export type LocalizedText = { en: string; ar: string };

export type Job = {
  id: string;
  employer_id: string;
  title: LocalizedText;        // Bilingual
  description: LocalizedText;  // Bilingual
  skills_tags: string[];
  ai_tags: string[];
  ai_summary: LocalizedText;
  status: JobStatus;
  // ...
};
```

**Why standalone types (not generated)?** 
- Supabase generates `Json` as a union type, losing the actual shape
- Manual types give us `{ en, ar }` instead of `unknown`
- Can be synced with generated types later

#### Extended Types for Joins
```typescript
export type JobWithEmployer = Job & {
  employer: {
    id: string;
    full_name: LocalizedText;
    avatar_url: string | null;
  };
};
```
**Why:** Supabase joins return nested objects; typing them explicitly prevents `any` leakage.

---

### File: `src/lib/validators/jobs.ts`

#### Purpose
Centralize all input validation using Zod schemas.

#### Pattern: Flat Form Inputs → JSONB Assembly
```typescript
export const createJobSchema = z.object({
  locale: z.string().default("en"),
  titleEn: z.string().trim().min(1, "English title is required"),
  titleAr: z.string().trim().min(1, "Arabic title is required"),
  // ... flat fields
});
```

**Why flat instead of nested?**
- HTML forms naturally produce flat data
- Easier to bind to controlled inputs
- JSONB assembly (`{ en, ar }`) happens in actions

#### Exported Input Types
```typescript
export type CreateJobInput = z.infer<typeof createJobSchema>;
```
**Why:** Actions can type their parameters without duplicating the schema.

---

### File: `src/lib/jobs/queries.ts`

#### Purpose
All read operations in one server-only module.

#### Key Pattern: `import "server-only"`
```typescript
import "server-only";
```
**Why:** Prevents accidental client bundling of server code (database credentials, etc.).

#### Return Shape
```typescript
type QueryResult<T> = { data: T | null; error: string | null };

export async function fetchJobById(jobId: string): Promise<QueryResult<Job>> {
  // ...
  if (error) return { data: null, error: error.message };
  return { data: data as unknown as Job, error: null };
}
```
**Why:** 
- Consistent error handling across all queries
- No throwing - let caller decide what to do
- Type assertion at boundary (`as unknown as Job`) since Supabase returns generic JSON

#### JSONB Search Workaround
```typescript
// Filter by search query in application layer (for JSONB title/description)
if (params?.q) {
  const searchLower = params.q.toLowerCase();
  jobs = jobs.filter(
    (job) =>
      job.title.en.toLowerCase().includes(searchLower) ||
      job.title.ar.toLowerCase().includes(searchLower)
  );
}
```
**Why:** PostgreSQL JSONB search with `ilike` on nested fields is complex. For MVP with small datasets, app-layer filtering is simpler. Can optimize with FTS later.

---

### File: `src/lib/jobs/actions.ts`

#### Purpose
All write operations as Next.js Server Actions.

#### Pattern: Validation → Auth → Role Check → Mutation
```typescript
export async function createJob(input: unknown): Promise<ActionResult<Job>> {
  // 1. Validate input
  const parsed = createJobSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  // 2. Require authenticated + onboarded user
  const user = await requireOnboarding(data.locale);

  // 3. Role check (in addition to RLS)
  if (user.profile?.role !== "employer") {
    return { error: "Only employers can create jobs" };
  }

  // 4. Assemble JSONB and insert
  const insertData = {
    employer_id: user.id,
    title: { en: data.titleEn, ar: data.titleAr },
    // ...
  };

  const { data: job, error } = await supabase.from("jobs").insert(insertData)...
}
```

**Why role check in app + RLS?**
- RLS: Security (can't bypass even with direct DB access)
- App check: Better UX (clear error message before hitting database)

#### JSONB Assembly
```typescript
title: { en: data.titleEn, ar: data.titleAr },
description: { en: data.descriptionEn, ar: data.descriptionAr },
```
**Why here?** Single place to transform flat form data → database shape.

---

## Employer CRUD Implementation

### Route Structure

```
src/app/[locale]/(protected)/employer/jobs/
├── page.tsx                    # List jobs
├── new/page.tsx                # Create job
├── [jobId]/edit/page.tsx       # Edit job
├── actions.ts                  # Route-local action wrappers
└── _components/
    ├── job-form.tsx            # Bilingual form (create/edit)
    └── job-card.tsx            # Job card with actions
```

### File: `actions.ts` (Route-Local Wrappers)

#### Purpose
Thin wrappers that call domain actions and handle redirects.

```typescript
export async function createEmployerJob(input: CreateJobInput) {
  const result = await createJob(input);

  if (result.error) {
    return { error: result.error };
  }

  redirect({ href: "/employer/jobs", locale: input.locale });
}
```

**Why separate from domain actions?**
- Domain actions (`src/lib/jobs/actions.ts`) are reusable, return data
- Route actions handle navigation/redirect (UI concern)
- Matches existing pattern (see `onboarding/actions.ts`)

---

### File: `job-form.tsx`

#### Purpose
2-step bilingual form for creating/editing jobs.

#### Pattern: Controlled Inputs with useState
```typescript
const [formData, setFormData] = useState({
  titleEn: initial?.title.en ?? "",
  titleAr: initial?.title.ar ?? "",
  // ...
});
```
**Why controlled?** 
- Matches existing onboarding wizard pattern
- Easy step navigation without losing data
- Can validate before step transition

#### Bilingual Input Pattern
```tsx
{/* English field */}
<Input
  id="titleEn"
  value={formData.titleEn}
  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
/>

{/* Arabic field with RTL */}
<Input
  id="titleAr"
  dir="rtl"
  value={formData.titleAr}
  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
/>
```
**Why `dir="rtl"`?** Arabic text displays correctly right-to-left.

#### Step Navigation
```typescript
const [step, setStep] = useState(1);
const totalSteps = 2;

// Step 1: Bilingual content (title, description)
// Step 2: Details (category, budget, skills, status)
```
**Why 2 steps?** 
- Groups related fields logically
- Bilingual content first (most important)
- Details second (optional fields)

---

### File: `job-card.tsx`

#### Purpose
Display job summary with action buttons.

#### Localized Display
```typescript
const title = locale === "ar" ? job.title.ar : job.title.en;
```
**Why check locale?** Display content in user's language.

#### Status Badges
```typescript
const statusColors = {
  draft: "bg-yellow-100 text-yellow-800",
  open: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};
```
**Why color-coded?** Visual distinction helps employers quickly scan job status.

#### Optimistic UI Pattern
```typescript
const handleTogglePublish = async () => {
  setIsToggling(true);
  const result = await toggleEmployerJobPublish({...});
  
  if (result?.error) {
    alert(result.error);
  }
  
  setIsToggling(false);
  router.refresh();  // Revalidate server data
};
```
**Why `router.refresh()`?** 
- Toggle doesn't redirect (unlike create/delete)
- Refresh fetches updated data from server
- Simpler than client-side state management

---

### File: `page.tsx` (Jobs List)

#### Purpose
Server component that fetches and displays employer's jobs.

#### Pattern: Server Component with Auth
```typescript
export default async function EmployerJobsPage({ params }: Props) {
  const { locale } = await params;
  const user = await requireOnboarding(locale);
  
  // Role guard
  if (user.profile?.role !== "employer") {
    return <p>This page is only accessible to employers.</p>;
  }

  const { data: jobs } = await fetchEmployerJobs(user.id);
  // ...
}
```

**Why server component?**
- Data fetching at render time (no loading states needed)
- Auth check before any rendering
- SEO-friendly (though this is a protected page)

---

## Public Job Board Implementation

### Route Structure

```
src/app/[locale]/jobs/           # PUBLIC routes (not in (protected))
├── page.tsx                     # Job listing with filters
├── [jobId]/page.tsx            # Job details
└── _components/
    ├── job-filters.tsx         # Filter form (server component)
    ├── public-job-card.tsx     # Job preview card
    ├── pagination.tsx          # Page navigation
    └── save-apply-buttons.tsx  # Save/Apply CTAs (client component)
```

**Why outside `(protected)`?** Public routes should be accessible without authentication. Anyone can browse jobs.

---

### File: `page.tsx` (Job Listing)

#### Purpose
Server component that displays filterable, paginated job listings.

#### URL-Based Filter Strategy
```typescript
type Props = {
  searchParams: Promise<{
    q?: string;        // Text search
    category?: string; // Category filter
    tags?: string;     // Comma-separated skills
    minBudget?: string;
    maxBudget?: string;
    page?: string;     // Pagination
  }>;
};
```

**Why URL params as state?**
- Shareable/bookmarkable URLs
- No client-side state management needed
- Works with browser back/forward
- SEO-friendly

#### Parsing Search Params
```typescript
const q = filters.q?.trim() || undefined;
const tags = filters.tags
  ? filters.tags.split(",").map((t) => t.trim()).filter(Boolean)
  : undefined;
const page = Math.max(1, Number(filters.page) || 1);
const limit = 12;
const offset = (page - 1) * limit;
```

**Key patterns:**
- Trim strings to avoid whitespace issues
- Split tags by comma, filter empty strings
- Ensure page is at least 1
- Calculate offset for pagination

#### "Has More" Check
```typescript
const { data: jobs } = await fetchPublicJobs({
  limit: limit + 1, // Fetch one extra
  offset,
});

const hasMore = jobs ? jobs.length > limit : false;
const displayJobs = jobs ? jobs.slice(0, limit) : [];
```

**Why fetch one extra?** Cheapest way to know if "Next" page exists without a separate count query.

---

### File: `job-filters.tsx`

#### Purpose
GET-form-based filter UI that preserves URL-as-state pattern.

#### Pattern: Native HTML Form with GET
```tsx
<form method="GET" className="space-y-4">
  <Input name="q" defaultValue={currentFilters.q} />
  <Input name="category" defaultValue={currentFilters.category} />
  <Input name="tags" defaultValue={currentFilters.tags} />
  <Button type="submit">{t("filter")}</Button>
  <Link href="/jobs">
    <Button type="button" variant="outline">{t("clear_filters")}</Button>
  </Link>
</form>
```

**Why GET form?**
- Native browser behavior, no JavaScript needed
- Form submission updates URL params
- Works with server components
- "Clear" is just a link to `/jobs` without params

---

### File: `[jobId]/page.tsx` (Job Details)

#### Purpose
Display full job information with save/apply actions.

#### Optional Auth Pattern
```typescript
// Don't require auth - just check if logged in
const user = await getUser();
const userRole = user?.profile?.role ?? null;
```

**Why optional auth?**
- Anyone can view job details
- Auth only affects which CTAs are shown
- No redirect for unauthenticated users

#### Public Guard
```typescript
if (job.status !== "open") {
  return (
    <div className="text-center">
      <h1>{t("job_closed")}</h1>
      <Link href="/jobs">
        <Button>{t("back_to_jobs")}</Button>
      </Link>
    </div>
  );
}
```

**Why guard status?**
- Only "open" jobs should be publicly viewable
- Draft/closed jobs shouldn't be accessible via URL

#### Pre-fetching Save/Apply State
```typescript
if (user && userRole === "professional") {
  [hasSaved, hasApplied] = await Promise.all([
    hasSavedJob(jobId, user.id),
    hasAppliedToJob(jobId, user.id),
  ]);
}
```

**Why parallel fetch?** Both queries are independent, so run them concurrently for faster page load.

---

### File: `save-apply-buttons.tsx`

#### Purpose
Client component handling save/apply interactions based on user role.

#### Role-Based Rendering
```typescript
// Not logged in
if (userRole === null) {
  return (
    <Link href={`/login?next=/jobs/${jobId}`}>
      <Button>{t("sign_in_to_apply")}</Button>
    </Link>
  );
}

// Employer
if (userRole === "employer") {
  return <p>{t("employers_cannot_apply")}</p>;
}

// Professional - show actual buttons
return (
  <Button onClick={handleApply} disabled={applied}>
    {applied ? t("applied") : t("apply")}
  </Button>
);
```

**Why client component?**
- Needs interactivity (click handlers, loading states)
- Optimistic UI updates after save/apply

#### Return URL Pattern
```tsx
<Link href={`/login?next=/jobs/${jobId}`}>
```

**Why `?next=` param?** After login, user returns to the job they were viewing.

---

### File: `pagination.tsx`

#### Purpose
Server component for page navigation that preserves filter params.

#### Preserving Params
```typescript
const buildUrl = (page: number) => {
  const params = new URLSearchParams();
  Object.entries(baseParams).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  params.set("page", String(page));
  return `/jobs?${params.toString()}`;
};
```

**Why preserve params?** Changing page shouldn't reset filters.

---

### i18n: `PublicJobs` Namespace

Added separate namespace from `Jobs` (employer dashboard) to keep translations organized:

```json
"PublicJobs": {
  "title": "Browse Jobs",
  "search_placeholder": "Search jobs...",
  "apply": "Apply Now",
  "applied": "Applied",
  "sign_in_to_apply": "Sign in to apply",
  "employers_cannot_apply": "Employers cannot apply to jobs",
  // ...
}
```

**Why separate namespace?**
- Public-facing copy differs from dashboard copy
- Easier to find/update public strings
- Avoids key conflicts

---

## Patterns & Conventions

### 1. Bilingual JSONB Fields
```
Database: jsonb { en: string, ar: string }
Form:     flat fields (titleEn, titleAr)
Display:  locale check (job.title[locale])
```

### 2. Error Handling
```typescript
// Actions return { data?, error? }
const result = await createJob(input);
if (result.error) {
  return { error: result.error };
}
```

### 3. Auth Flow
```
requireOnboarding(locale)
  └── requireAuth(locale)
        └── getUser()
              └── supabase.auth.getUser()
```

### 4. i18n
```typescript
// Server components
const t = await getTranslations("Jobs");

// Client components
const t = useTranslations("Jobs");
```

### 5. Navigation
```typescript
// Always use i18n routing helpers
import { Link, redirect, useRouter } from "@/i18n/routing";
```

---

## File Structure

```
src/
├── lib/
│   ├── types/
│   │   └── jobs.ts              # Job, Application, SavedJob DTOs
│   ├── validators/
│   │   └── jobs.ts              # Zod schemas
│   └── jobs/
│       ├── queries.ts           # fetchJobs, fetchJobById, etc.
│       └── actions.ts           # createJob, updateJob, deleteJob, etc.
│
├── app/[locale]/
│   ├── jobs/                    # PUBLIC job board
│   │   ├── page.tsx             # Job listing with filters
│   │   ├── [jobId]/page.tsx     # Job details
│   │   └── _components/
│   │       ├── job-filters.tsx      # Filter form
│   │       ├── public-job-card.tsx  # Job preview card
│   │       ├── pagination.tsx       # Page navigation
│   │       └── save-apply-buttons.tsx # Save/Apply CTAs
│   │
│   └── (protected)/employer/jobs/   # PROTECTED employer dashboard
│       ├── page.tsx                 # Employer's jobs list
│       ├── new/page.tsx             # Create job
│       ├── [jobId]/edit/page.tsx    # Edit job
│       ├── actions.ts               # Route wrappers with redirects
│       └── _components/
│           ├── job-form.tsx         # Bilingual form
│           └── job-card.tsx         # Job display card
│
├── messages/
│   ├── en.json                  # English (added "Jobs" + "PublicJobs" namespaces)
│   └── ar.json                  # Arabic (added "Jobs" + "PublicJobs" namespaces)
│
└── supabase/
    └── migration_phase3_jobs.sql # DB migration
```

---

## Step 5: Applications & Saved Jobs Dashboard

### Route Structure

```
src/app/[locale]/(protected)/dashboard/
├── page.tsx                          # Main dashboard (real counts, linked cards)
├── (professional)/
│   ├── layout.tsx                    # Role guard: professional only
│   ├── saved/
│   │   ├── page.tsx                  # Saved jobs list
│   │   └── _components/
│   │       └── unsave-button.tsx     # Unsave action (client)
│   ├── applications/
│   │   ├── page.tsx                  # Applied jobs list with status
│   │   └── _components/
│   │       └── withdraw-button.tsx   # Withdraw action (client)
│   └── recommended/
│       └── page.tsx                  # AI-matched job recommendations
└── (employer)/
    ├── layout.tsx                    # Role guard: employer only
    └── jobs/
        ├── page.tsx                  # Employer jobs with stats + app counts
        └── [jobId]/applicants/
            ├── page.tsx              # Applicant list for a job
            └── _components/
                └── status-updater.tsx # Accept/reject buttons (client)
```

**Why route groups `(professional)` / `(employer)`?**
- Centralizes role authorization in layout instead of repeating on each page
- Route groups don't affect URL structure

---

### Main Dashboard: Real Counts

The dashboard page now fetches real data instead of hardcoded "0":

```typescript
// Professional
const [appsResult, savedResult] = await Promise.all([
  fetchMyApplications(user.id),
  fetchSavedJobs(user.id),
]);
appliedJobs = appsResult.data.length;
savedJobs = savedResult.data.length;

// Employer
const stats = await getEmployerJobStats(user.id);
postedJobs = stats.total;
```

Cards are wrapped in `<Link>` to navigate to the relevant subpage.

---

### Professional: Saved Jobs (`/dashboard/saved`)

- Server component fetches `fetchSavedJobs(user.id)` (already joins job data)
- Shows localized title, description, budget, category
- "View Job" links to `/jobs/[jobId]`
- "Unsave" button (client component) calls `unsaveJob()` then `router.refresh()`

### Professional: Applications (`/dashboard/applications`)

- Uses `fetchMyApplicationsWithJob(user.id)` - new join query to avoid N+1
- Shows job title, application status badge (pending/accepted/rejected), applied date
- "Withdraw" button only shown for pending applications
- Withdraw calls `withdrawApplication()` with confirmation dialog

### Employer: Jobs & Stats (`/dashboard/jobs`)

- Fetches employer jobs + stats in parallel
- Shows stat cards: total, open, draft, closed
- Per-job cards show application count and link to applicants page
- `Promise.all(getApplicationCount())` computes per-job counts

### Employer: Applicants (`/dashboard/jobs/[jobId]/applicants`)

- Ownership verified: `job.employer_id !== user.id` → `notFound()`
- Uses `fetchApplicationsForJob(jobId)` (joins applicant profile)
- Shows: applicant name, avatar, skills, cover letter preview, applied date
- Status updater (client component) with Accept/Reject buttons
- Only shown for "pending" applications

---

## Step 6: AI Enrichment

### Architecture

```
src/lib/jobs/ai/
└── enrich.ts      # generateJobEnrichment() + enrichJob()
```

### How It Works

#### 1. Enrichment Function (`generateJobEnrichment`)
- Takes a `Job` object
- Calls OpenAI API (gpt-4o-mini) with structured prompt
- Returns `{ ai_tags: string[], ai_summary: { en, ar } }`
- 10-second timeout via AbortController
- Falls back to `skills_tags` and truncated description if no API key

#### 2. Database Update (`enrichJob`)
- Fetches job by ID
- Calls `generateJobEnrichment()`
- Updates `jobs.ai_tags` and `jobs.ai_summary` in database
- Silently catches errors (best-effort)

#### 3. Trigger Point: On Publish
```typescript
// In toggleJobPublish() action
if (data.publish) {
  try {
    const { enrichJob } = await import("@/lib/jobs/ai/enrich");
    await enrichJob(data.jobId);
  } catch {
    // Don't fail publish if AI enrichment fails
  }
}
```

**Why dynamic import?** Avoids loading AI code on every action invocation. Only loaded when publishing.

**Why best-effort?** Publishing must succeed even if AI fails. Tags/summary are enhancement, not requirements.

---

### Recommended Jobs (Tag-Overlap Matching)

#### Route: `/dashboard/recommended` (professional only)

#### Algorithm
```typescript
// 1. Get user's skills from profile
const userSkills = profile.skills as string[];

// 2. Fetch open jobs (limit 100)
const { data: jobs } = await fetchPublicJobs({ limit: 100 });

// 3. Score by tag overlap
const scoredJobs = jobs.map((job) => {
  const allTags = [...(job.skills_tags || []), ...(job.ai_tags || [])];
  const score = computeMatchScore(userSkills, allTags);
  return { job, score };
})
.filter((item) => item.score > 0)
.sort((a, b) => b.score - a.score)
.slice(0, 20);
```

**Why tag overlap?**
- Simple, transparent, and fast
- No embeddings or vector DB needed
- Users see which skills matched (green badges)
- Good enough for MVP; can upgrade to semantic matching later

#### Display
- Score badge showing match count
- Green skill badges for matched tags
- Standard job card layout

---

## Complete File Structure

```
src/
├── lib/
│   ├── types/
│   │   ├── supabase.ts              # Generated Supabase types
│   │   └── jobs.ts                  # Job DTOs (derives from generated types)
│   ├── validators/
│   │   └── jobs.ts                  # Zod schemas
│   ├── auth.ts                      # Auth helpers (uses generated UserRole)
│   └── jobs/
│       ├── queries.ts               # All read operations
│       ├── actions.ts               # All write operations + AI trigger
│       └── ai/
│           └── enrich.ts            # AI tag/summary generation
│
├── utils/supabase/
│   ├── server.ts                    # createServerClient<Database>
│   └── client.ts                    # createBrowserClient<Database>
│
├── app/[locale]/
│   ├── jobs/                        # PUBLIC
│   │   ├── page.tsx                 # Job board with filters
│   │   ├── [jobId]/page.tsx         # Job details + save/apply
│   │   └── _components/
│   │
│   └── (protected)/
│       ├── dashboard/
│       │   ├── page.tsx             # Main dashboard (real counts)
│       │   ├── (professional)/
│       │   │   ├── layout.tsx       # Role guard
│       │   │   ├── saved/           # Saved jobs
│       │   │   ├── applications/    # Applied jobs
│       │   │   └── recommended/     # AI-matched jobs
│       │   └── (employer)/
│       │       ├── layout.tsx       # Role guard
│       │       └── jobs/            # Employer jobs + applicants
│       │
│       └── employer/jobs/           # Job CRUD
│           ├── page.tsx
│           ├── new/page.tsx
│           ├── [jobId]/edit/page.tsx
│           └── _components/
│
├── messages/
│   ├── en.json                      # EN: Jobs, PublicJobs, DashboardPro, DashboardEmployer
│   └── ar.json                      # AR: same namespaces
│
└── supabase/
    └── migration_phase3_jobs.sql
```

---

## Phase 3 Complete

All 6 steps are implemented:

| Step | Status | Summary |
|------|--------|---------|
| 1. DB Schema + RLS | ✅ | saved_jobs table, ai_summary column, tightened policies |
| 2. Jobs Module | ✅ | Types, validators, queries, actions with typed Supabase |
| 3. Employer CRUD | ✅ | Create/edit/publish jobs with bilingual forms |
| 4. Public Job Board | ✅ | Browse/filter/search jobs, save/apply with role-based CTAs |
| 5. Dashboard | ✅ | Professional saved/applied/recommended, employer jobs/applicants |
| 6. AI Enrichment | ✅ | Auto-tag on publish, tag-overlap recommended jobs |
