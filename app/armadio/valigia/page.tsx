import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SuitcasePlanner from "@/components/wardrobe/suitcase-planner";

export default async function ValigiaPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const params = (await searchParams) ?? {};
  const nameParam = params.name;
  const daysParam = params.days;
  const tripName = Array.isArray(nameParam) ? nameParam[0] : nameParam ?? "";
  const parsedDays = Array.isArray(daysParam) ? daysParam[0] : daysParam;
  const days = Math.max(1, Number.parseInt(parsedDays ?? "3", 10) || 3);

  const { data: garments } = await supabase
    .from("garments")
    .select(
      "id,name,category,color,seasons,brand,fabric,size,formality,occasions,garment_photos(id,path,is_primary,sort_order)"
    )
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false });

  return (
    <SuitcasePlanner
      garments={garments ?? []}
      initialDays={days}
      initialName={tripName}
    />
  );
}
