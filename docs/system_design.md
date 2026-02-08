# System Design: Bilingual Job Matching Platform

**Status:** DRAFT | **Type:** Low Level Design (LLD)

## Document Goal & Best Practice

- **Goal:** Define the system structure (architecture, data model, routing, security, and flows).
- **Best practice:** Describe *what the system is* and *how components interact*, not *how to build it step-by-step*.
- **Out of scope:** Delivery milestones, build order, team workflow, and testing checklists (see Implementation Plan).

## 0. Scope & Assumptions

- **MVP scope (Phase 1):** Auth, profiles, job board, applications, bilingual UX (EN/AR with RTL/LTR).
- **Phase 2 (Compressed, included in 1-month plan):** Real-time messaging (1:1 text only), resume upload (single file), and AI-assisted matching (lightweight).
- **Deferred:** Admin moderation UI, messaging attachments, advanced ranking/scoring, profile parsing.
- **Stack:** Next.js App Router + Supabase (Postgres, Auth, Storage, Realtime) + `next-intl`.

## 1. High-Level Architecture (The "Bird's Eye View")

### Why this structure?

- **Next.js (App Router):** Keeps the app fast by rendering pages on the Server (SSR) but allowing instant interactions (Client Components).
- **Supabase (BaaS):** We don't want to manage a server. Supabase handles Auth, Database, and Realtime WebSocket connections automatically.
- **Edge Functions:** For the optional "Matching Algorithm" (Phase 2). Keep computation off the client.

```mermaid
graph TD
    User[User (Mobile/Desktop)] -->|HTTPS| Next[Next.js Frontend]
    Next -->|Auth & Data| Supabase[Supabase Client]

    subgraph "Supabase Backend"
        Auth[Auth Service]
        DB[(Postgres Database)]
        Storage[File Storage]
        Realtime[Realtime Engine]
    end

    subgraph "Logic Layer"
        Edge[Edge Functions] -->|Calculate| DB
    end

    Supabase --> Auth
    Supabase --> DB
    Supabase --> Realtime
```

---

## 2. Database Schema (The "Brain")

### Why Relational?

We need to perform complex queries like _"Find candidates who speak English AND live in Cairo AND have 5 stars."_
A NoSQL database (like Mongo) would struggle with these "Join" operations. Postgres is perfect for it.

### Core Tables (MVP)

#### `profiles` (Extends Auth)

| Column       | Type  | Why?                                                                |
| :----------- | :---- | :------------------------------------------------------------------ |
| `id`         | UUID  | Links directly to `auth.users` (Supabase security).                 |
| `role`       | ENUM  | 'employer' or 'professional' for RBAC.                              |
| `full_name`  | JSONB | Bilingual `{ en, ar }` name (meets SRS requirement).                |
| `bio`        | JSONB | Bilingual `{ en, ar }` bio.                                         |
| `avatar_url` | TEXT  | Profile picture.                                                    |
| `resume_url` | TEXT  | Private resume file path (Phase 2 compressed).                      |
| `ai_tags`    | JSONB | AI-generated tags for matching (Phase 2 compressed).                |

#### `jobs`

| Column         | Type  | Why?                                                                      |
| :------------- | :---- | :------------------------------------------------------------------------ |
| `id`           | UUID  | Primary Key.                                                              |
| `employer_id`  | UUID  | Foreign Key to `profiles`.                                                |
| `title`        | JSONB | Bilingual `{ en, ar }` job title.                                         |
| `description`  | JSONB | Bilingual `{ en, ar }` description.                                       |
| `category`     | TEXT  | Simple filtering for browsing.                                            |
| `budget`       | NUMERIC | Optional pricing info.                                                  |
| `skills_tags`  | JSONB | Flexible tagging without creating extra tables.                           |
| `status`       | ENUM  | 'open', 'closed', 'draft'.                                                |
| `ai_tags`      | JSONB | AI-generated tags for matching (Phase 2 compressed).                      |

#### `applications`

| Column         | Type | Why?                                         |
| :------------- | :--- | :------------------------------------------- |
| `job_id`       | UUID | Link to Job.                                 |
| `applicant_id` | UUID | Link to Profile (professional).              |
| `cover_letter` | TEXT | Required for applications (MVP).             |
| `status`       | ENUM | 'pending', 'accepted', 'rejected'.           |

#### `messages` (Phase 2 compressed)

| Column            | Type | Why?                                                |
| :---------------- | :--- | :-------------------------------------------------- |
| `id`              | UUID | Primary key.                                        |
| `thread_id`       | UUID | Links to a 1:1 conversation.                        |
| `sender_id`       | UUID | Links to `profiles`.                                |
| `recipient_id`    | UUID | Links to `profiles`.                                |
| `body`            | TEXT | Message content (text only).                        |
| `created_at`      | TIMESTAMPTZ | Ordering and realtime updates.               |

