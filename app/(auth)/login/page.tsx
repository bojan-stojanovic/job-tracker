import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-neutral-600">
        We'll email you a link. No password needed.
      </p>
      <LoginForm />
    </main>
  );
}