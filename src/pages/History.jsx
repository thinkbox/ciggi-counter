// One day of the log at a time, newest day first. Arrows move to the
// neighbouring day. A long day can be split into pages of 10, 20, or 50.

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { History as HistoryIcon, Pencil, Plus, Trash2 } from "lucide-react";
import {
  dateTimeInputs,
  formatElapsedBetween,
  formatHistoryNavLabel,
  formatLocalDay,
  formatWhen,
  goalForDay,
  historyNavTargets,
  nearestDayKey,
  pageIndexForId,
  paginateHistory,
  suggestedHistoryAdd,
} from "../logic.js";
import { postAllowingClose, sendJson } from "../api.js";
import { GoalDialog } from "../components/GoalDialog.jsx";
import { Button, Card, Dialog, Field, Input, Loading } from "../components/ui.jsx";
import { useCigarettes, useDailyGoals, useRefresh } from "../queries.js";
import { useToast } from "../toast.jsx";

const PAGE_SIZE_KEY = "cigicounter-history-page-size";

function readPageSize() {
  try {
    const saved = localStorage.getItem(PAGE_SIZE_KEY);
    if (saved === "10" || saved === "20" || saved === "50" || saved === "all") return saved;
  } catch {
    // Storage can throw in private mode. Fall through to the default.
  }
  return "all";
}

function dayHeading(dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return formatWhen(new Date(year, month - 1, day, 12).toISOString(), "EEE d MMM yyyy");
}

function reportError(toast, error, title) {
  if (error.cancelled) return;
  toast({ title, description: error.message, variant: "destructive" });
}