---

## 3. AI-Assisted Matching (Phase 2 compressed)

### Why Edge Functions?

We avoid a full scoring engine to fit the 1-month plan. Instead, we generate
AI tags and short summaries for jobs and profiles, then filter and lightly rank
results using those tags.

### Minimal Flow

1. On profile/job create or update, call an Edge Function.
2. Edge Function uses OpenAI (or Vercel AI SDK) to return structured tags.
3. Store tags in `profiles.ai_tags` / `jobs.ai_tags` (JSONB).
4. Query with basic filters and optional tag overlap ranking.

### Output Example

```json
{
  "tags": ["nextjs", "supabase", "react", "remote"],
  "summary": "Senior React dev with Supabase experience."
}
```

---

## 4. Bilingual Strategy (The "RTL" Factor)

### Why `next-intl`?

We need to handle not just translation, but **Direction**.

- English users see the logo on the Left.
- Arabic users see the logo on the Right.

**Implementation:**
We will use middleware to detect the locale (`/en/dashboard` vs `/ar/dashboard`) and automatically apply `dir="rtl"` to the HTML body. Tailwind's `start-0` and `end-0` classes will handle the flipping automatically.

---

## 5. File Uploads (Resumes/Avatars) (Phase 2 compressed)

### Why Signed URLs?

We don't want resumes to be public.

1. User uploads a single resume file to Supabase Storage Bucket (`private-resumes`).
2. Store the file path in `profiles.resume_url`.
3. When an Employer views the candidate, generate a **Signed URL** that works for only 5 minutes.
4. **Security:** Even if someone steals the link, it expires.

---

## 6. Real-Time Chat (Phase 2 compressed)

### Why Supabase Realtime?

Most chat apps require a separate server (Socket.io). Supabase allows us to simply "Subscribe" to the `messages` table.

- When User A inserts a row into `messages`, User B instantly receives it via WebSocket.
- Text-only, 1:1 conversations. No attachments, reactions, or typing indicators.
- **Cost:** $0 extra configuration.

---

## 7. Routing & Page Structure (App Router)

### Locale-first structure

- `/(locale)` segment where `locale` is `en` or `ar`.
- Shared layouts apply `dir` and locale fonts.

### Core routes (MVP)

- `/[locale]` Home / marketing landing
- `/[locale]/auth/login`
- `/[locale]/auth/register`
- `/[locale]/jobs` Job list with filters
- `/[locale]/jobs/[id]` Job details
- `/[locale]/profile/[id]` Public profile view
- `/[locale]/dashboard` Role-based dashboard
- `/[locale]/dashboard/jobs` Employer job management
- `/[locale]/dashboard/applications` Applications list

### Phase 2 routes

- `/[locale]/messages` Real-time chat UI
- `/[locale]/settings/storage` Resume uploads management

---

## 8. Authentication & Authorization

### Auth flow (MVP)

1. User registers with email/password.
2. Role is selected and stored in `profiles.role`.
3. Session persists via Supabase Auth cookies.
4. Protected routes require an active session.

### Role-based access control (RBAC)

- **Professional** can apply to jobs, manage their own profile and applications.
- **Employer** can create jobs and view applications for their own jobs.
- **Admin** moderation UI is deferred. Only database-level moderation via manual actions.

---

## 9. RLS Policies (Supabase)

### `profiles`

- `SELECT`: public read allowed (public profile requirement).
- `INSERT`: only authenticated user can insert their own profile.
- `UPDATE`: only owner can update their profile.

### `jobs`

- `SELECT`: public read allowed (job listings are public).
- `INSERT`: only authenticated employers.
- `UPDATE`/`DELETE`: only job owner (employer).

### `applications`

- `SELECT`: applicant can see their own applications; employer can see applications to their jobs.
- `INSERT`: only authenticated professionals.
- `UPDATE`: only employer (status changes).

### `messages` (Phase 2 compressed)

- `SELECT`: only participants (sender or recipient).
- `INSERT`: only participants can send.

### `profiles` resume access

- Resume files are private. Access only via signed URLs generated on the server.

---

## 10. API & Data Flow (Client to Supabase)

### Job listing flow

1. Client fetches jobs from `jobs` with filters.
2. UI renders bilingual fields based on locale.

### Application flow

1. Professional submits `cover_letter`.
2. Insert into `applications` with `pending` status.
3. Employer dashboard queries applications joined with jobs.

### Profile flow

1. User updates bilingual profile data in `profiles`.
2. Public profile page reads `profiles` by `id`.

---

## 11. Error Handling & Validation

- Client validates required fields (title, description, cover letter).
- Server rejects invalid role actions via RLS.
- User-friendly error messages are localized via `next-intl`.

---
