import { useQuery } from "@tanstack/react-query";
import { insurGigApi } from "@/lib/api";

const SettingsScreen = () => {
  const { data: serverMeta, isError, isPending } = useQuery({
    queryKey: ["ops-meta"],
    queryFn: () => insurGigApi.opsMeta(),
    staleTime: 60_000,
  });

  const clientMeta: Record<string, unknown> = {
    vite_mode: import.meta.env.MODE,
    api_base: import.meta.env.VITE_API_URL ?? "/api",
  };

  const serverEntries = serverMeta ? Object.entries(serverMeta).sort(([a], [b]) => a.localeCompare(b)) : [];
  const clientEntries = Object.entries(clientMeta).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Environment and runtime parameters.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Client</h2>
        <dl className="bg-card rounded-card border border-border divide-y divide-border text-xs">
          {clientEntries.map(([key, value]) => (
            <div key={key} className="px-4 py-3 flex flex-wrap gap-2 justify-between">
              <dt className="text-muted-foreground font-mono">{key}</dt>
              <dd className="text-foreground font-mono break-all text-right">{String(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Server</h2>
        {isPending && <p className="text-xs text-muted-foreground">Loading…</p>}
        {isError && <p className="text-sm text-destructive">Could not load server metadata.</p>}
        {!isPending && !isError && serverEntries.length === 0 && (
          <p className="text-xs text-muted-foreground">No metadata returned.</p>
        )}
        {serverEntries.length > 0 && (
          <dl className="bg-card rounded-card border border-border divide-y divide-border text-xs">
            {serverEntries.map(([key, value]) => (
              <div key={key} className="px-4 py-3 flex flex-wrap gap-2 justify-between">
                <dt className="text-muted-foreground font-mono">{key}</dt>
                <dd className="text-foreground font-mono break-all text-right">{String(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
};

export default SettingsScreen;
