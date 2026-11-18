"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

export default function ProfileAvatar({ src }: { src?: string | null }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (src && failedSource !== src)
    return (
      <img
        src={src}
        alt=""
        width={48}
        height={48}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
        onError={() => setFailedSource(src)}
      />
    );
  return (
    <svg
      viewBox="0 0 48 48"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="24" r="24" fill="#eeeef0" />
      <circle cx="24" cy="18" r="8" fill="#b8b8bf" />
      <path d="M8 43c0-9 7-15 16-15s16 6 16 15" fill="#b8b8bf" />
    </svg>
  );
}
