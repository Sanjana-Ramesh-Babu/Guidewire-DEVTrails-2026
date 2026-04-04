import { useQuery } from "@tanstack/react-query";
import { insurGigApi } from "@/lib/api";

function formatCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const RidersScreen = () => {
  const { data: riders = [], isError, isPending } = useQuery({
    queryKey: ["ops-riders"],
    queryFn: () => insurGigApi.opsRiders(),
    refetchInterval: 45_000,
  });

  const keys =
    riders.length > 0
      ? Object.keys(riders[0]).filter((k) => k !== "upi_id")
      : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Riders</h1>
        <p className="text-sm text-muted-foreground">
          {isPending ? "Loading…" : `${riders.length} registered`}
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Could not load riders from the API.</p>
      )}

      {!isPending && !isError && riders.length === 0 && (
        <p className="text-sm text-muted-foreground">No riders in the database yet.</p>
      )}

      {riders.length > 0 && (
        <div className="bg-card rounded-card border border-border overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-secondary">
                {keys.map((k) => (
                  <th key={k} className="text-left px-3 py-2.5 font-medium capitalize">
                    {k.replaceAll("_", " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riders.map((row) => (
                <tr key={String(row.public_id)} className="border-b border-border last:border-0">
                  {keys.map((k) => (
                    <td key={k} className="px-3 py-2.5 text-foreground whitespace-nowrap max-w-[240px] truncate">
                      {formatCell(row[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RidersScreen;
