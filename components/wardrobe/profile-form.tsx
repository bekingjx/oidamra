"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileFormProps = {
  initialFirstName?: string | null;
  initialLastName?: string | null;
  initialSpringVeilAccent?: string | null;
  email?: string | null;
};

export default function ProfileForm({
  initialFirstName,
  initialLastName,
  initialSpringVeilAccent,
  email,
}: ProfileFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName ?? "");
  const [lastName, setLastName] = useState(initialLastName ?? "");
  const [springVeilAccent, setSpringVeilAccent] = useState(
    initialSpringVeilAccent ?? "#8cff77"
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Inserisci nome e cognome.");
      return;
    }

    setSaving(true);
    const accentValue = /^#[0-9a-fA-F]{6}$/.test(springVeilAccent)
      ? springVeilAccent
      : "#8cff77";

    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        spring_veil_accent: accentValue,
      },
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setStatus("Profilo aggiornato con successo.");
    setSaving(false);
    router.push("/armadio/vestiti");
  };

  return (
    <Card className="border-border/70 bg-[#000000a1]">
      <CardHeader>
        <CardTitle className="text-lg">Il tuo profilo</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSave}>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input value={email ?? ""} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Nome"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Cognome</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Cognome"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="springVeilAccent">Colore accento background</Label>
            <div className="flex items-center gap-3">
              <Input
                id="springVeilAccent"
                type="color"
                value={springVeilAccent}
                onChange={(event) => setSpringVeilAccent(event.target.value)}
                className="h-12 w-16 p-1"
              />
              <Input
                value={springVeilAccent}
                onChange={(event) => setSpringVeilAccent(event.target.value)}
                placeholder="#8cff77"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Modifica la terza radiale del background spring-veil.
            </p>
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {status && <p className="text-sm text-emerald-700">{status}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
