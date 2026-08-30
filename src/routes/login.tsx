import { useState, useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { adminLogin } from "@/lib/auth.functions";
import { useAdminSession } from "@/hooks/useAdminSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion administrateur — Zender237" },
      {
        name: "description",
        content:
          "Accès sécurisé au back-office administrateur Zender237 : transactions, règlements et wallets.",
      },
      { property: "og:title", content: "Connexion administrateur — Zender237" },
      {
        property: "og:description",
        content: "Accès sécurisé au back-office administrateur Zender237.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

const errorLabels: Record<string, string> = {
  INVALID_CREDENTIALS: "Numéro de téléphone ou code secret invalide.",
  ADMIN_DISABLED: "Compte désactivé — contactez le responsable de la plateforme.",
  ADMIN_NO_AUTH_ACCOUNT: "Aucun compte d'authentification n'est lié à cet administrateur.",
  SESSION_ISSUE_FAILED: "Impossible d'ouvrir la session. Réessayez dans un instant.",
};

function LoginPage() {
  const router = useRouter();
  const { admin, session, reason } = useAdminSession();
  const login = useServerFn(adminLogin);
  const [phone, setPhone] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (admin) router.navigate({ to: "/admin" });
  }, [admin, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login({ data: { phone: phone.trim(), secretCode: secretCode.trim() } });
      const { error: verifyError } = await supabase.auth.verifyOtp({
        type: "email",
        token_hash: res.tokenHash,
      });
      if (verifyError) throw new Error("SESSION_ISSUE_FAILED");
      router.navigate({ to: "/admin" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const key = Object.keys(errorLabels).find((k) => message.includes(k));
      setError(key ? errorLabels[key]! : "Connexion impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const accountError =
    reason === "not_admin"
      ? "Accès refusé — compte administrateur introuvable."
      : reason === "disabled"
        ? "Compte désactivé — contactez le responsable de la plateforme."
        : null;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(var(--sidebar-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--sidebar-foreground) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />
        <div className="flex items-center gap-2">
          <img
            src="/__l5e/assets-v1/20345e55-06c6-437d-8a27-de545f1b3ec8/zender-logo.png"
            alt="Zender237"
            className="size-10 rounded-xl object-contain"
          />
          <span className="font-display relative text-xl font-semibold">Zender237</span>
        </div>
        <div className="relative max-w-md space-y-4">
          <p className="mono-label text-sidebar-primary">Back-office · Console admin</p>
          <h2 className="font-display text-3xl leading-tight font-semibold">
            Le centre de contrôle opérationnel de Zender237.
          </h2>
          <p className="text-sm text-sidebar-foreground/70">
            Supervision des transactions, vérification des preuves, affectation aux partenaires,
            règlements bancaires et audit complet — en un seul endroit.
          </p>
        </div>
        <p className="mono-label relative text-sidebar-foreground/50">
          <span className="pulse-dot mr-2 inline-block size-1.5 rounded-full bg-sidebar-primary align-middle" />
          Accès réservé aux administrateurs autorisés
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="surface elevated reveal w-full max-w-sm rounded-2xl p-8">
          <div className="mb-6 space-y-1.5 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <h1 className="font-display pt-2 text-xl font-semibold">Connexion administrateur</h1>
            <p className="mono-label">Back-office Zender237</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+237 6 20 00 00 00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="secret-code">Code secret</Label>
              <Input
                id="secret-code"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                required
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                placeholder="••••••"
              />
            </div>

            {(error || (session && accountError)) && (
              <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error ?? accountError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Se connecter
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Code secret oublié ou compte bloqué ? Contactez le responsable de la plateforme.
          </p>
        </Card>
      </div>
    </div>
  );
}
