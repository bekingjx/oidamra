"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Backpack } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CATEGORIES,
  COLORS,
  SEASONS,
  SLOT_LABELS,
  WardrobeSlot,
  categoryToSlot,
} from "@/lib/wardrobe/constants";
import { Garment } from "@/lib/wardrobe/types";
import { getPublicImageUrl } from "@/lib/wardrobe/storage";

const DEFAULT_DAYS = 3;

type SuitcasePlannerProps = {
  garments: Garment[];
  initialDays?: number;
  initialName?: string | null;
};

export default function SuitcasePlanner({
  garments,
  initialDays,
  initialName,
}: SuitcasePlannerProps) {
  const [tripName, setTripName] = useState(initialName ?? "");
  const [days, setDays] = useState(
    Number.isFinite(initialDays) && (initialDays ?? 0) > 0
      ? Number(initialDays)
      : DEFAULT_DAYS
  );
  const [query, setQuery] = useState("");
  const [filterSlot, setFilterSlot] = useState<WardrobeSlot | "tutte">("tutte");
  const [filterColor, setFilterColor] = useState("tutti");
  const [filterSeason, setFilterSeason] = useState("tutte");
  const [filterCategory, setFilterCategory] = useState("tutte");
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<string, number>
  >({});
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const availableColors = useMemo(() => {
    const used = new Set(garments.map((garment) => garment.color));
    return COLORS.filter((item) => used.has(item.value));
  }, [garments]);

  const availableCategories = useMemo(() => {
    const used = new Set(garments.map((garment) => garment.category));
    return CATEGORIES.filter((item) => used.has(item.value));
  }, [garments]);
  const availableSlots = useMemo(() => {
    const used = new Set(garments.map((garment) => categoryToSlot(garment.category)));
    return Object.entries(SLOT_LABELS).filter(([slot]) =>
      used.has(slot as WardrobeSlot)
    );
  }, [garments]);
  const availableCategoriesBySlot = useMemo(() => {
    if (filterSlot === "tutte") return availableCategories;
    return availableCategories.filter((item) => item.slot === filterSlot);
  }, [availableCategories, filterSlot]);

  useEffect(() => {
    if (filterCategory === "tutte") return;
    if (filterSlot === "tutte") return;
    const stillValid = availableCategoriesBySlot.some(
      (item) => item.value === filterCategory
    );
    if (!stillValid) {
      setFilterCategory("tutte");
    }
  }, [availableCategoriesBySlot, filterCategory, filterSlot]);

  const filteredGarments = useMemo(() => {
    let list = garments;
    if (filterSlot !== "tutte") {
      list = list.filter(
        (garment) => categoryToSlot(garment.category) === filterSlot
      );
    }
    if (filterColor !== "tutti") {
      list = list.filter((garment) => garment.color === filterColor);
    }
    if (filterSeason !== "tutte") {
      list = list.filter((garment) =>
        (garment.seasons ?? []).includes(filterSeason)
      );
    }
    if (filterCategory !== "tutte") {
      list = list.filter((garment) => garment.category === filterCategory);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((garment) =>
        [garment.name, garment.category, garment.color]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [garments, filterCategory, filterColor, filterSeason, filterSlot, query]);

  const selectedGarments = useMemo(() => {
    return garments
      .filter((garment) => Boolean(selectedQuantities[garment.id]))
      .map((garment) => ({
        garment,
        quantity: selectedQuantities[garment.id] ?? 0,
      }));
  }, [garments, selectedQuantities]);

  const selectedCounts = useMemo(() => {
    const counts: Record<string, number> = {
      top: 0,
      bottom: 0,
      outer: 0,
      shoes: 0,
      accessory: 0,
      full: 0,
    };
    selectedGarments.forEach(({ garment, quantity }) => {
      const slot = categoryToSlot(garment.category);
      counts[slot] += Math.max(1, quantity);
    });
    return counts;
  }, [selectedGarments]);

  const toggleSelection = (id: string) => {
    setExportStatus(null);
    setSelectedQuantities((prev) => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const updateQuantity = (id: string, value: number) => {
    const safeValue = Math.max(1, Number.isFinite(value) ? value : 1);
    setExportStatus(null);
    setSelectedQuantities((prev) => ({ ...prev, [id]: safeValue }));
  };

  const clearSelection = () => {
    setSelectedQuantities({});
    setExportStatus(null);
  };

  const exportList = async () => {
    const safeDays = Math.max(1, Number(days) || DEFAULT_DAYS);
    const lines: string[] = [];
    if (tripName) {
      lines.push(`Valigia: ${tripName}`);
    } else {
      lines.push("Valigia");
    }
    lines.push(`Durata: ${safeDays} giorni`);
    lines.push("");
    lines.push("Capi selezionati:");
    if (selectedGarments.length === 0) {
      lines.push("- Nessun capo selezionato");
    } else {
      selectedGarments.forEach(({ garment, quantity }) => {
        const label = garment.name ?? garment.category ?? "Capo";
        const details = [garment.category, garment.color].filter(Boolean).join(" - ");
        lines.push(`- ${label} (${details}) x${quantity}`);
      });
    }

    const text = lines.join("\n");
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      const slug = tripName ? tripName.trim().replace(/\s+/g, "-") : "valigia";
      link.href = URL.createObjectURL(blob);
      link.download = `${slug}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
      setExportStatus("Lista esportata.");
    } catch {
      setExportStatus("Lista pronta.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-border/70 bg-[#000000a1]">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-[#000000a1]">
              <Backpack className="h-5 w-5 text-foreground" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-display text-2xl text-foreground">
                Modalita valigia
              </h1>
              <p className="text-sm text-muted-foreground">
                Seleziona i capi e prepara la lista per il viaggio.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/armadio/vestiti">Torna all'armadio</Link>
          </Button>
        </CardContent>
      </Card>
      <Card className="border-border/70 bg-[#000000a1]">
        <CardHeader>
          <CardTitle className="text-lg">Dettagli viaggio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="tripName">Nome viaggio</Label>
            <Input
              id="tripName"
              value={tripName}
              onChange={(event) => setTripName(event.target.value)}
              placeholder="Es. Weekend a Roma"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tripDays">Giorni</Label>
            <Input
              id="tripDays"
              type="number"
              min={1}
              value={days}
              onChange={(event) => setDays(Number(event.target.value) || 1)}
            />
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground">
              {tripName ? `${tripName} - ` : ""}Checklist pronta per impacchettare.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-6">
          <Card className="border-border/70 bg-[#000000a1]">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">La tua valigia</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={exportList}>
                  Esporta lista
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Svuota
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {selectedGarments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nessun capo selezionato. Inizia dalla lista a destra.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border/60 px-3 py-1">
                      Top: {selectedCounts.top}
                    </span>
                    <span className="rounded-full border border-border/60 px-3 py-1">
                      Bottom: {selectedCounts.bottom}
                    </span>
                    <span className="rounded-full border border-border/60 px-3 py-1">
                      Capospalla: {selectedCounts.outer}
                    </span>
                    <span className="rounded-full border border-border/60 px-3 py-1">
                      Scarpe: {selectedCounts.shoes}
                    </span>
                    <span className="rounded-full border border-border/60 px-3 py-1">
                      Accessori: {selectedCounts.accessory}
                    </span>
                  </div>
                  {exportStatus && (
                    <p className="text-xs text-muted-foreground">{exportStatus}</p>
                  )}
                  <div className="grid gap-2">
                    {selectedGarments.map(({ garment, quantity }) => (
                      <div
                        key={garment.id}
                        className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-semibold text-foreground">
                            {garment.name ?? garment.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {garment.category} - {garment.color}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(event) =>
                              updateQuantity(
                                garment.id,
                                Number(event.target.value) || 1
                              )
                            }
                            className="h-9 w-16 text-center"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleSelection(garment.id)}
                          >
                            Rimuovi
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-[#000000a1]">
          <CardHeader>
            <CardTitle className="text-base">Scegli i capi</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1 sm:col-span-2">
                <Label htmlFor="query">Cerca</Label>
                <Input
                  id="query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nome, categoria o colore"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="filterColor">Colore</Label>
                <select
                  id="filterColor"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={filterColor}
                  onChange={(event) => setFilterColor(event.target.value)}
                >
                  <option value="tutti">Tutti i colori</option>
                  {availableColors.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="filterSlot">Parte</Label>
                <select
                  id="filterSlot"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={filterSlot}
                  onChange={(event) =>
                    setFilterSlot(event.target.value as WardrobeSlot | "tutte")
                  }
                >
                  <option value="tutte">Tutte le parti</option>
                  {availableSlots.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="filterSeason">Stagione</Label>
                <select
                  id="filterSeason"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={filterSeason}
                  onChange={(event) => setFilterSeason(event.target.value)}
                >
                  <option value="tutte">Tutte le stagioni</option>
                  {SEASONS.map((season) => (
                    <option key={season.value} value={season.value}>
                      {season.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <Label htmlFor="filterCategory">Categoria</Label>
                <select
                  id="filterCategory"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={filterCategory}
                  onChange={(event) => setFilterCategory(event.target.value)}
                >
                  <option value="tutte">Tutte le categorie</option>
                  {availableCategoriesBySlot.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredGarments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-[#000000a1] px-4 py-6 text-sm text-muted-foreground">
                Nessun capo trovato. Prova a cambiare i filtri.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredGarments.map((garment) => {
                  const photo = getPrimaryPhoto(garment);
                  const selected = Boolean(selectedQuantities[garment.id]);
                  const quantity = selectedQuantities[garment.id] ?? 1;
                  return (
                    <div
                      key={garment.id}
                      className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-[#000000a1] p-4"
                    >
                      <div className="relative overflow-hidden rounded-2xl bg-muted/30">
                        {photo ? (
                          <img
                            src={photo}
                            alt={garment.name ?? garment.category}
                            className="h-36 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
                            Nessuna foto
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-foreground">
                          {garment.name ?? garment.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {garment.category} - {garment.color}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selected && (
                          <Input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(event) =>
                              updateQuantity(
                                garment.id,
                                Number(event.target.value) || 1
                              )
                            }
                            className="h-9 w-16 text-center"
                          />
                        )}
                        <Button
                          size="sm"
                          variant={selected ? "secondary" : "ghost"}
                          onClick={() => toggleSelection(garment.id)}
                        >
                          {selected ? "Rimuovi" : "Aggiungi"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getPrimaryPhoto(garment: Garment) {
  const photos = garment.garment_photos ?? [];
  if (!photos.length) return "";
  const primary = photos.find((photo) => photo.is_primary) ?? photos[0];
  return getPublicImageUrl(primary.path);
}
