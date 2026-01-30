"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ArmadioGreetingProps = {
  name?: string | null;
};

export default function ArmadioGreeting({ name }: ArmadioGreetingProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const greeting = useMemo(() => {
    if (!now) return "Benvenuto";
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return "Buongiorno";
    if (hour >= 12 && hour < 17) return "Buon pomeriggio";
    if (hour >= 17 && hour < 22) return "Buonasera";
    return "Buona notte";
  }, [now]);

  const hour = now ? now.getHours() % 12 : 0;
  const minute = now ? now.getMinutes() : 0;
  const second = now ? now.getSeconds() : 0;
  const hourRotation = hour * 30 + minute * 0.5;
  const minuteRotation = minute * 6;
  const secondRotation = second * 6;

  return (
    <div className="flex flex-col gap-4 rounded-[32px] border border-border/70 bg-[#000000a1] p-6 shadow-[0_18px_40px_rgba(255,210,150,0.2)]">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Benvenuto
        </p>
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          {greeting}
          {name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Respira, scegli un capo, lascia che il look si componga con calma.
        </p>
        <div>
          <Button asChild size="sm" variant="outline">
            <Link href="/armadio/profilo">Modifica profilo</Link>
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-border/70 bg-[#000000a1]">
          <div
            className="absolute bottom-1/2 left-1/2 h-[28%] w-[3px] origin-bottom rounded-full bg-foreground"
            style={{ transform: `translateX(-50%) rotate(${hourRotation}deg)` }}
          />
          <div
            className="absolute bottom-1/2 left-1/2 h-[36%] w-[2px] origin-bottom rounded-full bg-foreground/80"
            style={{ transform: `translateX(-50%) rotate(${minuteRotation}deg)` }}
          />
          <div
            className="absolute bottom-1/2 left-1/2 h-[40%] w-[1px] origin-bottom rounded-full bg-primary"
            style={{ transform: `translateX(-50%) rotate(${secondRotation}deg)` }}
          />
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {now
              ? now.toLocaleTimeString("it-IT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--:--"}
          </p>
          <p className="text-xs text-muted-foreground">
            {now
              ? now.toLocaleDateString("it-IT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
