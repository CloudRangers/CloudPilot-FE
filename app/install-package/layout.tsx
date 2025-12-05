"use client";

import { SseProvider } from "@/lib/context/SseContext";

export default function InstallPackageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SseProvider>{children}</SseProvider>;
}
