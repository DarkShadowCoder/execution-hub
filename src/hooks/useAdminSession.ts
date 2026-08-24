import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { getAdminMe } from "@/lib/admin.functions";

export type AdminAccount = {
  id: string;
  full_name: string;
  role: string;
  active: boolean;
  whatsapp_number: string | null;
};

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, ready };
}

export function useAdminSession() {
  const { session, ready } = useSupabaseSession();
  const fetchMe = useServerFn(getAdminMe);

  const query = useQuery({
    queryKey: ["admin-me", session?.user?.id ?? null],
    queryFn: () => fetchMe(),
    enabled: ready && !!session,
    retry: false,
    staleTime: 60_000,
  });

  const message = query.error instanceof Error ? query.error.message : "";
  const reason = message.includes("ADMIN_NOT_FOUND")
    ? "not_admin"
    : message.includes("ADMIN_DISABLED")
      ? "disabled"
      : message
        ? "error"
        : null;

  return {
    ready,
    session,
    admin: (query.data?.admin ?? null) as AdminAccount | null,
    loading: !ready || (!!session && query.isPending),
    reason,
    errorMessage: message,
  };
}
