import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in · Husky Marketplace" };

export default function LoginPage() {
  // LoginForm reads ?next= from the URL, which Next.js requires to sit under <Suspense>.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
