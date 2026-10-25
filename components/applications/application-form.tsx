"use client";

import { useActionState, type InputHTMLAttributes } from "react";
import type { FormState } from "@/lib/actions/activity";
import type { NewApplication } from "@/lib/validation/application";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const initialState: FormState = { ok: false };
const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm";

function Field({
  label,
  name,
  errors,
  defaultValue,
  ...rest
}: {
  label: string;
  name: string;
  errors?: string[];
  defaultValue?: string | number | null;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue">) {
  const id = `app-${name}`;
  const errorId = `${id}-error`;
  const hasError = !!errors?.length;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue ?? undefined}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className={inputClass}
        {...rest}
      />
      {hasError && (
        <p id={errorId} className="mt-1 text-xs text-red-700">
          {errors[0]}
        </p>
      )}
    </div>
  );
}

export function ApplicationForm({
  action,
  defaultValues,
  defaultAppliedAt,
  submitLabel,
}: {
  action: Action;
  defaultValues?: Partial<NewApplication>;
  defaultAppliedAt?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  const d = defaultValues ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Company"
        name="company"
        required
        defaultValue={d.company}
        errors={errors.company}
      />
      <Field
        label="Role title"
        name="roleTitle"
        required
        defaultValue={d.roleTitle}
        errors={errors.roleTitle}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Salary min"
          name="salaryMin"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={d.salaryMin}
          errors={errors.salaryMin}
        />
        <Field
          label="Salary max"
          name="salaryMax"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={d.salaryMax}
          errors={errors.salaryMax}
        />
        <Field
          label="Currency"
          name="currency"
          maxLength={3}
          defaultValue={d.currency ?? "EUR"}
          errors={errors.currency}
        />
      </div>

      <Field
        label="Job posting URL"
        name="jobUrl"
        type="url"
        placeholder="https://"
        defaultValue={d.jobUrl}
        errors={errors.jobUrl}
      />
      <Field
        label="Date applied"
        name="appliedAt"
        type="date"
        required
        defaultValue={d.appliedAt ?? defaultAppliedAt}
        errors={errors.appliedAt}
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>

      {state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}