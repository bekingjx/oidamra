"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Layers, Shirt, Sparkles } from "lucide-react";
import {
  CATEGORIES,
  COLORS,
  FORMALITIES,
  NO_MATCH_PAIRS,
  OCCASIONS,
  SEASONS,
  SLOT_LABELS,
  WardrobeSlot,
  categoryToSlot,
} from "@/lib/wardrobe/constants";
import { Garment, Outfit } from "@/lib/wardrobe/types";
import { getPublicImageUrl, STORAGE_BUCKET } from "@/lib/wardrobe/storage";
import ArmadioGreeting from "@/components/wardrobe/armadio-greeting";

const CANVAS_GRID = { cols: 3, rows: 5 };
const CANVAS_GRID_GAP = 8;
const CANVAS_GRID_PADDING = 12;
const DESKTOP_ITEM_SIZE = 80;

const DEFAULT_SLOTS: Record<WardrobeSlot, string | null> = {
  top: null,
  bottom: null,
  outer: null,
  shoes: null,
  accessory: null,
  full: null,
};

const CANVAS_SLOTS: { slot: WardrobeSlot; className: string }[] = [
  { slot: "outer", className: "row-start-1 col-start-1" },
  { slot: "top", className: "row-start-2 col-start-2" },
  { slot: "accessory", className: "row-start-1 col-start-3" },
  { slot: "full", className: "row-start-3 col-start-2" },
  { slot: "bottom", className: "row-start-4 col-start-2" },
  { slot: "shoes", className: "row-start-5 col-start-2" },
];

const CANVAS_SLOT_CELLS: Record<WardrobeSlot, { row: number; col: number }> = {
  outer: { row: 0, col: 0 },
  top: { row: 1, col: 1 },
  accessory: { row: 0, col: 2 },
  full: { row: 2, col: 1 },
  bottom: { row: 3, col: 1 },
  shoes: { row: 4, col: 1 },
};

type FreeItem = {
  id: string;
  x: number;
  y: number;
  layer: number;
};

type OutfitState = {
  slots: Record<WardrobeSlot, string | null>;
  free: FreeItem[];
};

type WardrobeDashboardProps = {
  userId: string;
  userName?: string | null;
  mantra: { text: string; author?: string | null; source?: string | null };
  section: "vestiti" | "outfit";
  initialGarments: Garment[];
  initialOutfits: Outfit[];
};

