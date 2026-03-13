import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-black">Platform Settings</h2>
        <p className="mt-1 text-sm text-zinc-400">Configure business profile and notification defaults.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-zinc-800 bg-[#121212] p-6">
          <h3 className="text-lg font-bold">Business Profile</h3>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.08em] text-zinc-500">Organization Name</span>
              <input
                type="text"
                defaultValue="FITUP"
                className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none focus:border-[#d68c45]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.08em] text-zinc-500">Support Email</span>
              <input
                type="email"
                defaultValue="hello@fitup.com"
                className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none focus:border-[#d68c45]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.08em] text-zinc-500">Hotline</span>
              <input
                type="text"
                defaultValue="0987 654 321"
                className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none focus:border-[#d68c45]"
              />
            </label>
          </div>
        </article>

        <article className="rounded-3xl border border-zinc-800 bg-[#121212] p-6">
          <h3 className="text-lg font-bold">Notifications</h3>

          <div className="mt-5 space-y-4 text-sm">
            <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <span>New user sign-up alerts</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#d68c45]" />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <span>Refund activity alerts</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#d68c45]" />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <span>Weekly finance summary email</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#d68c45]" />
            </label>
          </div>
        </article>
      </section>

      <div className="flex justify-end">
        <Button type="button" size="lg">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
