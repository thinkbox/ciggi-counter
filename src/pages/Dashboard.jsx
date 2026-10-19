// Home screen: log a ciggi, see how long since the last one, and how
// today compares with the daily limit.

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Calendar, CalendarRange, Clock, Package, Pencil, Plus, Target } from "lucide-react";
import {
  dashboardPeriodStats,
  formatElapsedBetween,
  formatElapsedLabel,
  formatLastCiggiAt,
  formatLocalDay,
  formatPaceClock,
  formatPackCost,
  formatWhen,
  goalForDay,
  lastCiggiOrTodayStart,
  latestCiggiToday,
  localDayBounds,
  nextCiggiPace,
  toDatetimeLocalValue,
} from "../logic.js";
import { postAllowingClose, sendJson } from "../api.js";
import { GoalDialog } from "../components/GoalDialog.jsx";
import { GoalRing } from "../components/GoalRing.jsx";
import { NewPackDialog } from "../components/NewPackDialog.jsx";
import { Button, Card, Dialog, Field, Input, Loading } from "../components/ui.jsx";
import {
  clearPackDraft,
  keepPackDraft,
  packDraftKept,
  releaseKeptDraft,
  takePackResume,
  writePackDraft,
} from "../packDraft.js";
import { useBrands, useCigarettes, useDailyGoals, usePacks, useRefresh } from "../queries.js";
import { useToast } from "../toast.jsx";

function reportError(toast, error, title) {
  if (error.cancelled) return;
  toast({ title, description: error.message, variant: "destructive" });
}

