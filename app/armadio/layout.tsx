import ArmadioTheme from "@/components/wardrobe/armadio-theme";

export default function ArmadioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ArmadioTheme>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        {children}
      </main>
    </ArmadioTheme>
  );
}
