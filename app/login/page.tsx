"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { clearAuthSession, getAuthRoleFromToken, setAuthRole, setAuthToken } from "@/lib/client-api";

function findToken(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findToken(item);
      if (found) {
        return found;
      }
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.data === "object" && record.data) {
    const dataRecord = record.data as Record<string, unknown>;
    if (typeof dataRecord.accessToken === "string") {
      return dataRecord.accessToken;
    }
  }
  for (const [key, entry] of Object.entries(record)) {
    if (typeof entry === "string" && key.toLowerCase().includes("token")) {
      return entry;
    }
    const found = findToken(entry);
    if (found) {
      return found;
    }
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: credential, password }),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => response.statusText);
        throw new Error(message || response.statusText);
      }

      const responseText = await response.text();
      let token: string | null = response.headers.get("authorization");
      if (responseText) {
        try {
          const json = JSON.parse(responseText) as unknown;
          token = token ?? findToken(json);
        } catch {
          token = token ?? null;
        }
      }

      const role = token ? getAuthRoleFromToken(token) : null;

      if (!role || role.toLowerCase() !== "admin") {
        clearAuthSession();
        throw new Error("Only admin accounts can access this portal.");
      }

      if (!token) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      setAuthToken(token);
      setAuthRole(role);
      router.push("/dashboard");
    } catch {
      setError("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#1f1f1f] px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,140,69,0.28),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(107,18,28,0.28),transparent_35%)]" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-800 bg-[#121212]/95 p-8 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
        <div className="mb-8 flex items-center gap-3">
          <Image src="/fitup-logo.png" alt="FITUP" width={44} height={44} className="h-11 w-11" priority />
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">FITUP</p>
            <p className="text-xl font-black">Admin Portal</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">
              Email or Username
            </span>
            <input
              type="text"
              placeholder="admin"
              value={credential}
              onChange={(event) => setCredential(event.target.value)}
              autoComplete="username"
              className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none transition-colors focus:border-[#d68c45]"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">Password</span>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none transition-colors focus:border-[#d68c45]"
              required
            />
          </label>

          {error ? <p className="text-sm text-amber-300">{error}</p> : null}

          <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

      </section>
    </main>
  );
}
