import { Suspense } from "react";
import ProfiloContent from "./profilo-content";

export default function ProfiloPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-border/70 bg-[#000000a1] px-6 py-10 text-sm text-muted-foreground">
          Caricamento profilo...
        </div>
      }
    >
      <ProfiloContent />
    </Suspense>
  );
}
