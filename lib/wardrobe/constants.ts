export type WardrobeSlot = "top" | "bottom" | "outer" | "shoes" | "accessory" | "full";

export const CATEGORIES: { value: string; label: string; slot: WardrobeSlot }[] = [
  { value: "t-shirt", label: "T-shirt", slot: "top" },
  { value: "camicia", label: "Camicia", slot: "top" },
  { value: "polo", label: "Polo", slot: "top" },
  { value: "maglia", label: "Maglia", slot: "top" },
  { value: "felpa", label: "Felpa", slot: "top" },
  { value: "maglione", label: "Maglione", slot: "top" },
  { value: "cardigan", label: "Cardigan", slot: "outer" },
  { value: "giacca", label: "Giacca", slot: "outer" },
  { value: "blazer", label: "Blazer", slot: "outer" },
  { value: "cappotto", label: "Cappotto", slot: "outer" },
  { value: "piumino", label: "Piumino", slot: "outer" },
  { value: "pantaloni", label: "Pantaloni", slot: "bottom" },
  { value: "jeans", label: "Jeans", slot: "bottom" },
  { value: "chino", label: "Chino", slot: "bottom" },
  { value: "shorts", label: "Shorts", slot: "bottom" },
  { value: "gonna", label: "Gonna", slot: "bottom" },
  { value: "abito", label: "Abito", slot: "full" },
  { value: "tuta", label: "Tuta", slot: "full" },
  { value: "scarpe", label: "Scarpe", slot: "shoes" },
  { value: "sneakers", label: "Sneakers", slot: "shoes" },
  { value: "stivali", label: "Stivali", slot: "shoes" },
  { value: "sandali", label: "Sandali", slot: "shoes" },
  { value: "accessorio", label: "Accessorio", slot: "accessory" },
  { value: "cappello", label: "Cappello", slot: "accessory" },
  { value: "sciarpa", label: "Sciarpa", slot: "accessory" },
  { value: "borsa", label: "Borsa", slot: "accessory" },
  { value: "cintura", label: "Cintura", slot: "accessory" },
];

export const COLORS: { value: string; label: string; hex: string }[] = [
  { value: "nero", label: "Nero", hex: "#1f1f1f" },
  { value: "bianco", label: "Bianco", hex: "#f6f2ea" },
  { value: "grigio", label: "Grigio", hex: "#9b9b9b" },
  { value: "blu", label: "Blu", hex: "#2b4a78" },
  { value: "azzurro", label: "Azzurro", hex: "#7fb8d4" },
  { value: "rosso", label: "Rosso", hex: "#b13a2f" },
  { value: "verde", label: "Verde", hex: "#3d6b3d" },
  { value: "giallo", label: "Giallo", hex: "#e0b44c" },
  { value: "arancione", label: "Arancione", hex: "#d9792d" },
  { value: "viola", label: "Viola", hex: "#6b4b8a" },
  { value: "rosa", label: "Rosa", hex: "#d99aa7" },
  { value: "beige", label: "Beige", hex: "#d7c5a5" },
  { value: "marrone", label: "Marrone", hex: "#6b4f3a" },
  { value: "bordeaux", label: "Bordeaux", hex: "#5a1e2d" },
  { value: "multicolore", label: "Multicolore", hex: "#8c8c8c" },
];

export const SEASONS: { value: string; label: string }[] = [
  { value: "primavera", label: "Primavera" },
  { value: "estate", label: "Estate" },
  { value: "autunno", label: "Autunno" },
  { value: "inverno", label: "Inverno" },
  { value: "tutto-anno", label: "Tutto l'anno" },
];

export const FORMALITIES: { value: string; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "smart-casual", label: "Smart casual" },
  { value: "business", label: "Business" },
  { value: "elegante", label: "Elegante" },
  { value: "sport", label: "Sport" },
  { value: "home", label: "Casa/Relax" },
];

export const OCCASIONS: { value: string; label: string }[] = [
  { value: "lavoro", label: "Lavoro" },
  { value: "ufficio", label: "Ufficio" },
  { value: "weekend", label: "Weekend" },
  { value: "serata", label: "Serata" },
  { value: "cerimonia", label: "Cerimonia" },
  { value: "viaggio", label: "Viaggio" },
  { value: "allenamento", label: "Allenamento" },
  { value: "casa", label: "Casa" },
];

export const SLOT_LABELS: Record<WardrobeSlot, string> = {
  top: "Parte sopra",
  bottom: "Parte sotto",
  outer: "Capospalla",
  shoes: "Scarpe",
  accessory: "Accessori",
  full: "Completo",
};

export const NO_MATCH_PAIRS: [string, string][] = [
  ["rosso", "verde"],
  ["viola", "giallo"],
  ["arancione", "rosa"],
];

export function categoryToSlot(category: string): WardrobeSlot {
  const match = CATEGORIES.find((item) => item.value === category);
  return match?.slot ?? "accessory";
}
