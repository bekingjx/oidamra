import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WardrobeDashboard from "@/components/wardrobe/wardrobe-dashboard";

export default async function ArmadioContent({
  section,
}: {
  section: "vestiti" | "outfit";
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const metadata = data.user.user_metadata ?? {};
  const displayName =
    [metadata.first_name, metadata.last_name].filter(Boolean).join(" ").trim() ||
    metadata.full_name ||
    data.user.email?.split("@")[0] ||
    null;

  const { data: garments } = await supabase
    .from("garments")
    .select(
      "id,name,category,color,seasons,brand,fabric,size,formality,occasions,garment_photos(id,path,is_primary,sort_order)"
    )
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false });

  const { data: outfits } = await supabase
    .from("outfits")
    .select(
      "id,name,is_public,share_id,outfit_items(id,garment_id,slot,placement,position,layer)"
    )
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false });

  let mantra = {
    text: "Oggi scelgo armonia, leggerezza e gratitudine.",
    author: "OIDAMRA",
    source: null as string | null,
  };

  try {
    const response = await fetch("https://zenquotes.io/api/today", {
      next: { revalidate: 3600 },
    });
    if (response.ok) {
      const data = (await response.json()) as { q: string; a: string }[];
      if (data?.[0]?.q) {
        mantra = {
          text: data[0].q,
          author: data[0].a,
          source: "zenquotes",
        };
      }
    }
  } catch {
    // Keep fallback mantra
  }

  return (
    <WardrobeDashboard
      userId={data.user.id}
      userName={displayName}
      mantra={mantra}
      section={section}
      initialGarments={garments ?? []}
      initialOutfits={outfits ?? []}
    />
  );
}
