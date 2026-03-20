"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api-client";

export function useAuthForm(type: "login" | "register") {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = useCallback(
    async (data: { email: string; password: string; fullName?: string }) => {
      setLoading(true);
      setError("");
      try {
        let res;
        if (type === "login") {
          res = await authApi.login({ email: data.email, password: data.password });
        } else {
          if (!data.fullName) throw new Error("Full name is required");
          res = await authApi.register({
            email: data.email,
            password: data.password,
            fullName: data.fullName,
          });
        }
        localStorage.setItem("velo_token", res.token);
        // Also set cookie for middleware
        document.cookie = `velo_token=${res.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      } finally {
        setLoading(false);
      }
    },
    [type, router]
  );

  return { loading, error, submit };
}
