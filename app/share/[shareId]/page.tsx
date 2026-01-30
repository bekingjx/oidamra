import { Suspense } from "react";
import ShareContent from "./share-content";

export default function ShareOutfitPage({
  params,
}: {
  params: { shareId: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
          <div className="rounded-3xl border border-border/70 bg-[#000000a1] px-6 py-10 text-sm text-muted-foreground">
            Caricamento outfit condiviso...
          </div>
        </div>
      }
    >
      <ShareContent shareId={params.shareId} />
    </Suspense>
  );
}
