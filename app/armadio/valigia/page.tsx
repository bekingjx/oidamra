import { Suspense } from "react";
import ValigiaContent from "./valigia-content";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function ValigiaPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-border/70 bg-[#000000a1] px-6 py-10 text-sm text-muted-foreground">
          Caricamento valigia...
        </div>
      }
    >
      <ValigiaContent searchParams={searchParams} />
    </Suspense>
  );
}
