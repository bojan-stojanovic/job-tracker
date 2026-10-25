"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  addContact,
  addInteraction,
  type FormState,
} from "@/lib/actions/activity";
import { INTERACTION_KINDS } from "@/lib/validation/interaction";

const initialState: FormState = { ok: false };
const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm";

function TextField({
  id,
  label,
  name,
  type = "text",
  required,
  errors,
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  errors?: string[];
}) {
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
        type={type}
        required={required}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className={inputClass}
      />
      {hasError && (
        <p id={errorId} className="mt-1 text-xs text-red-700">
          {errors[0]}
        </p>
      )}
    </div>
  );
}

function FormMessage({ state }: { state: FormState }) {
  if (state.message) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {state.message}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" className="text-sm text-green-700">
        Saved.
      </p>
    );
  }
  return null;
}

export function AddContactForm({ applicationId }: { applicationId: string }) {
  const [state, formAction, pending] = useActionState(addContact, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="applicationId" value={applicationId} />
      <TextField id="contact-name" name="name" label="Name" required errors={state.fieldErrors?.name} />
      <TextField id="contact-email" name="email" label="Email" type="email" errors={state.fieldErrors?.email} />
      <TextField id="contact-title" name="title" label="Title" errors={state.fieldErrors?.title} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add contact"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}

export function AddInteractionForm({ applicationId }: { applicationId: string }) {
  const [state, formAction, pending] = useActionState(addInteraction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-lg bg-neutral-50 p-4">
      <input type="hidden" name="applicationId" value={applicationId} />

      <div>
        <label htmlFor="interaction-kind" className="block text-sm font-medium">
          Type
        </label>
        <select id="interaction-kind" name="kind" defaultValue="note" className={inputClass}>
          {INTERACTION_KINDS.map((k) => (
            <option key={k} value={k}>
              {k[0].toUpperCase() + k.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <TextField
        id="interaction-date"
        name="occurredAt"
        label="Date and time"
        type="datetime-local"
        required
        errors={state.fieldErrors?.occurredAt}
      />

      <div>
        <label htmlFor="interaction-summary" className="block text-sm font-medium">
          Summary
        </label>
        <textarea
          id="interaction-summary"
          name="summary"
          rows={3}
          required
          aria-invalid={!!state.fieldErrors?.summary?.length}
          className={inputClass}
        />
        {state.fieldErrors?.summary?.[0] && (
          <p className="mt-1 text-xs text-red-700">{state.fieldErrors.summary[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add to timeline"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}