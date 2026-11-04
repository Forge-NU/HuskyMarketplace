import { Suspense } from "react";
import UIAuth from "@/components/ui/marketplace/UIAuth";
export default function SignupPage() {
  return (
    <Suspense>
      <UIAuth mode="signup" />
    </Suspense>
  );
}
