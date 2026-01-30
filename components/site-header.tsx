import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[conic-gradient(at_top,_#f3c07a,_#bf5a2c,_#f3c07a)] shadow-sm" />
          <div>
            <Link href="/" className="text-lg font-semibold tracking-tight">
              OIDAMRA
            </Link>
            <p className="text-xs text-muted-foreground">Guardaroba personale</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <AuthButton />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
