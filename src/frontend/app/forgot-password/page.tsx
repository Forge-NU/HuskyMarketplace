import { Suspense } from "react";
import UIAuth from "@/components/ui/marketplace/UIAuth";
export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <UIAuth mode="forgot" />
    </Suspense>
  );
}
