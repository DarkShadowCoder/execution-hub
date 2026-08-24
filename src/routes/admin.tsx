import { useEffect } from "react";
import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useAdminSession } from "@/hooks/useAdminSession";
import { AdminShell } from "@/components/admin/AdminShell";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const router = useRouter();
  const { ready, session, admin, loading, reason } = useAdminSession();

  useEffect(() => {
    if (ready && !session) router.navigate({ to: "/login" });
  }, [ready, session, router]);

  if (loading || (!session && !ready)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (session && !admin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-xl font-semibold">
            {reason === "disabled" ? "Compte désactivé" : "Accès refusé"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {reason === "disabled"
              ? "Contactez le responsable de la plateforme."
              : "Compte administrateur introuvable pour cette session."}
          </p>
          <button
            className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => router.navigate({ to: "/login" })}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <AdminShell admin={admin}>
      <Outlet />
      <Toaster position="top-right" richColors />
    </AdminShell>
  );
}