export default function WardrobeDashboard({
  userId,
  userName,
  mantra,
  section,
  initialGarments,
  initialOutfits,
}: WardrobeDashboardProps) {
  const supabase = createClient();
  const router = useRouter();
  const [garments, setGarments] = useState<Garment[]>(initialGarments);
  const [outfits, setOutfits] = useState<Outfit[]>(initialOutfits);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]?.value ?? "");
  const [color, setColor] = useState(COLORS[0]?.value ?? "");
  const [seasons, setSeasons] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [showExtras, setShowExtras] = useState(false);
  const [brand, setBrand] = useState("");
  const [fabric, setFabric] = useState("");
  const [size, setSize] = useState("");
  const [formality, setFormality] = useState("");
  const [occasions, setOccasions] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [outfitName, setOutfitName] = useState("");
  const [outfitSaving, setOutfitSaving] = useState(false);
  const [slotSelection, setSlotSelection] = useState<WardrobeSlot | null>(null);
  const [canvasSelection, setCanvasSelection] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [canvasSlot, setCanvasSlot] = useState<WardrobeSlot | null>(null);
  const [filterColor, setFilterColor] = useState("tutti");
  const [filterSeason, setFilterSeason] = useState("tutte");
  const [filterQuery, setFilterQuery] = useState("");
  const [listColor, setListColor] = useState("tutti");
  const [listSeason, setListSeason] = useState("tutte");
  const [listQuery, setListQuery] = useState("");
  const [deletingGarmentId, setDeletingGarmentId] = useState<string | null>(null);
  const [deletingOutfitId, setDeletingOutfitId] = useState<string | null>(null);
  const [sharingOutfitId, setSharingOutfitId] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [confirmState, setConfirmState] = useState<
    | { type: "garment"; garment: Garment }
    | { type: "outfit"; outfit: Outfit }
    | null
  >(null);
  const [outfitState, setOutfitState] = useState<OutfitState>({
    slots: DEFAULT_SLOTS,
    free: [],
  });
  const [cellSize, setCellSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(
    null
  );
  const [forecastDays, setForecastDays] = useState<
    { date: string; min: number; max: number; precip: number }[]
  >([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [tripName, setTripName] = useState("");
  const [tripDays, setTripDays] = useState("3");

  useEffect(() => {
    if (!canvasRef.current) return;
    const element = canvasRef.current;
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const innerWidth = rect.width - CANVAS_GRID_PADDING * 2;
      const innerHeight = rect.height - CANVAS_GRID_PADDING * 2;
      const cellWidth =
        (innerWidth - CANVAS_GRID_GAP * (CANVAS_GRID.cols - 1)) /
        CANVAS_GRID.cols;
      const cellHeight =
        (innerHeight - CANVAS_GRID_GAP * (CANVAS_GRID.rows - 1)) /
        CANVAS_GRID.rows;
      if (cellWidth > 0 && cellHeight > 0) {
        setCellSize({ width: cellWidth, height: cellHeight });
      }
    };
    updateSize();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [section]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);
  }, []);


  const garmentsById = useMemo(() => {
    return garments.reduce<Record<string, Garment>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [garments]);

  const garmentsBySlot = useMemo(() => {
    return garments.reduce<Record<WardrobeSlot, Garment[]>>(
      (acc, item) => {
        const slot = categoryToSlot(item.category);
        acc[slot] = [...acc[slot], item];
        return acc;
      },
      {
        top: [],
        bottom: [],
        outer: [],
        shoes: [],
        accessory: [],
        full: [],
      }
    );
  }, [garments]);

  const outfitItems = useMemo(() => {
    return Object.entries(outfitState.slots)
      .filter(([, id]) => Boolean(id))
      .map(([slot, id]) => ({ slot, id: id as string }))
      .concat(outfitState.free.map((item) => ({ slot: "free", id: item.id })));
  }, [outfitState]);

  const activeSelectionSlot = slotSelection ?? canvasSlot;
  const selectableGarments = activeSelectionSlot
    ? garmentsBySlot[activeSelectionSlot]
    : [];
  const filteredGarments = useMemo(() => {
    let list = selectableGarments;
    if (filterColor !== "tutti") {
      list = list.filter((garment) => garment.color === filterColor);
    }
    if (filterSeason !== "tutte") {
      list = list.filter((garment) =>
        (garment.seasons ?? []).includes(filterSeason)
      );
    }
    if (filterQuery.trim()) {
      const query = filterQuery.trim().toLowerCase();
      list = list.filter((garment) =>
        [garment.name, garment.category, garment.color]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }
    return list;
  }, [selectableGarments, filterColor, filterSeason, filterQuery]);

  const listFilteredGarments = useMemo(() => {
    let list = garments;
    if (listColor !== "tutti") {
      list = list.filter((garment) => garment.color === listColor);
    }
    if (listSeason !== "tutte") {
      list = list.filter((garment) =>
        (garment.seasons ?? []).includes(listSeason)
      );
    }
    if (listQuery.trim()) {
      const query = listQuery.trim().toLowerCase();
      list = list.filter((garment) =>
        [garment.name, garment.category, garment.color]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }
    return list;
  }, [garments, listColor, listSeason, listQuery]);
  const selectionOpen = Boolean(slotSelection || canvasSelection);
  const availableListColors = useMemo(() => {
    const used = new Set(garments.map((garment) => garment.color).filter(Boolean));
    return COLORS.filter((item) => used.has(item.value));
  }, [garments]);
  const availableSelectionColors = useMemo(() => {
    const used = new Set(
      selectableGarments.map((garment) => garment.color).filter(Boolean)
    );
    return COLORS.filter((item) => used.has(item.value));
  }, [selectableGarments]);
  const selectedForecast = useMemo(() => {
    if (!forecastDays.length) return null;
    return (
      forecastDays.find((day) => day.date === selectedDate) ?? forecastDays[0]
    );
  }, [forecastDays, selectedDate]);
  const weatherSuggestion = useMemo(() => {
    if (!selectedForecast) return null;
    if (selectedForecast.precip >= 50) {
      return "Pioggia in arrivo: aggiungi un capospalla impermeabile.";
    }
    if (selectedForecast.min <= 8) {
      return "Temperature basse: scegli strati caldi e tessuti morbidi.";
    }
    if (selectedForecast.max >= 26) {
      return "Giornata calda: punta su tessuti leggeri e colori chiari.";
    }
    return "Clima mite: bilancia strati e accessori leggeri.";
  }, [selectedForecast]);

  const noGoLabels = NO_MATCH_PAIRS.map(
    ([first, second]) => `No-go: ${first} + ${second}`
  );
  const confirmTitle = confirmState
    ? confirmState.type === "garment"
      ? `Eliminare il capo "${
          confirmState.garment.name ?? confirmState.garment.category
        }"?`
      : `Eliminare l'outfit "${confirmState.outfit.name}"?`
    : "";
  const confirmBusy = confirmState
    ? confirmState.type === "garment"
      ? deletingGarmentId === confirmState.garment.id
      : deletingOutfitId === confirmState.outfit.id
    : false;
  const hasFilters =
    filterColor !== "tutti" || filterSeason !== "tutte" || Boolean(filterQuery);

  const handleOccasionToggle = (value: string) => {
    setOccasions((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const fetchForecast = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setForecastError("Posizione non disponibile sul dispositivo.");
      return;
    }
    setForecastLoading(true);
    setForecastError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Errore meteo");
          }
          const data = (await response.json()) as {
            daily?: {
              time?: string[];
              temperature_2m_max?: number[];
              temperature_2m_min?: number[];
              precipitation_probability_max?: number[];
            };
          };
          const days =
            data.daily?.time?.map((date, index) => ({
              date,
              max: data.daily?.temperature_2m_max?.[index] ?? 0,
              min: data.daily?.temperature_2m_min?.[index] ?? 0,
              precip: data.daily?.precipitation_probability_max?.[index] ?? 0,
            })) ?? [];
          setForecastDays(days);
          if (!selectedDate && days[0]?.date) {
            setSelectedDate(days[0].date);
          }
        } catch (err) {
          setForecastError("Non riesco a recuperare il meteo.");
        } finally {
          setForecastLoading(false);
        }
      },
      () => {
        setForecastLoading(false);
        setForecastError("Attiva la posizione per vedere il meteo.");
      }
    );
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const getItemSize = () => {
    if (cellSize) return cellSize;
    return { width: DESKTOP_ITEM_SIZE, height: DESKTOP_ITEM_SIZE };
  };

  const getGridMetrics = (rect: DOMRect) => {
    const innerWidth = rect.width - CANVAS_GRID_PADDING * 2;
    const innerHeight = rect.height - CANVAS_GRID_PADDING * 2;
    const cellWidth =
      (innerWidth - CANVAS_GRID_GAP * (CANVAS_GRID.cols - 1)) /
      CANVAS_GRID.cols;
    const cellHeight =
      (innerHeight - CANVAS_GRID_GAP * (CANVAS_GRID.rows - 1)) /
      CANVAS_GRID.rows;
    return {
      padding: CANVAS_GRID_PADDING,
      gap: CANVAS_GRID_GAP,
      cellWidth,
      cellHeight,
    };
  };

  const getCellFromPosition = (
    x: number,
    y: number,
    rect: DOMRect,
    size: { width: number; height: number }
  ): { row: number; col: number } => {
    const { padding, gap, cellWidth, cellHeight } = getGridMetrics(rect);
    const col = clamp(
      Math.floor((x + size.width / 2 - padding) / (cellWidth + gap)),
      0,
      CANVAS_GRID.cols - 1
    );
    const row = clamp(
      Math.floor((y + size.height / 2 - padding) / (cellHeight + gap)),
      0,
      CANVAS_GRID.rows - 1
    );
    return { row, col };
  };

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const getOccupiedCells = (
    rect: DOMRect,
    size: { width: number; height: number },
    ignoreId?: string
  ) => {
    const occupied = new Set<string>();
    Object.values(CANVAS_SLOT_CELLS).forEach((cell) => {
      occupied.add(getCellKey(cell.row, cell.col));
    });
    outfitState.free.forEach((item) => {
      if (item.id === ignoreId) return;
      const cell = getCellFromPosition(item.x, item.y, rect, size);
      occupied.add(getCellKey(cell.row, cell.col));
    });
    return occupied;
  };

  const findAvailableCell = (
    start: { row: number; col: number },
    occupied: Set<string>
  ) => {
    const totalCells = CANVAS_GRID.cols * CANVAS_GRID.rows;
    const startIndex = start.row * CANVAS_GRID.cols + start.col;
    for (let offset = 0; offset < totalCells; offset += 1) {
      const index = (startIndex + offset) % totalCells;
      const row = Math.floor(index / CANVAS_GRID.cols);
      const col = index % CANVAS_GRID.cols;
      if (!occupied.has(getCellKey(row, col))) {
        return { row, col };
      }
    }
    return start;
  };

  const getSnappedPosition = (
    x: number,
    y: number,
    rect: DOMRect,
    size: { width: number; height: number },
    ignoreId?: string
  ) => {
    const { padding, gap, cellWidth, cellHeight } = getGridMetrics(rect);
    const preferred = getCellFromPosition(x, y, rect, size);
    const occupied = getOccupiedCells(rect, size, ignoreId);
    const chosen = findAvailableCell(preferred, occupied);
    const snappedX =
      padding + chosen.col * (cellWidth + gap) + (cellWidth - size.width) / 2;
    const snappedY =
      padding + chosen.row * (cellHeight + gap) + (cellHeight - size.height) / 2;

    return {
      x: clamp(snappedX, 0, rect.width - size.width),
      y: clamp(snappedY, 0, rect.height - size.height),
    };
  };

  const handleSeasonToggle = (value: string) => {
    setSeasons((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleOpenSuitcase = () => {
    const days = Math.max(1, Number.parseInt(tripDays, 10) || 1);
    const params = new URLSearchParams();
    params.set("days", String(days));
    if (tripName.trim()) {
      params.set("name", tripName.trim());
    }
    router.push(`/armadio/valigia?${params.toString()}`);
  };

  const handleShareOutfit = async (outfit: Outfit) => {
    const baseUrl =
      origin || (typeof window !== "undefined" ? window.location.origin : "");
    if (!baseUrl) return;
    setSharingOutfitId(outfit.id);
    setShareError(null);
    try {
      let shareId = outfit.share_id;
      if (!shareId) {
        shareId = crypto.randomUUID();
      }
      const { data, error: shareError } = await supabase
        .from("outfits")
        .update({ is_public: true, share_id: shareId })
        .eq("id", outfit.id)
        .select("id,is_public,share_id")
        .single();

      if (shareError || !data) {
        throw new Error(shareError?.message ?? "Errore condivisione.");
      }

      const shareUrl = `${baseUrl}/share/${data.share_id}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setStatus("Link pubblico copiato negli appunti.");
      } else {
        setStatus("Link pubblico pronto.");
      }

      setOutfits((prev) =>
        prev.map((item) =>
          item.id === outfit.id
            ? { ...item, is_public: data.is_public, share_id: data.share_id }
            : item
        )
      );
    } catch (err) {
      setShareError("Non riesco a generare il link pubblico.");
    } finally {
      setSharingOutfitId(null);
    }
  };

  const copyShareLink = async (outfit: Outfit) => {
    const baseUrl =
      origin || (typeof window !== "undefined" ? window.location.origin : "");
    if (!baseUrl || !outfit.share_id) return;
    const shareUrl = `${baseUrl}/share/${outfit.share_id}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setStatus("Link pubblico copiato negli appunti.");
    } catch {
      setStatus("Link pubblico pronto.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    setFiles(selected);
  };

  const handleAddGarment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!category || !color) {
      setStatus(null);
      setError("Seleziona categoria e colore.");
      return;
    }
    if (files.length === 0) {
      setStatus(null);
      setError("Aggiungi almeno una foto.");
      return;
    }

    setSaving(true);
    setError(null);
    setStatus(null);

    const { data: garment, error: insertError } = await supabase
      .from("garments")
      .insert({
        user_id: userId,
        name: name.trim() || null,
        category,
        color,
        seasons: seasons.length ? seasons : null,
        brand: brand.trim() || null,
        fabric: fabric.trim() || null,
        size: size.trim() || null,
        formality: formality || null,
        occasions: occasions.length ? occasions : null,
      })
      .select("id,name,category,color,seasons,brand,fabric,size,formality,occasions")
      .single();

    if (insertError || !garment) {
      setSaving(false);
      setError(insertError?.message ?? "Errore durante il salvataggio.");
      return;
    }

    const photoRows: {
      garment_id: string;
      path: string;
      is_primary: boolean;
      sort_order: number;
    }[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const extension = file.name.split(".").pop() || "jpg";
      const filePath = `${userId}/${garment.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setSaving(false);
        setError("Errore upload foto: " + uploadError.message);
        return;
      }

      photoRows.push({
        garment_id: garment.id,
        path: filePath,
        is_primary: index === 0,
        sort_order: index,
      });
    }

    const { error: photoError } = await supabase
      .from("garment_photos")
      .insert(photoRows);

    if (photoError) {
      setSaving(false);
      setError("Errore salvataggio foto: " + photoError.message);
      return;
    }

    const enriched: Garment = {
      ...garment,
      garment_photos: photoRows.map((row, index) => ({
        id: `${garment.id}-${index}`,
        path: row.path,
        is_primary: row.is_primary,
        sort_order: row.sort_order,
      })),
    };

    setGarments((prev) => [enriched, ...prev]);
    setName("");
    setSeasons([]);
    setFiles([]);
    setBrand("");
    setFabric("");
    setSize("");
    setFormality("");
    setOccasions([]);
    setShowExtras(false);
    setStatus("Capo aggiunto con successo.");
    setSaving(false);
  };

  const handleDropOnSlot = (slot: WardrobeSlot, event: React.DragEvent) => {
    event.preventDefault();
    const garmentId =
      event.dataTransfer.getData("application/garment-id") ||
      event.dataTransfer.getData("text/plain");
    if (!garmentId || !garmentsById[garmentId]) return;

    clearPlacement(garmentId);
    setSlotSelection(null);
    setCanvasSelection(null);
    setCanvasSlot(null);

    setOutfitState((prev) => ({
      ...prev,
      slots: { ...prev.slots, [slot]: garmentId },
    }));
  };

  const handleDropOnCanvas = (event: React.DragEvent) => {
    event.preventDefault();
    if (!canvasRef.current) return;
    const garmentId =
      event.dataTransfer.getData("application/garment-id") ||
      event.dataTransfer.getData("text/plain");
    if (!garmentId || !garmentsById[garmentId]) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const size = getItemSize();
    const x = event.clientX - rect.left - size.width / 2;
    const y = event.clientY - rect.top - size.height / 2;
    const snapped = getSnappedPosition(x, y, rect, size, garmentId);

    clearPlacement(garmentId);
    setSlotSelection(null);
    setCanvasSelection(null);
    setCanvasSlot(null);

    setOutfitState((prev) => ({
      ...prev,
      free: [
        ...prev.free,
        {
          id: garmentId,
          x: snapped.x,
          y: snapped.y,
          layer: prev.free.length,
        },
      ],
    }));
  };

  const handleSlotClick = (slot: WardrobeSlot) => {
    setSlotSelection(slot);
    setCanvasSelection(null);
    setCanvasSlot(null);
    setFilterColor("tutti");
    setFilterSeason("tutte");
    setFilterQuery("");
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    if (event.target !== event.currentTarget) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const size = getItemSize();
    const x = event.clientX - rect.left - size.width / 2;
    const y = event.clientY - rect.top - size.height / 2;
    const snapped = getSnappedPosition(x, y, rect, size);

    setCanvasSelection({
      x: snapped.x,
      y: snapped.y,
    });
    setCanvasSlot(null);
    setSlotSelection(null);
    setFilterColor("tutti");
    setFilterSeason("tutte");
    setFilterQuery("");
  };

  const handleSelectGarment = (garmentId: string) => {
    if (slotSelection) {
      clearPlacement(garmentId);
      setOutfitState((prev) => ({
        ...prev,
        slots: { ...prev.slots, [slotSelection]: garmentId },
      }));
      setSlotSelection(null);
      setCanvasSelection(null);
      setCanvasSlot(null);
      return;
    }

    if (canvasSelection && canvasSlot) {
      addToCanvas(garmentId, canvasSelection);
      setCanvasSelection(null);
      setCanvasSlot(null);
    }
  };

  const addToCanvas = (garmentId: string, position: { x: number; y: number }) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const size = getItemSize();
    const snapped = getSnappedPosition(position.x, position.y, rect, size, garmentId);

    clearPlacement(garmentId);

    setOutfitState((prev) => ({
      ...prev,
      free: [
        ...prev.free,
        {
          id: garmentId,
          x: snapped.x,
          y: snapped.y,
          layer: prev.free.length,
        },
      ],
    }));
  };

  const clearPlacement = (garmentId: string) => {
    setOutfitState((prev) => ({
      ...prev,
      slots: Object.fromEntries(
        Object.entries(prev.slots).map(([slotKey, value]) => [
          slotKey,
          value === garmentId ? null : value,
        ])
      ) as Record<WardrobeSlot, string | null>,
      free: prev.free.filter((item) => item.id !== garmentId),
    }));
  };

  const handleFreePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    item: FreeItem
  ) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    dragRef.current = {
      id: item.id,
      offsetX: event.clientX - rect.left - item.x,
      offsetY: event.clientY - rect.top - item.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleFreePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left - dragRef.current.offsetX;
    const y = event.clientY - rect.top - dragRef.current.offsetY;
    const size = getItemSize();
    const snapped = getSnappedPosition(x, y, rect, size, dragRef.current.id);

    setOutfitState((prev) => ({
      ...prev,
      free: prev.free.map((item) =>
        item.id === dragRef.current?.id
          ? {
              ...item,
              x: snapped.x,
              y: snapped.y,
            }
          : item
      ),
    }));
  };

  const handleFreePointerUp = () => {
    dragRef.current = null;
  };

  const handleGenerateOutfit = () => {
    if (!garments.length) {
      setStatus(null);
      setError("Aggiungi prima qualche capo al guardaroba.");
      return;
    }

    const attemptLimit = 30;

    for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
      const nextSlots: Record<WardrobeSlot, string | null> = {
        ...DEFAULT_SLOTS,
      };

      const selection: Garment[] = [];
      const useFull = garmentsBySlot.full.length > 0 && Math.random() > 0.6;

      if (useFull) {
        const pick = pickRandom(garmentsBySlot.full);
        if (pick) {
          nextSlots.full = pick.id;
          selection.push(pick);
        }
      } else {
        const topPick = pickRandom(garmentsBySlot.top);
        const bottomPick = pickRandom(garmentsBySlot.bottom);
        if (topPick) {
          nextSlots.top = topPick.id;
          selection.push(topPick);
        }
        if (bottomPick) {
          nextSlots.bottom = bottomPick.id;
          selection.push(bottomPick);
        }
      }

      const outerPick = Math.random() > 0.5 ? pickRandom(garmentsBySlot.outer) : null;
      if (outerPick) {
        nextSlots.outer = outerPick.id;
        selection.push(outerPick);
      }

      const shoesPick = pickRandom(garmentsBySlot.shoes);
      if (shoesPick) {
        nextSlots.shoes = shoesPick.id;
        selection.push(shoesPick);
      }

      const accessoryPick = Math.random() > 0.4 ? pickRandom(garmentsBySlot.accessory) : null;
      if (accessoryPick) {
        nextSlots.accessory = accessoryPick.id;
        selection.push(accessoryPick);
      }

      const colors = selection.map((item) => item.color);
      if (selection.length === 0) {
        continue;
      }
      if (hasClash(colors)) {
        continue;
      }

      setOutfitState({ slots: nextSlots, free: [] });
      setError(null);
      setStatus("Outfit casual creato.");
      return;
    }

    setStatus(null);
    setError("Non sono riuscito a creare un outfit. Prova ad aggiungere piu capi.");
  };

  const handleSaveOutfit = async () => {
    const hasItems = outfitItems.length > 0;
    if (!hasItems) {
      setStatus(null);
      setError("Seleziona almeno un capo per salvare.");
      return;
    }

    setOutfitSaving(true);
    setError(null);
    setStatus(null);

    const { data: outfit, error: outfitError } = await supabase
      .from("outfits")
      .insert({
        user_id: userId,
        name: outfitName.trim() || "Outfit senza nome",
      })
      .select("id,name,is_public,share_id")
      .single();

    if (outfitError || !outfit) {
      setOutfitSaving(false);
      setError(outfitError?.message ?? "Errore salvataggio outfit.");
      return;
    }

    const itemsPayload = [
      ...Object.entries(outfitState.slots)
        .filter(([, id]) => Boolean(id) && garmentsById[id as string])
        .map(([slot, id], index) => ({
          outfit_id: outfit.id,
          garment_id: id as string,
          slot,
          placement: "slot",
          position: null,
          layer: index,
        })),
      ...outfitState.free
        .filter((item) => garmentsById[item.id])
        .map((item, index) => ({
          outfit_id: outfit.id,
          garment_id: item.id,
          slot: null,
          placement: "free",
          position: { x: item.x, y: item.y },
          layer: index,
        })),
    ];

    const { error: itemsError } = await supabase
      .from("outfit_items")
      .insert(itemsPayload);

    if (itemsError) {
      setOutfitSaving(false);
      setError(itemsError.message);
      return;
    }

    setOutfits((prev) => [
      {
        ...outfit,
        outfit_items: itemsPayload.map((item, index) => ({
          id: `${outfit.id}-${index}`,
          garment_id: item.garment_id,
          slot: item.slot,
          placement: item.placement,
          position: item.position,
          layer: item.layer,
        })),
      },
      ...prev,
    ]);

    setOutfitName("");
    setStatus("Outfit salvato.");
    setOutfitSaving(false);
  };

  const handleDeleteGarment = (garment: Garment) => {
    setConfirmState({ type: "garment", garment });
  };

  const executeDeleteGarment = async (garment: Garment) => {
    setDeletingGarmentId(garment.id);
    setError(null);
    setStatus(null);

    const photoPaths =
      garment.garment_photos?.map((photo) => photo.path).filter(Boolean) ?? [];

    if (photoPaths.length > 0) {
      const { error: storageError } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .remove(photoPaths);

      if (storageError) {
        setError("Errore eliminazione foto: " + storageError.message);
      }
    }

    const { error: deleteError } = await supabase
      .from("garments")
      .delete()
      .eq("id", garment.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingGarmentId(null);
      return;
    }

    setGarments((prev) => prev.filter((item) => item.id !== garment.id));
    setOutfits((prev) =>
      prev.map((outfit) => ({
        ...outfit,
        outfit_items: (outfit.outfit_items ?? []).filter(
          (item) => item.garment_id !== garment.id
        ),
      }))
    );
    clearPlacement(garment.id);
    setStatus("Capo eliminato.");
    setDeletingGarmentId(null);
  };

  const handleDeleteOutfit = (outfit: Outfit) => {
    setConfirmState({ type: "outfit", outfit });
  };

  const executeDeleteOutfit = async (outfit: Outfit) => {
    setDeletingOutfitId(outfit.id);
    setError(null);
    setStatus(null);

    const { error: deleteError } = await supabase
      .from("outfits")
      .delete()
      .eq("id", outfit.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingOutfitId(null);
      return;
    }

    setOutfits((prev) => prev.filter((item) => item.id !== outfit.id));
    setStatus("Outfit eliminato.");
    setDeletingOutfitId(null);
  };

  const handleLoadOutfit = (outfit: Outfit) => {
    if (!outfit.outfit_items) return;

    const nextSlots = { ...DEFAULT_SLOTS };
    const free: FreeItem[] = [];

    outfit.outfit_items.forEach((item, index) => {
      if (item.placement === "free" && item.position) {
        free.push({
          id: item.garment_id,
          x: item.position.x,
          y: item.position.y,
          layer: item.layer ?? index,
        });
        return;
      }
      if (item.slot) {
        nextSlots[item.slot as WardrobeSlot] = item.garment_id;
      }
    });

    setOutfitState({ slots: nextSlots, free });
    setOutfitName(outfit.name);
    setError(null);
    setStatus("Outfit caricato.");
  };

  const handleConfirmDelete = async () => {
    if (!confirmState) return;
    const payload = confirmState;
    setConfirmState(null);
    if (payload.type === "garment") {
      await executeDeleteGarment(payload.garment);
    } else {
      await executeDeleteOutfit(payload.outfit);
    }
  };

  const freeItemSize = getItemSize();

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ArmadioGreeting name={userName} />
        <div className="flex flex-col gap-4">
          <div className="rounded-[28px] border border-border/70 bg-[#000000a1] p-5 shadow-[0_16px_36px_rgba(255,210,150,0.2)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Mantra del giorno
            </p>
            <p className="mt-3 text-base font-semibold text-foreground">
              "{mantra.text}"
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {mantra.author ? `- ${mantra.author}` : "- OIDAMRA"}
            </p>
            {mantra.source === "zenquotes" && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Fonte:{" "}
                <a
                  href="https://zenquotes.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  ZenQuotes
                </a>
              </p>
            )}
          </div>
          <div className="rounded-[28px] border border-border/70 bg-[#000000a1] p-5 shadow-[0_16px_36px_rgba(255,210,150,0.2)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Pianificazione outfit
            </p>
            <div className="mt-3 grid gap-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="grid gap-1">
                  <Label htmlFor="planDate">Scegli il giorno</Label>
                  <Input
                    id="planDate"
                    type="date"
                    value={selectedDate}
                    min={forecastDays[0]?.date}
                    max={forecastDays[forecastDays.length - 1]?.date}
                    onChange={(event) => setSelectedDate(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchForecast}
                  disabled={forecastLoading}
                >
                  {forecastLoading ? "Aggiorno..." : "Aggiorna meteo"}
                </Button>
              </div>
              {forecastError && (
                <p className="text-xs text-muted-foreground">{forecastError}</p>
              )}
              {selectedForecast ? (
                <div className="rounded-2xl border border-border/60 bg-background px-3 py-3 text-sm">
                  <p className="font-semibold text-foreground">
                    {new Date(selectedForecast.date).toLocaleDateString("it-IT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Math.round(selectedForecast.min)} deg /{" "}
                    {Math.round(selectedForecast.max)} deg - Pioggia{" "}
                    {Math.round(selectedForecast.precip)}%
                  </p>
                  {weatherSuggestion && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Suggerimento: {weatherSuggestion}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Seleziona la posizione per ottenere il meteo.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-[28px] border border-border/70 bg-[#000000a1] px-5 py-4 shadow-[0_16px_36px_rgba(255,210,150,0.2)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Panoramica
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                {garments.length} capi
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                {outfits.length} outfit
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                {Object.values(outfitState.slots).filter(Boolean).length + outfitState.free.length}{" "}
                in canvas
              </span>
            </div>
          </div>
          <div className="rounded-[28px] border border-border/70 bg-[#000000a1] px-5 py-4 shadow-[0_16px_36px_rgba(255,210,150,0.2)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Modalita valigia
            </p>
            <div className="mt-3 grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="tripName">Nome viaggio</Label>
                <Input
                  id="tripName"
                  value={tripName}
                  onChange={(event) => setTripName(event.target.value)}
                  placeholder="Es. Weekend a Roma"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="tripDays">Giorni</Label>
                <Input
                  id="tripDays"
                  type="number"
                  min={1}
                  value={tripDays}
                  onChange={(event) => setTripDays(event.target.value)}
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleOpenSuitcase}>
                Apri modalita valigia
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {status && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {status}
        </div>
      )}

      <div ref={sectionRef} className="flex flex-col gap-4 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-[#000000a1]">
                <Layers className="h-5 w-5 text-foreground" aria-hidden="true" />
              </span>
              <h2 className="font-display text-2xl text-foreground">
                {section === "vestiti" ? "I tuoi vestiti" : "Collezioni Outfit"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {section === "vestiti"
                ? "Aggiungi nuovi capi o gestisci la tua collezione."
                : "Crea outfit con calma e salva i tuoi look preferiti."}
            </p>
          </div>
        </div>

        <div className="sticky top-3 z-30">
          <div className="flex w-full items-center gap-2 rounded-[28px] border border-border/70 bg-[#000000a1] p-1 backdrop-blur-[4px] sm:w-auto">
            <Button
              size="sm"
              variant="ghost"
              className={`flex flex-1 items-center justify-center gap-2 rounded-[28px] text-center sm:flex-none ${
                section === "vestiti"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-foreground/80 hover:bg-white/10"
              }`}
              asChild
            >
              <Link href="/armadio/vestiti">
                <Shirt className="h-4 w-4" aria-hidden="true" />
                I tuoi vestiti
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`flex flex-1 items-center justify-center gap-2 rounded-[28px] text-center sm:flex-none ${
                section === "outfit"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-foreground/80 hover:bg-white/10"
              }`}
              asChild
            >
              <Link href="/armadio/outfit">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Collezioni Outfit
              </Link>
            </Button>
          </div>
        </div>

        {section === "vestiti" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card className="border-border/70 bg-[#000000a1]">
            <CardHeader>
              <CardTitle className="text-lg">Aggiungi un nuovo capo</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={handleAddGarment}>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome (opzionale)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Es. Felpa beige"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria</Label>
                  <select
                    id="category"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Colore</Label>
                  <select
                    id="color"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                  >
                    {COLORS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Stagioni</Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {SEASONS.map((season) => (
                      <label
                        key={season.value}
                        className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-2 py-1"
                      >
                        <Checkbox
                          checked={seasons.includes(season.value)}
                          onCheckedChange={() => handleSeasonToggle(season.value)}
                        />
                        {season.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-fit"
                    onClick={() => setShowExtras((prev) => !prev)}
                  >
                    {showExtras ? "Nascondi dettagli extra" : "Aggiungi dettagli extra"}
                  </Button>
                  {showExtras && (
                    <div className="grid gap-3 rounded-2xl border border-border/60 bg-background p-3">
                      <div className="grid gap-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          value={brand}
                          onChange={(event) => setBrand(event.target.value)}
                          placeholder="Es. Acne Studios"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fabric">Tessuto</Label>
                        <Input
                          id="fabric"
                          value={fabric}
                          onChange={(event) => setFabric(event.target.value)}
                          placeholder="Es. Cotone, lana"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="size">Taglia</Label>
                        <Input
                          id="size"
                          value={size}
                          onChange={(event) => setSize(event.target.value)}
                          placeholder="Es. M, 42"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="formality">Formalita</Label>
                        <select
                          id="formality"
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                          value={formality}
                          onChange={(event) => setFormality(event.target.value)}
                        >
                          <option value="">Seleziona</option>
                          {FORMALITIES.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Occasioni</Label>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {OCCASIONS.map((occasion) => (
                            <label
                              key={occasion.value}
                              className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1"
                            >
                              <Checkbox
                                checked={occasions.includes(occasion.value)}
                                onCheckedChange={() => handleOccasionToggle(occasion.value)}
                              />
                              {occasion.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="photos">Foto (min 1)</Label>
                  <Input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />
                  {files.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {files.length} foto selezionate
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvataggio..." : "Aggiungi capo"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[#000000a1]">
            <CardHeader>
              <CardTitle className="text-lg">Lista vestiti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="grid gap-1">
                  <Label htmlFor="listQuery">Cerca</Label>
                  <Input
                    id="listQuery"
                    value={listQuery}
                    onChange={(event) => setListQuery(event.target.value)}
                    placeholder="Nome, categoria o colore"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    aria-label="Filtro colore"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={listColor}
                    onChange={(event) => setListColor(event.target.value)}
                  >
                    <option value="tutti">Tutti i colori</option>
                    {availableListColors.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filtro stagione"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={listSeason}
                    onChange={(event) => setListSeason(event.target.value)}
                  >
                    <option value="tutte">Tutte le stagioni</option>
                    {SEASONS.map((season) => (
                      <option key={season.value} value={season.value}>
                        {season.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setListColor("tutti");
                      setListSeason("tutte");
                      setListQuery("");
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {garments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-[#000000a1] px-4 py-6 text-sm text-muted-foreground">
                  Nessun capo ancora. Aggiungi il primo per iniziare.
                </div>
              ) : listFilteredGarments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-[#000000a1] px-4 py-6 text-sm text-muted-foreground">
                  Nessun capo trovato. Prova a cambiare i filtri.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {listFilteredGarments.map((garment) => {
                    const photo = getPrimaryPhoto(garment);
                    return (
                      <div
                        key={garment.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData(
                            "application/garment-id",
                            garment.id
                          );
                          event.dataTransfer.setData("text/plain", garment.id);
                          event.dataTransfer.effectAllowed = "copy";
                        }}
                        className="group flex flex-col gap-3 rounded-3xl border border-border/60 bg-[#000000a1] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="relative overflow-hidden rounded-2xl bg-muted/30">
                          {photo ? (
                            <img
                              src={photo}
                              alt={garment.name ?? garment.category}
                              draggable={false}
                              className="h-40 w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                              Nessuna foto
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-semibold text-foreground">
                            {garment.name ?? garment.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {garment.category} | {garment.color}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          {(garment.seasons ?? []).map((season) => (
                            <span
                              key={season}
                              className="rounded-full border border-border/60 px-2 py-1"
                            >
                              {season}
                            </span>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deletingGarmentId === garment.id}
                          onClick={() => handleDeleteGarment(garment)}
                        >
                          {deletingGarmentId === garment.id ? "Elimino..." : "Elimina"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {section === "outfit" && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/70 bg-[#000000a1]">
            <CardHeader>
              <CardTitle className="text-lg">Crea un nuovo outfit</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
                <div className="flex flex-col gap-3">
                  {Object.entries(SLOT_LABELS).map(([slotKey, label]) => {
                    const slot = slotKey as WardrobeSlot;
                    const garmentId = outfitState.slots[slot];
                    const garment = garmentId ? garmentsById[garmentId] : null;
                    return (
                      <div
                        key={slot}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleDropOnSlot(slot, event)}
                        onClick={() => handleSlotClick(slot)}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border/70 bg-[#000000a1] px-4 py-3"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground/90">
                            {label}
                          </span>
                          <span className="text-base font-semibold">
                            {garment?.name ??
                              garment?.category ??
                              "Trascina o clicca per scegliere"}
                          </span>
                        </div>
                        {garmentId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              clearPlacement(garmentId);
                            }}
                          >
                            Rimuovi
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-3">
                  <div
                    ref={canvasRef}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDropOnCanvas}
                    onClick={handleCanvasClick}
                    className="relative grid h-[720px] grid-cols-3 grid-rows-5 gap-2 rounded-3xl border border-dashed border-border/70 bg-[radial-gradient(circle_at_top,_#fff6e6,_transparent_60%)] p-3 sm:p-4"
                  >
                    <span className="absolute left-4 top-3 text-xs font-semibold text-muted-foreground">
                      Canvas outfit
                    </span>
                    {CANVAS_SLOTS.map(({ slot, className }) => {
                      const slotGarmentId = outfitState.slots[slot];
                      const garment = slotGarmentId
                        ? garmentsById[slotGarmentId]
                        : null;
                      const photo = garment ? getPrimaryPhoto(garment) : null;
                      const isActive = slotSelection === slot;
                      return (
                        <div
                          key={slot}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSlotClick(slot);
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleDropOnSlot(slot, event);
                          }}
                          className={`${className} ${
                            isActive ? "ring-2 ring-primary/60" : ""
                          } z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/70 bg-[#000000a1] text-xs shadow-sm transition hover:border-primary/60`}
                        >
                          {photo ? (
                            <>
                              <img
                                src={photo}
                                alt={garment?.name ?? "capo"}
                                draggable={false}
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#000000a1] px-1 text-[11px] font-semibold text-foreground">
                                {SLOT_LABELS[slot]}
                              </span>
                            </>
                          ) : (
                            <span className="px-2 text-center text-sm font-semibold text-foreground/80">
                              {SLOT_LABELS[slot]}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {outfitState.free.map((item) => {
                      const garment = garmentsById[item.id];
                      const photo = garment ? getPrimaryPhoto(garment) : null;
                      return (
                        <div
                          key={item.id}
                          draggable={false}
                          className="absolute z-20 flex cursor-grab flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-[#000000a1] text-[10px] shadow"
                          style={{
                            left: item.x,
                            top: item.y,
                            width: freeItemSize.width,
                            height: freeItemSize.height,
                            zIndex: item.layer + 1,
                          }}
                          onDragStart={(event) => event.preventDefault()}
                          onClick={(event) => event.stopPropagation()}
                          onPointerDown={(event) => handleFreePointerDown(event, item)}
                          onPointerMove={handleFreePointerMove}
                          onPointerUp={handleFreePointerUp}
                          onDoubleClick={() => clearPlacement(item.id)}
                        >
                          {photo ? (
                            <img
                              src={photo}
                              alt={garment?.name ?? "capo"}
                              draggable={false}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{garment?.category ?? "Capo"}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Trascina un capo oppure tocca il canvas per aggiungerlo.
                    Tocca i box per scegliere un capo della categoria.
                    Doppio click per rimuovere.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-[#000000a1] px-4 py-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="grid gap-2">
                    <Label htmlFor="outfitName">Nome outfit</Label>
                    <Input
                      id="outfitName"
                      value={outfitName}
                      onChange={(event) => setOutfitName(event.target.value)}
                      placeholder="Es. Casual venerdi"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleGenerateOutfit}
                    >
                      Crea look casual
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveOutfit}
                      disabled={outfitSaving}
                    >
                      {outfitSaving ? "Salvataggio..." : "Salva outfit"}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {noGoLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-border/60 px-3 py-1"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[#000000a1]">
            <CardHeader>
              <CardTitle className="text-lg">Outfit salvati</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {shareError && (
                <p className="text-xs text-muted-foreground">{shareError}</p>
              )}
              {outfits.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nessun outfit salvato. Crea il primo dalla dashboard.
                </p>
              )}
              {outfits.map((outfit) => (
                <div
                  key={outfit.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-[#000000a1] px-3 py-3"
                >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{outfit.name}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadOutfit(outfit)}
                        >
                          Carica
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={sharingOutfitId === outfit.id}
                          onClick={() =>
                            outfit.is_public
                              ? copyShareLink(outfit)
                              : handleShareOutfit(outfit)
                          }
                        >
                          {sharingOutfitId === outfit.id
                            ? "Creo link..."
                            : outfit.is_public
                              ? "Copia link"
                              : "Condividi"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deletingOutfitId === outfit.id}
                          onClick={() => handleDeleteOutfit(outfit)}
                        >
                          {deletingOutfitId === outfit.id ? "Elimino..." : "Elimina"}
                        </Button>
                      </div>
                    </div>
                    {outfit.is_public && outfit.share_id && origin && (
                      <div className="mt-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-[11px] text-muted-foreground">
                        Link pubblico: {origin}/share/{outfit.share_id}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {(outfit.outfit_items ?? []).slice(0, 4).map((item) => {
                        const garment = garmentsById[item.garment_id];
                        return (
                        <span
                          key={item.id}
                          className="rounded-full bg-secondary px-3 py-1 text-xs"
                        >
                          {garment?.category ?? "Capo"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      </div>

      {selectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-background p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Seleziona un capo</p>
                <p className="text-xs text-muted-foreground">
                  {slotSelection && `Parte: ${SLOT_LABELS[slotSelection]}`}
                  {!slotSelection && canvasSlot && `Canvas: ${SLOT_LABELS[canvasSlot]}`}
                  {!slotSelection && !canvasSlot && "Canvas: scegli una categoria"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canvasSelection && canvasSlot && (
                  <Button size="sm" variant="outline" onClick={() => setCanvasSlot(null)}>
                    Cambia categoria
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSlotSelection(null);
                    setCanvasSelection(null);
                    setCanvasSlot(null);
                  }}
                >
                  Chiudi
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1 sm:col-span-2">
                <Label htmlFor="filterQuery">Cerca</Label>
                <Input
                  id="filterQuery"
                  value={filterQuery}
                  onChange={(event) => setFilterQuery(event.target.value)}
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
                  {availableSelectionColors.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <Label>Stagione</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={filterSeason === "tutte" ? "secondary" : "outline"}
                    onClick={() => setFilterSeason("tutte")}
                  >
                    Tutte
                  </Button>
                  {SEASONS.map((season) => (
                    <Button
                      key={season.value}
                      size="sm"
                      variant={
                        filterSeason === season.value ? "secondary" : "outline"
                      }
                      onClick={() => setFilterSeason(season.value)}
                    >
                      {season.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {hasFilters && (
              <div className="mt-2 text-xs text-muted-foreground">
                Filtri attivi.
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => {
                    setFilterColor("tutti");
                    setFilterSeason("tutte");
                    setFilterQuery("");
                  }}
                >
                  Reset
                </button>
              </div>
            )}

            {canvasSelection && !canvasSlot && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(SLOT_LABELS).map(([slotKey, label]) => (
                  <Button
                    key={slotKey}
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setCanvasSlot(slotKey as WardrobeSlot);
                      setFilterColor("tutti");
                      setFilterSeason("tutte");
                      setFilterQuery("");
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}

            {activeSelectionSlot && (
              <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
                {filteredGarments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nessun capo disponibile per questa categoria.
                  </p>
                ) : (
                  filteredGarments.map((garment) => {
                    const photo = getPrimaryPhoto(garment);
                    return (
                      <button
                        key={garment.id}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-background px-3 py-2 text-left text-sm hover:bg-secondary/40"
                        onClick={() => handleSelectGarment(garment.id)}
                      >
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-muted/30">
                          {photo ? (
                            <img
                              src={photo}
                              alt={garment.name ?? garment.category}
                              draggable={false}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                              Foto
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {garment.name ?? garment.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {garment.category} | {garment.color}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-background p-5 shadow-xl">
            <p className="text-sm font-semibold">Conferma eliminazione</p>
            <p className="mt-2 text-sm text-muted-foreground">{confirmTitle}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmState(null)}>
                Annulla
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={confirmBusy}
                onClick={handleConfirmDelete}
              >
                {confirmBusy ? "Elimino..." : "Elimina"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPrimaryPhoto(garment: Garment) {
  const photos = garment.garment_photos ?? [];
  if (!photos.length) return "";
  const primary = photos.find((photo) => photo.is_primary) ?? photos[0];
  return getPublicImageUrl(primary.path);
}

function pickRandom<T>(items: T[]) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function hasClash(colors: string[]) {
  return colors.some((color) =>
    NO_MATCH_PAIRS.some(
      ([first, second]) =>
        (first === color && colors.includes(second)) ||
        (second === color && colors.includes(first))
    )
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
