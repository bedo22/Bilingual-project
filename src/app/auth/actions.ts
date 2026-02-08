'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from '@/i18n/routing';
import { cookies } from 'next/headers';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const locale = formData.get('locale') as string || 'en';

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect({ href: '/dashboard', locale });
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string; // We will treat this as EN name for MVP
  const role = formData.get('role') as 'employer' | 'professional';
  const locale = formData.get('locale') as string || 'en';

  const supabase = await createClient();

  // 1. Sign Up using Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name_en: fullName,
        full_name_ar: fullName, // Default to same name, user can update profile later
        role: role,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // 2. Redirect
  redirect({ href: '/dashboard', locale });
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: '/', locale: 'en' });
}
