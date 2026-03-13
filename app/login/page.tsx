import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
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

        <h1 className="text-2xl font-black">Welcome Back</h1>
        <p className="mt-2 text-sm text-zinc-400">Sign in to manage users, packages, and platform content.</p>

        <form className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">Email</span>
            <input
              type="email"
              placeholder="admin@fitup.com"
              className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none transition-colors focus:border-[#d68c45]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">Password</span>
            <input
              type="password"
              placeholder="********"
              className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none transition-colors focus:border-[#d68c45]"
            />
          </label>

          <Button type="button" className="mt-2 w-full">
            Sign In
          </Button>
        </form>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Demo Access</p>
          <p className="mt-1 text-sm text-zinc-300">This template uses mocked data only. Hook your auth provider next.</p>
          <Link href="/dashboard" className="mt-3 inline-flex text-sm font-semibold text-[#d68c45] hover:brightness-110">
            Continue to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
