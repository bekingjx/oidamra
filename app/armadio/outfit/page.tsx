import { Suspense } from "react";
import ArmadioContent from "../armadio-content";

export default function OutfitPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-border/70 bg-[#000000a1] px-6 py-10 text-sm text-muted-foreground">
          Caricamento outfit...
        </div>
      }
    >
      <ArmadioContent section="outfit" />
    </Suspense>
  );
}
