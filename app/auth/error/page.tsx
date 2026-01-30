import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm text-muted-foreground">
          Codice errore: {params.error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Si e verificato un errore non specificato.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="spring-veil flex min-h-svh w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-border/70 bg-[#000000a1] p-6 shadow-[0_20px_50px_rgba(255,200,130,0.25)]">
        <div className="flex flex-col gap-6">
          <Card className="border-border/60 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl">
                Ops, qualcosa e andato storto.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
