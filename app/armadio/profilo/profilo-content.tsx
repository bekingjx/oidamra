import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/wardrobe/profile-form";
import ArmadioGreeting from "@/components/wardrobe/armadio-greeting";

export default async function ProfiloContent() {
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

  return (
    <div className="flex flex-col gap-6">
      <ArmadioGreeting name={displayName} />
      <ProfileForm
        email={data.user.email}
        initialFirstName={metadata.first_name ?? ""}
        initialLastName={metadata.last_name ?? ""}
        initialSpringVeilAccent={metadata.spring_veil_accent ?? null}
      />
    </div>
  );
}
