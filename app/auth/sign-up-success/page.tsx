import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="spring-veil flex min-h-svh w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-border/70 bg-[#000000a1] p-6 shadow-[0_20px_50px_rgba(255,200,130,0.25)]">
        <div className="flex flex-col gap-6">
          <Card className="border-border/60 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl">Registrazione completata!</CardTitle>
              <CardDescription>Controlla la tua email per confermare</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                La registrazione e andata a buon fine. Conferma l'account prima di
                accedere.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
