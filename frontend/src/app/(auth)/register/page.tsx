"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bolt, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, signUp } from "@/lib/supabase";
import { setVeloTokenCookie, syncAuthCookiesToServer } from "@/lib/auth-cookies";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signUp(email, password, fullName);

      if (!result.data.user) {
        setError("Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (!result.data.session) {
        // User created but needs email confirmation
        router.push("/login?registered=true");
        return;
      }

      // If session is returned immediately (email confirmation disabled)
      localStorage.setItem("velo_token", result.data.session.access_token);
      setVeloTokenCookie(result.data.session.access_token);
      try {
        await syncAuthCookiesToServer(
          result.data.session.access_token,
          result.data.session.refresh_token ?? ""
        );
      } catch (e) {
        console.warn("Cookie sync failed:", e);
      }
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Registration error:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      if (message.includes("already registered")) {
        setError("This email is already registered. Try logging in.");
      } else if (message.includes("Password should be at least")) {
        setError("Password must be at least 6 characters");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        // Handle specific error messages
        if (authError.message.includes("provider is not enabled")) {
          setError("Google login is not enabled. Please enable it in Supabase Dashboard → Authentication → Providers → Google");
        } else {
          setError(authError.message);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed. Please check if Google provider is enabled in Supabase.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center overflow-hidden relative">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Decorative */}
      <div className="absolute top-1/4 right-10 hidden md:block pointer-events-none select-none">
        <div className="px-4 py-2 rounded-lg rotate-[5deg] border border-[rgba(255,255,255,0.05)] bg-[#1E1E26]/60 backdrop-blur-sm">
          <span className="text-[#8A8A9A] font-mono text-sm">BRETT</span>
          <span className="text-velo-lime font-bold ml-2">+21.3%</span>
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[420px] mx-4">
        <div className="bg-[#141418] border border-[rgba(255,255,255,0.09)] rounded-2xl p-9 flex flex-col items-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-velo-lime rounded-lg flex items-center justify-center">
              <Bolt className="w-4 h-4 text-[#0A0A0C] font-bold fill-current" />
            </div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">Velo</h1>
          </div>
          <p className="text-[12px] text-[#4A4A5A] font-medium tracking-wide uppercase">
            AI-Powered Market Intelligence
          </p>

          <div className="w-full h-[1px] bg-[rgba(255,255,255,0.07)] my-5" />

          {/* Tab row */}
          <nav className="flex w-full mb-8">
            <Link
              href="/login"
              className="flex-1 py-2 text-[14px] font-medium text-[#4A4A5A] hover:text-white border-b-2 border-transparent text-center transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="flex-1 py-2 text-[14px] font-medium text-white border-b-2 border-velo-lime text-center transition-colors"
            >
              Register
            </Link>
          </nav>

          <form className="w-full space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-velo-red/10 border border-velo-red/30 text-velo-red text-xs px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8A8A9A] uppercase tracking-wider ml-1">
                Full Name
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A5A] w-4 h-4 group-focus-within:text-velo-lime transition-colors" />
                <Input
                  className="h-10 bg-[#0A0A0C] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 text-white font-mono text-sm placeholder:text-[#4A4A5A] focus-visible:ring-1 focus-visible:ring-velo-lime/50"
                  id="fullName"
                  type="text"
                  placeholder="Nguyen Van A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8A8A9A] uppercase tracking-wider ml-1">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A5A] w-4 h-4 group-focus-within:text-velo-lime transition-colors" />
                <Input
                  className="h-10 bg-[#0A0A0C] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 text-white font-mono text-sm placeholder:text-[#4A4A5A] focus-visible:ring-1 focus-visible:ring-velo-lime/50"
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8A8A9A] uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A5A] w-4 h-4 group-focus-within:text-velo-lime transition-colors" />
                <Input
                  className="h-10 bg-[#0A0A0C] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-10 text-white font-mono text-sm placeholder:text-[#4A4A5A] focus-visible:ring-1 focus-visible:ring-velo-lime/50"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4A5A] hover:text-[#8A8A9A] transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <p className="text-[11px] text-[#4A4A5A] text-center">
              By registering, you agree to our{" "}
              <a href="#" className="text-velo-indigo hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-velo-indigo hover:underline">Privacy Policy</a>
            </p>

            <Button
              type="submit"
              className="w-full h-10 bg-velo-lime hover:bg-velo-lime/90 text-[#0A0A0C] font-semibold text-sm mt-2 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0A0A0C]/30 border-t-[#0A0A0C] rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center w-full">
            <div className="flex-grow border-t border-[rgba(255,255,255,0.07)]" />
            <span className="flex-shrink mx-4 text-[11px] text-[#4A4A5A] font-medium uppercase tracking-widest whitespace-nowrap">
              or continue with
            </span>
            <div className="flex-grow border-t border-[rgba(255,255,255,0.07)]" />
          </div>

          {/* Google SSO */}
          <button
            className="w-full h-10 bg-transparent border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.03)] transition-all rounded-xl text-white font-medium text-[13px] flex items-center justify-center gap-3 disabled:opacity-50"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-[13px] text-[#4A4A5A] font-medium">
            Already have an account?{" "}
            <Link className="text-velo-lime hover:underline" href="/login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
