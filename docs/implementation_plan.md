# Bilingual Job Matching Platform - Implementation Plan

This plan outlines the *execution strategy* for building the bilingual (Arabic/English) job matching platform using Next.js and Supabase.

## Document Goal & Best Practice

- **Goal:** Define *how we will build and deliver* the system (phases, tasks, sequencing, and verification).
- **Best practice:** Focus on *steps and deliverables*, not deep architecture details.
- **Out of scope:** Detailed schemas, routing maps, RLS rules, and system flows (see System Design).

## 1. Project Strategy & Architecture

### Core Philosophy: "Module-First" Approach

As per the job description, the project should be delivered in milestones. We will treat each major feature set as an isolated module to ensure modularity and scalability.

### Tech Stack Validation

### UI/UX Strategy: "The Premium Hybrid"

To achieve a "Wow" factor while maintaining strict accessibility and RTL support, we will use a hybrid approach:

- **Base Layer (Functionality):** [Shadcn UI](https://ui.shadcn.com/)
  - Handles inputs, dialogs, dropdowns, and forms.
  - **Why:** Best-in-class accessibility and native RTL support.
- **Premium Layer (Aesthetics):** [Magic UI](https://magicui.design/) & [Aceternity UI](https://ui.aceternity.com/)
  - Handles hero sections, animated backgrounds, bento grids, and "Shiny" effects.
  - **Why:** Provides the "Senior Developer" look without custom CSS animation struggles.
- **Icons:** Lucide React (Standard) + [Heroicons](https://heroicons.com/) (if needed for specific visuals).
- **State Management:** React Context + Hooks (or Zustand if complexity grows).

## 2. Phased Implementation Roadmap

### Phase 1: Foundation & Infrastructure (The Setup)

- **Goal:** Robust scaffold allowing bilingual content and secure auth.
- **Tasks:**
  - Initialize Next.js project with TypeScript.
  - Setup Tailwind CSS with `tailwindcss-animate` and RTL support config.
  - Install and configure Shadcn UI components.
  - Configure `next-intl` for routing (`/en`, `/ar`) and translation management.
  - **Supabase Setup:** Initialize project, setup Auth (Email/Password, OAuth).

### Phase 2: User Identity & Profiles (The "Who")

- **Goal:** Allow Employers and Professionals to register and manage their distinct profiles.
- **Modules:**
  - **Auth Module:** Login/Register flows, Session management.
  - **Profile Module:**
    - **Professional:** Resume upload (single file), Skills tags, Experience timeline.
    - **Employer:** Company branding, Team members.
  - **Database:** `profiles` table with role-based access control (RBAC).

### Phase 3: Core Business Logic (The "Job")

- **Goal:** Enable job posting and discovery.
- **Modules:**
  - **Job Board Module:** CRUD for jobs, Search filters, Faceted search.
  - **AI-Assisted Matching (Compressed):** Use an Edge Function with OpenAI or Vercel AI SDK to generate tags/summary for jobs and profiles, then filter and lightly rank by tag overlap.
  - **Dashboard Module:** Employer view (Applicants), Professional view (Saved jobs, Applied).

### Phase 4: Interaction & Realtime (The "Engagement")

- **Goal:** Connect users instantly.
- **Modules:**
  - **Messaging Module (Compressed):** 1:1 text-only chat using Supabase Realtime.
  - **Notification Module:** In-app alerts for applications/messages (optional if time allows).
  - **File Management (Compressed):** Resume upload only, one file per profile.

### Phase 5: Deferred / Post-MVP

- Admin moderation UI (user/content management).
- Messaging attachments, reactions, typing indicators.
- Advanced ranking/scoring, profile parsing, or background matching jobs.

## 3. Technical Principles (Implementation-Focused)

### Delivery Standards

- **Milestone quality gate:** Each phase ships a working, demo-ready build.
- **Doc updates:** Update SRS and System Design at the end of each phase.

### Bilingual Implementation Checklist

1. Configure locales `['en', 'ar']` in `next-intl`.
2. Enforce locale prefix in routing (`/en`, `/ar`).
3. Apply `dir` on `<html>` by locale.
4. Use Tailwind logical properties (`ps-4`, `pe-4`, `start-0`, `end-0`).
5. Use locale-specific fonts for Arabic and English.

### Architecture Comparison: Modular vs. Layered

| Feature          | Type/Layer Architecture                     | Modular/Feature Architecture                      |
| :--------------- | :------------------------------------------ | :------------------------------------------------ |
| **Organization** | By technical type (`hooks/`, `components/`) | By business logic (`auth/`, `jobs/`)              |
| **Scalability**  | Harder as folders get overcrowded           | Easier (just add a new module folder)             |
| **Dependencies** | Everything can depend on everything         | strict boundaries (Module A can't touch Module B) |
| **Delivery**     | Hard to deliver "one feature" at a time     | Perfect for "Milestone/Module" delivery           |

### Deep Dive: Feature vs. Module Architecture

While similar, the **Module-First** approach we are choosing is stricter:

1.  **Strict Boundaries (The `index.ts` Gatekeeper):**
    - Every module has a single `index.ts`.
    - Internal files (like `auth-helper.ts`) are **hidden**.
    - Other parts of the app can _only_ import what is exported in `index.ts`.
    - _Result:_ If you need to refactor the internal logic of the "Job Matching" module, you can do it without breaking anything else, as long as the `index.ts` exports stay the same.

2.  **The "Mini-App" Concept:**
    - A module contains its own **Components**, **Hooks**, **API calls**, and **Types**.
    - It is "testable in isolation" because it doesn't rely on global hacks. You can render a "Job Listing" module in a test environment by just providing it with mock data, without needing to boot up the entire application.

3.  **Why this is "Client-Proof":**
    - Since each module is isolated, you can complete "Module 1" (Auth) and be 100% sure that starting "Module 2" (Messaging) won't accidentally break the Auth logic. This is critical for professional freelancer hand-offs.

### Proposed Folder Structure (Modular)

```text
src/
├── app/
│   ├── [locale]/          # Shared layouts and localized pages
│   │   ├── (auth)/        # Auth group (Login/Register)
│   │   ├── (dashboard)/   # Restricted user areas
│   │   └── jobs/          # Public job listings
├── components/
│   ├── ui/                # Shadcn primitives
│   ├── shared/            # Common UI (Navbar, Footer, LanguageSwitcher)
│   └── modules/           # Feature-specific components
│       ├── auth/
│       ├── jobs/
│       └── messaging/
├── lib/
│   ├── supabase/          # Client and Server Supabase instances
│   ├── utils/             # Helper functions (cn, formatters)
│   └── i18n/              # Messaging and locale configuration
│ └── types/                 # Database and App TypeScript definitions
```

### State Management & Performance Strategy

To avoid common beginner pitfalls (like "useEffect hell"), we will follow these rules:

1.  **Server State vs. UI State:**
    - **Server State:** Data from Supabase (Jobs, Profiles). We won't use `useState` for this. Instead, we'll use **Server Components** or **React Query**. This removes 90% of `useEffect` calls used for fetching.
    - **UI State:** Temporary things like "Is the modal open?". Use `useState` only for this.

2.  **Derived State (Calculated Values):**
    - Don't store calculated values in state.
    - _Bad:_ `const [total, setTotal] = useState(0); useEffect(() => setTotal(items.length), [items])`
    - _Good:_ `const total = items.length;` (Calculate directly during render).

3.  **URL as State:**
    - Use the URL (search params) for things like "Current Search Filter" or "Selected Locale". This makes the page shareable and removes the need for global state.

### Internationalization (i18n) Deep Dive

Internationalization (often shortened to **i18n** because there are 18 letters between 'i' and 'n') is the process of designing your app so it can be adapted to different languages and regions without engineering changes.

#### 1. The Landscape: Three Ways to do i18n

- **The Rookie Way (Hardcoding):** Creating two versions of every page (`Home_EN.tsx` and `Home_AR.tsx`).
  - _Problem:_ If you change a button color, you have to do it in two places. It's a maintenance nightmare.
- **The "Context" Way:** Using a global React state to switch text.
  - _Problem:_ Terrible for SEO. When Google crawls your site, it only sees one language.
- **The "Routing" Way (Our Choice):** Using the URL to define the language (`/en/jobs` vs `/ar/jobs`).
  - _Value:_ This is the professional standard. It's fast, SEO-friendly, and allows users to share links in their specific language.

#### 2. The "Common Sense" Architecture

We will use Three Pillars:

1.  **The Dictionary (Translations):** JSON files that act as your app's "vocabulary."
    - _Example:_ `jobs.title` = "Browse Jobs" (en) / "تصفح الوظائف" (ar).
2.  **The Formatter:** Logic that handles "Hard" things like dates, currencies, and numbers.
    - _Example:_ `1,000.00` (en) vs `١٬٠٠٠٫٠٠` (ar).
3.  **The Layout Wrapper:** A single piece of logic that says: "If the URL is `/ar`, flip the whole page to RTL (Right-to-Left)."

#### 3. Why this wins for you:

- **Client Satisfaction:** You deliver a "Global-Ready" app that can easily add a third language (like French) in 5 minutes just by adding one JSON file.
- **Search Engines:** Google will index your job board twice (once for Arabic users, once for English), doubling your potential traffic.

### Automated Tests

- **Auth Flow:** Verify login/signup redirects correctly.
- **i18n:** Ensure `/en` and `/ar` routes serve the correct direction (RTL/LTR).
- **RLS Policies:** Test that users cannot delete jobs they didn't post and cannot read others' resumes.

### Manual Verification

- Verify that UI components (Shadcn) flip correctly in Arabic mode.
- Test real-time messaging latency in Supabase Channels.
