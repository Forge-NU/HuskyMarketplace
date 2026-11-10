import { Suspense } from "react";
import UIAuth from "@/components/ui/marketplace/UIAuth";
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <UIAuth mode="reset" />
    </Suspense>
  );
}
