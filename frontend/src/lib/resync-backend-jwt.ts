"use client";

import { syncBackendAuthFromSupabaseSession } from "@/lib/sync-backend-auth";

/** Lấy session Supabase hiện tại và đổi sang JWT backend (fix watchlist 401 khi velo_token là token Supabase). */
export async function resyncBackendJwtFromSupabase(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const { supabase } = await import("@/lib/supabase");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return {
      ok: false,
      message: "Không có phiên Supabase — hãy đăng nhập lại.",
    };
  }
  try {
    await syncBackendAuthFromSupabaseSession(session);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Đồng bộ JWT thất bại.",
    };
  }
}
