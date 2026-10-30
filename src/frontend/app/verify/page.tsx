import { Suspense } from "react";
import UIAuth from "@/components/ui/marketplace/UIAuth";
export default function VerifyPage() {
  return (
    <Suspense>
      <UIAuth mode="verify" />
    </Suspense>
  );
}
