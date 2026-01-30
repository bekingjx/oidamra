"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const FALLBACK_ACCENT = "#8cff77";

function isHexColor(value: string | null | undefined) {
  if (!value) return false;
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export default function ArmadioTheme({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accent, setAccent] = useState(FALLBACK_ACCENT);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        const metadata = data?.user?.user_metadata ?? {};
        if (isHexColor(metadata.spring_veil_accent)) {
          setAccent(metadata.spring_veil_accent);
        }
      })
      .catch(() => {
        // Keep fallback accent on errors.
      });
  }, []);

  return (
    <div
      className="spring-veil min-h-screen"
      style={{ ["--spring-veil-accent" as any]: accent }}
    >
      {children}
    </div>
  );
}