export function Dashboard() {
  const { toast } = useToast();
  const refresh = useRefresh();
  const [, navigate] = useLocation();
  const { data: cigarettes = [], isLoading } = useCigarettes();
  const { data: goalData } = useDailyGoals();
  const { data: packs = [] } = usePacks();
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const goals = goalData?.goals ?? [];
  const [packOpen, setPackOpen] = useState(false);

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [goalOpen, setGoalOpen] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);
  const [pastAt, setPastAt] = useState("");
  const [multiOpen, setMultiOpen] = useState(false);
  const [multiFrom, setMultiFrom] = useState("");
  const [multiTo, setMultiTo] = useState("");
  const [multiCount, setMultiCount] = useState("");
  const [multiIncludeFrom, setMultiIncludeFrom] = useState(false);
  const [multiIncludeTo, setMultiIncludeTo] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (takePackResume()) setPackOpen(true);
  }, []);

  useEffect(() => {
    if (packOpen) releaseKeptDraft();
  }, [packOpen]);

  const logNow = useMutation({
    mutationFn: () =>
      postAllowingClose("/api/cigarettes", { smokedAt: new Date().toISOString() }),
    onSuccess: () => {
      refresh.cigarettes();
      toast({ title: "Logged", description: "Ciggi recorded." });
    },
    onError: (error) => reportError(toast, error, "Couldn't log"),
  });

  const logPast = useMutation({
    mutationFn: (smokedAt) => postAllowingClose("/api/cigarettes", { smokedAt }),
    onSuccess: () => {
      refresh.cigarettes();
      setPastOpen(false);
      toast({ title: "Logged", description: "Past ciggi recorded." });
    },
    onError: (error) => reportError(toast, error, "Couldn't log"),
  });

  const logMulti = useMutation({
    mutationFn: (body) => postAllowingClose("/api/cigarettes/multi", body),
    onSuccess: () => {
      refresh.cigarettes();
      setMultiOpen(false);
      toast({ title: "Logged", description: "Ciggis recorded." });
    },
    onError: (error) => reportError(toast, error, "Invalid"),
  });

  const saveGoal = useMutation({
    mutationFn: (body) => sendJson("PUT", "/api/settings/daily-goal", body),
    onSuccess: (_data, body) => {
      refresh.goals();
      setGoalOpen(false);
      toast({ title: "Goal updated", description: `Daily limit set to ${body.dailyGoal}.` });
    },
    onError: (error) => reportError(toast, error, "Couldn't save"),
  });

  function openPast(next) {
    setPastOpen(next);
    if (next) setPastAt(toDatetimeLocalValue(new Date()));
  }

  function submitPast() {
    if (!pastAt) {
      toast({
        title: "Missing info",
        description: "Please set a date and time.",
        variant: "destructive",
      });
      return;
    }
    const when = new Date(pastAt);
    if (Number.isNaN(when.getTime())) {
      toast({
        title: "Invalid date",
        description: "Check the date and time.",
        variant: "destructive",
      });
      return;
    }
    logPast.mutate(when.toISOString());
  }

  function openMulti(next) {
    setMultiOpen(next);
    if (!next) return;
    setMultiFrom(toDatetimeLocalValue(lastCiggiOrTodayStart(cigarettes)));
    setMultiTo(toDatetimeLocalValue(new Date()));
    setMultiCount("");
    setMultiIncludeFrom(false);
    setMultiIncludeTo(true);
  }

  function submitMulti() {
    const count = parseInt(multiCount, 10);
    if (!multiFrom || !multiTo || Number.isNaN(count)) {
      toast({
        title: "Missing info",
        description: "Please enter from, to, and a count.",
        variant: "destructive",
      });
      return;
    }
    if (new Date(multiFrom) >= new Date(multiTo)) {
      toast({
        title: "Invalid",
        description: "From must be before To.",
        variant: "destructive",
      });
      return;
    }
    logMulti.mutate({
      from: new Date(multiFrom).toISOString(),
      to: new Date(multiTo).toISOString(),
      count,
      includeFrom: multiIncludeFrom,
      includeTo: multiIncludeTo,
    });
  }

  if (isLoading) return <Loading />;

  const now = new Date(nowMs);
  const goal = goalForDay(goals, formatLocalDay(now));
  const periods = dashboardPeriodStats(cigarettes, now);
  const remaining = goal !== null ? Math.max(goal - periods.today, 0) : null;
  const overBy = goal !== null && periods.today > goal ? periods.today - goal : 0;
  const bounds = localDayBounds(nowMs);
  const pace =
    goal != null
      ? nextCiggiPace({
          dailyGoal: goal,
          todayCount: periods.today,
          anchorAt: latestCiggiToday(cigarettes, nowMs) ?? bounds.dayStart,
          now: nowMs,
          dayEnd: bounds.dayEnd,
        })
      : null;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-8">
      <Card className="w-full">
        <div className="flex items-center gap-4 p-6">
          <div className="rounded-full bg-[hsl(var(--primary)/0.1)] p-3">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-1 items-start justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Time since last ciggi</p>
              <p className="font-tabular text-lg font-semibold" data-testid="text-elapsed">
                {formatElapsedLabel(cigarettes, nowMs)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last ciggi at</p>
              <p className="font-tabular text-lg font-semibold" data-testid="text-last-at">
                {formatLastCiggiAt(cigarettes)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {goal !== null ? (
        <Card className="w-full">
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Daily Goal</p>
              </div>
              <GoalDialog
                open={goalOpen}
                onOpenChange={setGoalOpen}
                initialDay={formatLocalDay(now)}
                goals={goals}
                emptyGoal="10"
                saving={saveGoal.isPending}
                onSave={(body) => saveGoal.mutate(body)}
                testId="button-edit-goal"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
              >
                <Pencil className="h-3.5 w-3.5" />
              </GoalDialog>
            </div>
            <div className="flex items-center gap-6">
              <GoalRing current={periods.today} goal={goal} />
              <div className="flex-1 space-y-2">
                {overBy > 0 ? (
                  <p className="text-sm font-medium text-red-500" data-testid="text-goal-status">
                    {overBy} over limit
                  </p>
                ) : remaining === 0 ? (
                  <p className="text-sm font-medium text-amber-500" data-testid="text-goal-status">
                    At your limit
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-goal-status">
                    {remaining} remaining today
                  </p>
                )}
                {pace ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {pace.phase === "ready" ? "Since pace" : "Next ciggi in"}
                    </p>
                    <p className="font-tabular text-lg font-semibold" data-testid="text-next-ciggi">
                      {formatPaceClock(
                        pace.phase === "ready" ? pace.overtimeMs : pace.remainingMs,
                        pace.phase === "ready",
                      )}
                    </p>
                    <div
                      className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
                      data-testid="progress-goal"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(pace.bar * 100)}
                    >
                      <div
                        className="h-full"
                        style={{ width: `${pace.bar * 100}%`, background: pace.fill }}
                      />
                    </div>
                  </div>
                ) : null}
                <p className="font-tabular text-xs text-muted-foreground">
                  {periods.today} / {goal} today
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="w-full">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Set a daily goal</p>
                <p className="text-xs text-muted-foreground">Track your progress cutting down</p>
              </div>
            </div>
            <GoalDialog
              open={goalOpen}
              onOpenChange={setGoalOpen}
              initialDay={formatLocalDay(now)}
              goals={goals}
              emptyGoal="10"
              saving={saveGoal.isPending}
              onSave={(body) => saveGoal.mutate(body)}
              testId="button-set-goal"
            >
              Set Goal
            </GoalDialog>
          </div>
        </Card>
      )}

      <div className="log-ciggi-row">
        <div>
          <Button
            size="lg"
            className="h-20 w-full whitespace-normal rounded-xl px-2 text-center text-lg leading-tight"
            onClick={() => logNow.mutate()}
            disabled={logNow.isPending}
            data-testid="button-log-ciggi"
          >
            <Plus className="h-6 w-6" />
            {logNow.isPending ? "Logging..." : "Log a Ciggi"}
          </Button>
        </div>
        <div>
          <Button
            size="lg"
            variant="secondary"
            className="h-20 w-full whitespace-normal rounded-xl px-2 text-center text-lg leading-tight"
            data-testid="button-log-past"
            onClick={() => openPast(true)}
          >
            Log Past
          </Button>
          <Dialog open={pastOpen} onOpenChange={openPast} title="Log a Past Ciggi">
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Date and time">
                <Input
                  type="datetime-local"
                  value={pastAt}
                  onChange={(event) => setPastAt(event.target.value)}
                  data-testid="input-log-past"
                />
              </Field>
              <Button
                onClick={submitPast}
                disabled={logPast.isPending}
                data-testid="button-confirm-past"
              >
                {logPast.isPending ? "Logging..." : "Log Ciggi"}
              </Button>
            </div>
          </Dialog>
        </div>
        <div>
          <Button
            size="lg"
            variant="outline"
            className="h-20 w-full whitespace-normal rounded-xl px-2 text-center text-lg leading-tight"
            data-testid="button-log-multi"
            onClick={() => openMulti(true)}
          >
            Log Multi
          </Button>
          <Dialog open={multiOpen} onOpenChange={openMulti} title="Log Multiple Ciggis">
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">From</span>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={multiIncludeFrom}
                      onChange={(event) => setMultiIncludeFrom(event.target.checked)}
                      data-testid="input-multi-include-from"
                    />
                    Include at from
                  </label>
                </div>
                <Input
                  type="datetime-local"
                  value={multiFrom}
                  onChange={(event) => setMultiFrom(event.target.value)}
                  data-testid="input-multi-from"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">To</span>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={multiIncludeTo}
                      onChange={(event) => setMultiIncludeTo(event.target.checked)}
                      data-testid="input-multi-include-to"
                    />
                    Include at to
                  </label>
                </div>
                <Input
                  type="datetime-local"
                  value={multiTo}
                  onChange={(event) => setMultiTo(event.target.value)}
                  data-testid="input-multi-to"
                />
              </div>
              <Field label="Number of ciggis">
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={multiCount}
                  onChange={(event) => setMultiCount(event.target.value)}
                  data-testid="input-multi-count"
                />
              </Field>
              <Button
                onClick={submitMulti}
                disabled={logMulti.isPending}
                data-testid="button-confirm-multi"
              >
                {logMulti.isPending ? "Logging..." : "Log Ciggis"}
              </Button>
            </div>
          </Dialog>
        </div>
      </div>

      {packs[0] ? (
        <Card className="w-full" data-testid="card-open-pack">
          <div className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-[hsl(var(--primary)/0.1)] p-3">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Open pack</p>
              <p className="truncate font-medium" data-testid="text-open-pack">
                {packs[0].brand} · {packs[0].size}
              </p>
              <p className="font-tabular text-sm text-muted-foreground">
                {packs[0].smoked} / {packs[0].size} smoked · {formatPackCost(packs[0].costCents)}
              </p>
              <p className="font-tabular text-sm text-muted-foreground">
                Opened {formatWhen(packs[0].openedAt, "EEE d MMM, h:mm a")} ·{" "}
                {formatElapsedBetween(packs[0].openedAt, new Date(nowMs).toISOString())}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Button
        variant="outline"
        className="h-14 w-full rounded-xl"
        data-testid="button-new-pack"
        onClick={() => {
          clearPackDraft();
          setPackOpen(true);
        }}
      >
        New Pack
      </Button>
      <NewPackDialog
        open={packOpen}
        onOpenChange={(next) => {
          if (!next && !packDraftKept()) clearPackDraft();
          setPackOpen(next);
        }}
        cigarettes={cigarettes}
        packs={packs}
        brands={brands}
        brandsLoading={brandsLoading}
        onReview={(draft) => {
          writePackDraft(draft);
          keepPackDraft();
          setPackOpen(false);
          navigate("/packs/review");
        }}
        onSaved={() => {
          refresh.cigarettes();
          refresh.brands();
        }}
      />

      <div className="grid w-full grid-cols-3 gap-3">
        <CountCard testId="text-today-count" label="Today" value={periods.today} icon={Calendar} />
        <CountCard
          testId="text-week-count"
          label="This Week"
          value={periods.thisWeek}
          icon={CalendarRange}
        />
        <CountCard
          testId="text-last-week-count"
          label="Last Week"
          value={periods.lastWeek}
          icon={CalendarRange}
        />
        {periods.recentDays.map((day, index) => {
          const dayGoal = goalForDay(goals, day.key);
          const over = dayGoal != null && day.count > dayGoal;
          return (
            <Card key={day.key}>
              <div className="p-4 text-center">
                <Calendar className="mx-auto mb-2 h-4 w-4 text-muted-foreground" />
                <p
                  className={`font-tabular text-2xl font-bold ${over ? "text-red-500" : ""}`}
                  data-testid={`text-day-count-${index + 1}`}
                >
                  {day.count}
                </p>
                <p className="text-xs text-muted-foreground">{day.label}</p>
                {dayGoal != null ? (
                  <p
                    className="font-tabular text-xs text-muted-foreground"
                    data-testid={`text-day-goal-${index + 1}`}
                  >
                    goal {dayGoal}
                  </p>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CountCard({ label, value, testId, icon: Icon }) {
  return (
    <Card>
      <div className="p-4 text-center">
        <Icon className="mx-auto mb-2 h-4 w-4 text-muted-foreground" />
        <p className="font-tabular text-2xl font-bold" data-testid={testId}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
