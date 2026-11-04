import { Suspense } from "react";
import UIAuth from "@/components/ui/marketplace/UIAuth";
export default function LoginPage() {
  return (
    <Suspense>
      <UIAuth mode="login" />
    </Suspense>
  );
}
