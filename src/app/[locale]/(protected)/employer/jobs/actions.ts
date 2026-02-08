"use server";

import { redirect } from "@/i18n/routing";
import {
  createJob,
  updateJob,
  deleteJob,
  toggleJobPublish,
} from "@/lib/jobs/actions";
import type { CreateJobInput, UpdateJobInput } from "@/lib/validators/jobs";

export async function createEmployerJob(input: CreateJobInput) {
  const result = await createJob(input);

  if (result.error) {
    return { error: result.error };
  }

  redirect({ href: "/employer/jobs", locale: input.locale });
}

export async function updateEmployerJob(input: UpdateJobInput) {
  const result = await updateJob(input);

  if (result.error) {
    return { error: result.error };
  }

  redirect({ href: "/employer/jobs", locale: input.locale });
}

export async function deleteEmployerJob(input: { jobId: string; locale: string }) {
  const result = await deleteJob(input);

  if (result.error) {
    return { error: result.error };
  }

  redirect({ href: "/employer/jobs", locale: input.locale });
}

export async function toggleEmployerJobPublish(input: {
  jobId: string;
  publish: boolean;
  locale: string;
}) {
  const result = await toggleJobPublish({
    jobId: input.jobId,
    publish: input.publish,
    locale: input.locale,
  });

  if (result.error) {
    return { error: result.error };
  }

  return { data: result.data };
}
