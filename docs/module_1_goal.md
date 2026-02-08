# Module 1: Authentication & Profile Management - Goal Document

## 🎯 Primary Goal

**"A user can register, choose their role (Employer or Professional), complete their bilingual profile, and access a personalized dashboard—all with secure authentication and proper RTL/LTR support."**

## Success Criteria

### 1. Authentication Works

- ✅ User can sign up with email/password
- ✅ User can log in and log out
- ✅ Session persists across page refreshes
- ✅ Protected routes redirect unauthenticated users to login

### 2. Profile System Works

- ✅ After signup, user selects role (Employer or Professional)
- ✅ User fills out bilingual profile (name, bio in both English and Arabic)
- ✅ Profile data is stored correctly in Supabase (JSONB format)
- ✅ Profile displays correctly in both `/en` and `/ar` routes

### 3. Security Works

- ✅ Row Level Security (RLS) policies prevent users from editing other people's profiles
- ✅ Only authenticated users can access `/dashboard`
- ✅ Middleware refreshes sessions automatically

### 4. UI/UX Works

- ✅ Forms flip correctly in Arabic (RTL)
- ✅ Error messages appear in the correct language
- ✅ Loading states and validation work smoothly

## Authentication Strategy

### Phase 1 (Current Module): Email/Password Only

For this initial module, we will implement **email and password authentication only**.

**Why this is sufficient for Module 1:**

- ✅ Meets the core requirement of secure user authentication
- ✅ Simpler to implement and test in isolation
- ✅ Allows us to focus on the bilingual profile system
- ✅ Industry standard for B2B platforms (job boards, professional networks)

### Phase 2+ (Future Enhancement): OAuth Providers

We can add Google/LinkedIn OAuth later as a **separate enhancement module**.

**When to add OAuth:**

- If the client specifically requests it
- If user feedback indicates friction with email signup
- As a "premium feature" in a later milestone

**Best Practice Recommendation:**
For a **professional job matching platform**, email/password is actually preferred because:

- Employers want control over who accesses their company accounts
- Professional users expect traditional signup (like LinkedIn)
- Easier to implement role-based access control (Employer vs. Professional)

## The "Demo Moment"

At the end of this module, you should be able to:

1. Open `/en/register` → Create an account as "Professional"
2. Fill profile in English
3. Switch to `/ar/dashboard` → See your profile in Arabic with RTL layout
4. Log out and back in → Session persists correctly

## Deliverables

- [ ] Database schema (`profiles` table with RLS)
- [ ] Auth pages (Login, Register, Logout)
- [ ] Profile setup flow (role selection + bilingual form)
- [ ] Protected dashboard route
- [ ] Bilingual error handling and validation
