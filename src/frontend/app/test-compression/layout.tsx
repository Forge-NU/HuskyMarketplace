import type { ReactNode } from "react";
import { notFound } from "next/navigation";

export default function CompressionTestLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
