// Shows every ciggi since the previous pack was opened, with the ones
// about to be added highlighted. Nothing is saved until Add is pressed.

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ciggisInWindow, formatElapsedBetween, formatWhen, placeMissed } from "../logic.js";
import { sendJson } from "../api.js";
import {
  clearPackDraft,
  readPackDraft,
  resumePackDraft,
} from "../packDraft.js";
import { Button, Card, Loading } from "../components/ui.jsx";
import { useCigarettes, usePacks, useRefresh } from "../queries.js";
import { useToast } from "../toast.jsx";

function reportError(toast, error) {
  if (error.cancelled) return;
  toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
}

export function PackReviewPage() {
  const { toast } = useToast();
  const refresh = useRefresh();
  const [, navigate] = useLocation();
  const [draft] = useState(() => readPackDraft());
  const { data: cigarettes = [], isLoading: cigarettesLoading } = useCigarettes();
  const { data: packs = [], isLoading: packsLoading } = usePacks();

  const ready = draft?.brandName && draft.openedAt && Number.isInteger(draft.toAdd) && draft.toAdd > 0;

  useEffect(() => {
    if (!ready) navigate("/");
  }, [ready, navigate]);

  const previous = packs[0] && new Date(packs[0].openedAt).getTime() < new Date(draft?.openedAt).getTime()
    ? packs[0]
    : null;

  const proposals = useMemo(() => {
    if (!ready || !previous) return [];
    const smokedAts = cigarettes.map((cigarette) => cigarette.smokedAt);
    return placeMissed({
      inWindow: ciggisInWindow(smokedAts, previous.openedAt, draft.openedAt),
      existing: smokedAts,
      windowStart: previous.openedAt,
      windowEnd: draft.openedAt,
      count: draft.toAdd,
    });
  }, [cigarettes, draft, previous, ready]);

  const rows = useMemo(() => {
    if (!previous || !draft?.openedAt) return [];
    const existing = ciggisInWindow(
      cigarettes.map((cigarette) => cigarette.smokedAt),
      previous.openedAt,
      draft.openedAt,
    ).map((smokedAt) => ({
      id: cigarettes.find((cigarette) => cigarette.smokedAt === smokedAt)?.id ?? smokedAt,
      smokedAt,
      adding: false,
    }));
    const adding = proposals.map((smokedAt, index) => ({
      id: `adding-${index}`,
      smokedAt,
      adding: true,
    }));
    return [...existing, ...adding].sort(
      (left, right) => new Date(right.smokedAt).getTime() - new Date(left.smokedAt).getTime(),
    );
  }, [cigarettes, draft, previous, proposals]);

  const gaps = useMemo(() => {
    const map = new Map();
    rows.forEach((row, index) => {
      const older = rows[index + 1];
      map.set(
        row.id,
        older ? formatElapsedBetween(older.smokedAt, row.smokedAt) : "— ",
      );
    });
    return map;
  }, [rows]);

  const save = useMutation({
    mutationFn: () =>
      sendJson("POST", "/api/packs", {
        brand: draft.brandName,
        size: draft.size,
        costCents: draft.costCents,
        openedAt: draft.openedAt,
        missed: proposals,
        toAdd: draft.toAdd,
      }),
    onSuccess: () => {
      clearPackDraft();
      refresh.cigarettes();
      refresh.brands();
      const added = proposals.length;
      toast({
        title: "Pack opened",
        description:
          added === 0
            ? `${draft.brandName} opened. No room to add the missed ciggis.`
            : `${draft.brandName} opened, with ${added} missed ${added === 1 ? "ciggi" : "ciggis"} added.`,
      });
      navigate("/");
    },
    onError: (error) => reportError(toast, error),
  });

  function goBack() {
    resumePackDraft();
    navigate("/");
  }

  if (!ready) return null;
  if (cigarettesLoading || packsLoading) return <Loading />;
  if (!previous) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="text-sm text-muted-foreground">That pack is no longer the latest one.</p>
        <Button className="mt-4" variant="outline" onClick={goBack}>
          Back
        </Button>
      </div>
    );
  }

  const addLabel =
    proposals.length === 0
      ? "Open pack"
      : proposals.length === 1
        ? "Add 1 ciggi and open pack"
        : `Add ${proposals.length} ciggis and open pack`;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Missed ciggis</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-review-pack">
            {draft.brandName} · {draft.size} · opened {formatWhen(draft.openedAt, "EEE d MMM, h:mm a")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={goBack} data-testid="button-pack-back">
          Back
        </Button>
      </div>

      {proposals.length < draft.toAdd ? (
        <p className="mb-4 text-sm text-amber-500" data-testid="text-review-short">
          Room for {proposals.length} of the {draft.toAdd} you wanted to add. The rest won't be logged.
        </p>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">
          Highlighted cards are the ciggis that will be added.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <Card
            key={row.id}
            className={row.adding ? "ring-2 ring-primary bg-[hsl(var(--primary)/0.12)]" : ""}
            data-testid={row.adding ? "card-review-adding" : `card-review-${row.id}`}
          >
            <div className="p-4">
              {row.adding ? (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  Adding
                </p>
              ) : null}
              <p className="font-tabular font-medium">{formatWhen(row.smokedAt, "EEE d MMM yyyy")}</p>
              <p className="font-tabular text-sm text-muted-foreground">
                {formatWhen(row.smokedAt, "h:mm a")}
              </p>
              <p className="font-tabular text-sm text-primary">{gaps.get(row.id)}</p>
            </div>
          </Card>
        ))}
      </div>

      <Button
        className="mt-6 w-full"
        onClick={() => save.mutate()}
        disabled={save.isPending}
        data-testid="button-pack-save"
      >
        {save.isPending ? "Saving..." : addLabel}
      </Button>
    </div>
  );
}
