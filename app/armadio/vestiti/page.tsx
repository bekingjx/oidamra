import { Suspense } from "react";
import ArmadioContent from "../armadio-content";

export default function VestitiPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-border/70 bg-[#000000a1] px-6 py-10 text-sm text-muted-foreground">
          Caricamento vestiti...
        </div>
      }
    >
      <ArmadioContent section="vestiti" />
    </Suspense>
  );
}
