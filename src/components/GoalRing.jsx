// The circular "3 of 10" picture on the daily goal card.

export function GoalRing({ current, goal }) {
  const ratio = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (ratio / 100) * circumference;
  const over = current > goal;
  const atLimit = current === goal;
  let stroke = "hsl(var(--primary))";
  let text = "text-foreground";
  if (over) {
    stroke = "hsl(0 72% 45%)";
    text = "text-red-500";
  } else if (atLimit || ratio >= 80) {
    stroke = "hsl(35 80% 50%)";
    text = "text-amber-500";
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-tabular text-2xl font-bold ${text}`} data-testid="text-goal-current">
          {current}
        </span>
        <span className="text-xs text-muted-foreground">of {goal}</span>
      </div>
    </div>
  );
}
