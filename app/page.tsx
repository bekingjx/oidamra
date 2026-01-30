import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="spring-veil min-h-screen">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16">
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              OIDAMRA
            </span>
            <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Il tuo guardaroba diventa un respiro leggero.
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Organizza i capi, crea outfit con calma e trova equilibrio nei colori.
              Un luogo digitale dove il guardaroba si muove come un vento gentile.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">Inizia la tua collezione</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">Accedi</Link>
              </Button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[36px] border border-border/70 bg-[#000000a1] p-8 shadow-[0_24px_60px_rgba(255,190,120,0.25)]">
            <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,_#ffe4b5,_transparent_70%)]" />
            <div className="absolute -bottom-10 right-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,_#ffd2a0,_transparent_70%)]" />
            <div className="relative flex flex-col gap-6">
              <p className="text-sm font-semibold text-muted-foreground">
                Una routine dolce per il tuo stile
              </p>
              <div className="grid gap-4">
                {[
                  "Aggiungi i capi e le foto migliori",
                  "Scegli un outfit in pochi tocchi",
                  "Salva le tue collezioni preferite",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-dashed border-border/70 bg-[#000000a1] px-4 py-4 text-sm text-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-secondary/70 px-4 py-3 text-sm text-muted-foreground">
                Ritrova il tuo ritmo, un outfit alla volta.
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Armonia visiva",
              desc: "Colori e categorie sempre ordinati, con la leggerezza di una giornata di primavera.",
            },
            {
              title: "Outfit senza sforzo",
              desc: "Selezioni rapide, canvas morbido e suggerimenti che non disturbano.",
            },
            {
              title: "Collezioni serene",
              desc: "Salva, rivedi, aggiorna i tuoi look preferiti quando vuoi.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-[28px] border border-border/70 bg-[#000000a1] p-6 shadow-[0_18px_40px_rgba(255,210,150,0.2)]"
            >
              <h3 className="font-display text-xl text-foreground">
                {card.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">{card.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
