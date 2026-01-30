export type GarmentPhoto = {
  id: string;
  path: string;
  is_primary: boolean | null;
  sort_order: number | null;
};

export type Garment = {
  id: string;
  name: string | null;
  category: string;
  color: string;
  seasons: string[] | null;
  brand?: string | null;
  fabric?: string | null;
  size?: string | null;
  formality?: string | null;
  occasions?: string[] | null;
  garment_photos?: GarmentPhoto[] | null;
};

export type OutfitItem = {
  id: string;
  garment_id: string;
  slot: string | null;
  placement: string | null;
  position: { x: number; y: number } | null;
  layer: number | null;
};

export type Outfit = {
  id: string;
  name: string;
  is_public?: boolean | null;
  share_id?: string | null;
  outfit_items?: OutfitItem[] | null;
};
