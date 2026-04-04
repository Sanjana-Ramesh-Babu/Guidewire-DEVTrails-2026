import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import StatusBadge from "@/components/rider/StatusBadge";
import { insurGigApi } from "@/lib/api";

const AnalystScreen = () => {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: queue = [], isError, isPending } = useQuery({
    queryKey: ["analyst-queue"],
    queryFn: () => insurGigApi.opsAnalystQueue(),
    refetchInterval: 20_000,
  });

  const actMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      insurGigApi.opsAnalystAction(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analyst-queue"] });
      qc.invalidateQueries({ queryKey: ["ops-payouts"] });
      qc.invalidateQueries({ queryKey: ["ops-overview"] });
      setExpanded(null);
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analyst Review Queue</h1>
        <p className="text-sm text-muted-foreground">
          {isPending ? "Loading…" : `${queue.length} claims pending analyst review`}
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Could not load the analyst queue from the API.</p>
      )}

      <div className="bg-card rounded-card border border-border overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="text-muted-foreground border-b border-border bg-secondary">
              <th className="text-left px-4 py-2.5 font-medium">Claim</th>
              <th className="text-left px-4 py-2.5 font-medium">Rider</th>
              <th className="text-left px-4 py-2.5 font-medium">Trigger</th>
              <th className="text-left px-4 py-2.5 font-medium">Zone</th>
              <th className="text-left px-4 py-2.5 font-medium">TCS</th>
              <th className="text-left px-4 py-2.5 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {!isPending && !isError && queue.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No claims are currently routed for analyst review (status processing, routing analyst_review).
                </td>
              </tr>
            )}
            {queue.map((c) => {
              const id = String(c.claim_public_id);
              const open = expanded === id;
              return (
                <Fragment key={id}>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 font-mono text-[10px] text-foreground">{id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-foreground">{String(c.rider)}</td>
                    <td className="px-4 py-3 text-foreground">{String(c.trigger)}</td>
                    <td className="px-4 py-3 text-foreground">{String(c.zone)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status="armed">{String(c.tcs_score)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : id)}
                        className="px-3 py-1 rounded-button bg-primary text-primary-foreground text-[10px] font-medium"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={6} className="bg-secondary px-6 py-5">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <h4 className="text-sm font-semibold text-foreground">Signals (summary)</h4>
                            {(c.signals_plain as Array<Record<string, unknown>>)?.map((s) => (
                              <p key={String(s.name)}>
                                <span className="font-medium text-foreground">{String(s.name)}</span>:{" "}
                                {s.flag ? "flag" : "ok"}
                              </p>
                            ))}
                            {c.ring_flagged && (
                              <p className="text-destructive font-medium">Ring detection flagged this batch.</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => actMut.mutate({ id, action: "approve" })}
                              className="px-4 py-2 rounded-button bg-accent text-accent-foreground text-xs font-medium"
                            >
                              Approve — mark legitimate (+10 trust bonus)
                            </button>
                            <button
                              type="button"
                              onClick={() => actMut.mutate({ id, action: "reject" })}
                              className="px-4 py-2 rounded-button bg-destructive text-destructive-foreground text-xs font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalystScreen;
