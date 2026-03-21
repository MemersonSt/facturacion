import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { PosApp } from "@/modules/pos/components/pos-app";

export default async function PosPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.features.includes("POS")) {
    redirect("/overview");
  }

  return (
    <PosApp
      initialSession={{
        name: session.name,
        role: session.role,
      }}
    />
  );
}
