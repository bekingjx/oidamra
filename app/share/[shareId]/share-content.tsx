import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/wardrobe/storage";

type ShareContentProps = {
  shareId: string;
};

export default async function ShareContent({ shareId }: ShareContentProps) {
  const supabase = await createClient();

  const { data: outfit } = await supabase
    .from("outfits")
    .select(
      "id,name,is_public,share_id,created_at,outfit_items(id,garment_id,slot,placement,position,layer,garments(id,name,category,color,garment_photos(id,path,is_primary,sort_order)))"
    )
    .eq("share_id", shareId)
    .eq("is_public", true)
    .single();

  if (!outfit) {
    notFound();
  }

  const items = (outfit.outfit_items ?? []).slice().sort((a, b) => {
    const layerA = a.layer ?? 0;
    const layerB = b.layer ?? 0;
    return layerA - layerB;
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="rounded-[32px] border border-border/70 bg-[#000000a1] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Outfit condiviso
        </p>
        <h1 className="mt-3 font-display text-3xl text-foreground">
          {outfit.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Creato con OIDAMRA</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-[#000000a1] px-4 py-6 text-sm text-muted-foreground">
            Nessun capo disponibile per questo outfit.
          </div>
        ) : (
          items.map((item) => {
            const garments = Array.isArray(item.garments)
              ? item.garments
              : item.garments
                ? [item.garments]
                : [];
            const garment = garments[0];
            const photo = garment
              ? getPrimaryPhoto(garment.garment_photos ?? [])
              : "";
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-[#000000a1] p-4"
              >
                <div className="h-40 overflow-hidden rounded-2xl bg-muted/30">
                  {photo ? (
                    <img
                      src={photo}
                      alt={garment?.name ?? garment?.category ?? "Capo"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Foto non disponibile
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {garment?.name ?? garment?.category ?? "Capo"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {garment?.category}
                    {garment?.color ? ` - ${garment.color}` : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getPrimaryPhoto(
  photos: { path: string; is_primary: boolean | null }[]
) {
  if (!photos.length) return "";
  const primary = photos.find((photo) => photo.is_primary) ?? photos[0];
  return getPublicImageUrl(primary.path);
}
