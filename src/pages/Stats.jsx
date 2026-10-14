// Totals, a 30-day chart, and this period compared with the one before it.

import { BarChart3, Target, TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  dailyChartPoints,
  formatLocalDay,
  goalForDay,
  periodGoalSummary,
  summarizeStats,
} from "../logic.js";
import { Card, Loading } from "../components/ui.jsx";
import { useCigarettes, useDailyGoals } from "../queries.js";

function comparisonCaption(label) {
  if (label === "Today") return "Yesterday";
  return label.replace("This", "Last");
}

function DiffBadge({ diff }) {
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-xs text-white">
        <TrendingUp className="h-3 w-3" />+{diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-xs text-white">
        <TrendingDown className="h-3 w-3" />
        {diff}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
      <Minus className="h-3 w-3" />0
    </span>
  );
}

function Last30Days({ cigarettes, goals }) {
  const points = dailyChartPoints(cigarettes, goals, 30);
  const peak = Math.max(...points.map((point) => Math.max(point.count, point.goal ?? 0)), 1);

  return (
    <Card className="mb-6">
      <div className="flex items-center gap-2 px-6 pt-6 pb-2 text-base font-semibold">
        <BarChart3 className="h-4 w-4" />
        Last 30 Days
      </div>
      <div className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, Math.ceil(peak * 1.15)]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
                    <p className="text-xs text-muted-foreground">{point.fullDate}</p>
                    <p className="font-tabular text-sm font-bold">{point.count} ciggis</p>
                    {point.goal != null ? (
                      <p className="font-tabular text-xs text-muted-foreground">Goal: {point.goal}</p>
                    ) : null}
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={14}>
              {points.map((point) => (
                <Cell
                  key={point.fullDate}
                  fill={
                    point.goal != null && point.count > point.goal
                      ? "hsl(0 72% 45%)"
                      : "hsl(var(--primary))"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function GoalVsActual({ goals, stats }) {
  const now = new Date();
  const rows = [
    { label: "Today", actual: stats.today, start: now, end: now },
    { label: "This Week", actual: stats.thisWeek, start: startOfWeekMonday(now), end: now },
    { label: "This Month", actual: stats.thisMonth, start: startOfMonth(now), end: now },
    { label: "This Year", actual: stats.thisYear, start: startOfYear(now), end: now },
  ];

  return (
    <Card className="mb-6">
      <div className="flex items-center gap-2 px-6 pt-6 pb-3 text-base font-semibold">
        <Target className="h-4 w-4" />
        Goal vs Actual
      </div>
      <div className="divide-y divide-border">
        {rows.map((row) => {
          const summary = periodGoalSummary(goals, row.start, row.end);
          const showRatio = summary.budget > 0;
          const over = showRatio && row.actual > summary.budget;
          const width = showRatio ? Math.min((row.actual / summary.budget) * 100, 100) : 0;
          const gapId = row.label.replace(/\s/g, "-").toLowerCase();
          return (
            <div key={row.label} className="px-6 py-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{row.label}</p>
                <div className="flex items-center gap-2">
                  <span className={`font-tabular text-sm font-bold ${over ? "text-red-500" : ""}`}>
                    {row.actual}
                  </span>
                  {showRatio ? (
                    <span className="font-tabular text-xs text-muted-foreground">
                      / {summary.budget}
                    </span>
                  ) : null}
                  {over ? (
                    <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs text-white">
                      +{row.actual - summary.budget}
                    </span>
                  ) : null}
                </div>
              </div>
              {summary.daysWithoutGoal > 0 ? (
                <p className="mb-2 text-xs text-muted-foreground" data-testid={`text-goal-gap-${gapId}`}>
                  No goal for {summary.daysWithoutGoal}
                  {summary.daysWithoutGoal === 1 ? " day" : " days"}
                </p>
              ) : null}
              {showRatio ? (
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${width}%`, background: over ? "hsl(0 72% 45%)" : undefined }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function startOfWeekMonday(date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const daysSinceMonday = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - daysSinceMonday);
  return day;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

const BREAKDOWN = [
  ["Today", "today"],
  ["Yesterday", "yesterday"],
  ["This Week", "thisWeek"],
  ["Last Week", "lastWeek"],
  ["This Month", "thisMonth"],
  ["Last Month", "lastMonth"],
  ["This Year", "thisYear"],
  ["Last Year", "lastYear"],
  ["All Time", "total"],
];

export function StatsPage() {
  const { data: cigarettes = [], isLoading } = useCigarettes();
  const { data: goalData } = useDailyGoals();
  const goals = goalData?.goals ?? [];

  if (isLoading) return <Loading />;

  const todayGoal = goalForDay(goals, formatLocalDay(new Date()));

  if (cigarettes.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 text-xl font-bold">Stats</h1>
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="mb-4 h-10 w-10 text-muted-foreground opacity-50" />
            <p className="font-medium text-muted-foreground">No data yet</p>
            <p className="mt-1 text-sm text-muted-foreground opacity-70">
              Start logging ciggis to see your stats.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const stats = summarizeStats(cigarettes);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Stats</h1>
      <Card className="mb-6">
        <div className="p-6 text-center">
          <p className="mb-1 text-sm text-muted-foreground">Total Ciggis</p>
          <p className="font-tabular text-4xl font-bold" data-testid="text-total">
            {stats.total}
          </p>
        </div>
      </Card>
      <Last30Days cigarettes={cigarettes} goals={goals} />
      {todayGoal !== null ? <GoalVsActual goals={goals} stats={stats} /> : null}
      <Card className="mb-6">
        <div className="flex items-center gap-2 px-6 pt-6 pb-3 text-base font-semibold">
          <BarChart3 className="h-4 w-4" />
          Comparisons
        </div>
        <div className="divide-y divide-border">
          {stats.comparisons.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-6 py-4"
              data-testid={`row-comparison-${row.label.replace(/\s/g, "-").toLowerCase()}`}
            >
              <div>
                <p className="text-sm font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">vs {comparisonCaption(row.label)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-tabular font-bold">{row.current}</p>
                  <p className="font-tabular text-xs text-muted-foreground">{row.previous}</p>
                </div>
                <DiffBadge diff={row.diff} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mb-6">
        <div className="px-6 pt-6 pb-3 text-base font-semibold">Period Breakdown</div>
        <div className="divide-y divide-border">
          {BREAKDOWN.map(([label, key]) => (
            <div key={label} className="flex items-center justify-between px-6 py-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="font-tabular font-bold">{stats[key]}</p>
            </div>
          ))}
        </div>
      </Card>
      {stats.averages.length > 0 ? (
        <Card>
          <div className="flex items-center gap-2 px-6 pt-6 pb-3 text-base font-semibold">
            <TrendingUp className="h-4 w-4" />
            Averages
          </div>
          <div className="divide-y divide-border">
            {stats.averages.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-6 py-3"
                data-testid={`row-average-${row.label.replace(/\s/g, "-").toLowerCase()}`}
              >
                <p className="text-sm text-muted-foreground">{row.label}</p>
                <p className="font-tabular font-bold">{row.value}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
