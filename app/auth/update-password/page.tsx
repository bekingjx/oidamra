import { UpdatePasswordForm } from "@/components/update-password-form";

export default function Page() {
  return (
    <div className="spring-veil flex min-h-svh w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-border/70 bg-[#000000a1] p-6 shadow-[0_20px_50px_rgba(255,200,130,0.25)]">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