export function HistoryPage() {
  const { toast } = useToast();
  const refresh = useRefresh();
  const { data: cigarettes = [], isLoading } = useCigarettes();
  const { data: goalData } = useDailyGoals();
  const goals = goalData?.goals ?? [];

  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addTime, setAddTime] = useState("");
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [pageSize, setPageSize] = useState(readPageSize);
  const [pageIndex, setPageIndex] = useState(0);
  const [goalOpen, setGoalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const allDays = paginateHistory({
    cigarettes,
    dayKey: null,
    pageSize: "all",
    pageIndex: 0,
  }).days;

  // If the chosen day is not in the list yet (a save just landed, or the
  // last ciggi on that day was removed), show the nearest day. This stays
  // a display choice. Writing it back into state would race the refetch
  // and jump away from a day we just added.
  let activeDayKey = selectedDayKey;
  if (selectedDayKey && allDays.length && !allDays.some((day) => day.key === selectedDayKey)) {
    activeDayKey = nearestDayKey(allDays, selectedDayKey);
  }

  const page = paginateHistory({
    cigarettes,
    dayKey: activeDayKey,
    pageSize,
    pageIndex,
  });
  const nav = historyNavTargets(page.days, page.dayKey);

  const gaps = useMemo(() => {
    const sorted = [...cigarettes].sort(
      (a, b) => new Date(b.smokedAt).getTime() - new Date(a.smokedAt).getTime(),
    );
    const map = new Map();
    sorted.forEach((cigarette, index) => {
      map.set(
        cigarette.id,
        index < sorted.length - 1
          ? formatElapsedBetween(sorted[index + 1].smokedAt, cigarette.smokedAt)
          : "— ",
      );
    });
    return map;
  }, [cigarettes]);

  const saveGoal = useMutation({
    mutationFn: (body) => sendJson("PUT", "/api/settings/daily-goal", body),
    onSuccess: (_data, body) => {
      refresh.goals();
      setGoalOpen(false);
      toast({ title: "Goal updated", description: `Daily limit set to ${body.dailyGoal}.` });
    },
    onError: (error) => reportError(toast, error, "Couldn't save"),
  });

  const remove = useMutation({
    mutationFn: (id) => sendJson("DELETE", `/api/cigarettes/${id}`),
    onSuccess: () => {
      refresh.cigarettes();
      toast({ title: "Deleted", description: "Record removed." });
    },
    onError: (error) => reportError(toast, error, "Couldn't delete"),
  });

  const add = useMutation({
    mutationFn: async (smokedAt) => {
      const res = await postAllowingClose("/api/cigarettes", { smokedAt });
      return res.json();
    },
    onSuccess: (created) => {
      refresh.putCigarette(created);
      refresh.cigarettes();
      setAddDate("");
      setAddTime("");
      setAddOpen(false);
      toast({ title: "Added", description: "Past ciggi recorded." });
      // The server stores UTC. The day we show is the local calendar day.
      const key = formatLocalDay(new Date(created.smokedAt));
      const onDay = [...cigarettes, created]
        .filter((item) => formatLocalDay(new Date(item.smokedAt)) === key)
        .sort((a, b) => new Date(b.smokedAt) - new Date(a.smokedAt));
      setSelectedDayKey(key);
      setPageIndex(pageIndexForId(onDay, created.id, pageSize));
    },
    onError: (error) => reportError(toast, error, "Couldn't add"),
  });

  const edit = useMutation({
    mutationFn: async ({ id, smokedAt }) => {
      const res = await postAllowingClose(`/api/cigarettes/${id}`, { smokedAt }, "PUT");
      return res.json();
    },
    onSuccess: (updated) => {
      refresh.putCigarette(updated);
      refresh.cigarettes();
      setEditOpen(false);
      toast({ title: "Updated", description: "Ciggi time saved." });
      setSelectedDayKey(formatLocalDay(new Date(updated.smokedAt)));
      setPageIndex(0);
    },
    onError: (error) => reportError(toast, error, "Couldn't update"),
  });

  function openAdd(next) {
    if (next) {
      const day = page.dayKey || formatLocalDay(new Date());
      const suggested = suggestedHistoryAdd({
        dayKey: day,
        cigarettes,
        dailyGoal: goalForDay(goals, day),
        now: new Date(),
      });
      setAddDate(suggested.date);
      setAddTime(suggested.time);
    }
    setAddOpen(next);
  }

  function submitAdd() {
    if (!addDate || !addTime) {
      toast({
        title: "Missing info",
        description: "Please set both date and time.",
        variant: "destructive",
      });
      return;
    }
    const when = new Date(`${addDate}T${addTime}`);
    if (Number.isNaN(when.getTime())) {
      toast({
        title: "Invalid date",
        description: "Check date and time format.",
        variant: "destructive",
      });
      return;
    }
    add.mutate(when.toISOString());
  }

  function openEdit(cigarette) {
    const fields = dateTimeInputs(cigarette.smokedAt);
    setEditId(cigarette.id);
    setEditDate(fields.date);
    setEditTime(fields.time);
    setEditOpen(true);
  }

  function submitEdit() {
    if (!editDate || !editTime) {
      toast({
        title: "Missing info",
        description: "Please set both date and time.",
        variant: "destructive",
      });
      return;
    }
    const when = new Date(`${editDate}T${editTime}`);
    if (Number.isNaN(when.getTime())) {
      toast({
        title: "Invalid date",
        description: "Check date and time format.",
        variant: "destructive",
      });
      return;
    }
    edit.mutate({ id: editId, smokedAt: when.toISOString() });
  }

  function changePageSize(value) {
    setPageSize(value);
    setPageIndex(0);
    try {
      localStorage.setItem(PAGE_SIZE_KEY, value);
    } catch {
      // The choice still applies for this visit if storage is blocked.
    }
  }

  if (isLoading) return <Loading />;

  const dayGoal = page.dayKey ? goalForDay(goals, page.dayKey) : null;
  const countLabel = page.dayCount === 1 ? "1 ciggi" : `${page.dayCount} ciggis`;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">History</h1>
        <Button size="sm" data-testid="button-add-past" onClick={() => openAdd(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Ciggi
        </Button>
        <Dialog open={addOpen} onOpenChange={openAdd} title="Add a Ciggi">
          <div className="mt-4 flex flex-col gap-4">
            <Field label="Date">
              <Input
                type="date"
                value={addDate}
                onChange={(event) => setAddDate(event.target.value)}
                data-testid="input-add-date"
              />
            </Field>
            <Field label="Time">
              <Input
                type="time"
                value={addTime}
                onChange={(event) => setAddTime(event.target.value)}
                data-testid="input-add-time"
              />
            </Field>
            <Button onClick={submitAdd} disabled={add.isPending} data-testid="button-confirm-add">
              {add.isPending ? "Adding..." : "Add Ciggi"}
            </Button>
          </div>
        </Dialog>
      </div>

      {cigarettes.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HistoryIcon className="mb-4 h-10 w-10 text-muted-foreground opacity-50" />
            <p className="font-medium text-muted-foreground">No ciggis logged yet</p>
            <p className="mt-1 text-sm text-muted-foreground opacity-70">
              Go to the dashboard and log your first one.
            </p>
          </div>
        </Card>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              className={nav.newer ? "min-w-16" : "invisible min-w-16"}
              disabled={!nav.newer}
              data-testid="button-history-next-day"
              onClick={() => {
                setSelectedDayKey(nav.newer);
                setPageIndex(0);
              }}
            >
              {nav.newer ? formatHistoryNavLabel(nav.newer) : ""}
            </Button>
            <div className="text-center">
              <p className="font-tabular font-medium" data-testid="text-history-day">
                {dayHeading(page.dayKey)}
              </p>
              <p
                className="font-tabular text-sm text-muted-foreground"
                data-testid="text-history-day-count"
              >
                {dayGoal == null ? countLabel : `${countLabel} · goal ${dayGoal}`}
              </p>
              <GoalDialog
                open={goalOpen}
                onOpenChange={setGoalOpen}
                initialDay={page.dayKey}
                goals={goals}
                emptyGoal=""
                saving={saveGoal.isPending}
                onSave={(body) => saveGoal.mutate(body)}
                testId="button-history-goal"
                variant="ghost"
                className="mt-1 h-7"
              >
                Set goal
              </GoalDialog>
              <label className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                Per page
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                  value={pageSize}
                  data-testid="select-history-page-size"
                  onChange={(event) => changePageSize(event.target.value)}
                >
                  <option value="all">All</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </label>
            </div>
            <Button
              size="sm"
              variant="outline"
              className={nav.older ? "min-w-16" : "invisible min-w-16"}
              disabled={!nav.older}
              data-testid="button-history-prev-day"
              onClick={() => {
                setSelectedDayKey(nav.older);
                setPageIndex(0);
              }}
            >
              {nav.older ? formatHistoryNavLabel(nav.older) : ""}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {page.entries.map((cigarette) => (
              <Card key={cigarette.id}>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-tabular font-medium" data-testid={`text-date-${cigarette.id}`}>
                      {formatWhen(cigarette.smokedAt, "EEE d MMM yyyy")}
                    </p>
                    <p
                      className="font-tabular text-sm text-muted-foreground"
                      data-testid={`text-time-${cigarette.id}`}
                    >
                      {formatWhen(cigarette.smokedAt, "h:mm a")}
                    </p>
                    <p
                      className="font-tabular text-sm text-primary"
                      data-testid={`text-elapsed-${cigarette.id}`}
                    >
                      {gaps.get(cigarette.id)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit ciggi"
                      data-testid={`button-edit-${cigarette.id}`}
                      onClick={() => openEdit(cigarette)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete ciggi"
                      disabled={remove.isPending}
                      data-testid={`button-delete-${cigarette.id}`}
                      onClick={() => remove.mutate(cigarette.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {page.showPager ? (
            <div className="mt-4 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                disabled={page.pageIndex <= 0}
                data-testid="button-history-prev-page"
                onClick={() => setPageIndex(page.pageIndex - 1)}
              >
                Previous
              </Button>
              <p className="font-tabular text-sm text-muted-foreground" data-testid="text-history-page">
                Page {page.pageIndex + 1} of {page.pageCount}
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={page.pageIndex >= page.pageCount - 1}
                data-testid="button-history-next-page"
                onClick={() => setPageIndex(page.pageIndex + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}

          <Dialog open={editOpen} onOpenChange={setEditOpen} title="Edit Ciggi">
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Date">
                <Input
                  type="date"
                  value={editDate}
                  onChange={(event) => setEditDate(event.target.value)}
                  data-testid="input-edit-date"
                />
              </Field>
              <Field label="Time">
                <Input
                  type="time"
                  step="1"
                  value={editTime}
                  onChange={(event) => setEditTime(event.target.value)}
                  data-testid="input-edit-time"
                />
              </Field>
              <Button onClick={submitEdit} disabled={edit.isPending} data-testid="button-confirm-edit">
                {edit.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </Dialog>
        </div>
      )}
    </div>
  );
}
