// Dialog for saving "from this date, the daily limit is N".
// Dashboard and History both use it. `emptyGoal` is what we show in the
// number box when that date has no saved limit yet.

import { useEffect, useRef, useState } from "react";
import { goalForDay } from "../logic.js";
import { useToast } from "../toast.jsx";
import { Button, Dialog, Field, Input } from "./ui.jsx";

export function GoalDialog({
  open,
  onOpenChange,
  initialDay,
  goals,
  emptyGoal,
  onSave,
  saving,
  testId,
  variant = "outline",
  size = "sm",
  className,
  children,
}) {
  const { toast } = useToast();
  const [day, setDay] = useState("");
  const [value, setValue] = useState("");
  const wasOpen = useRef(false);

  // Fill the form only when the dialog opens. Later keystrokes stay put.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setDay(initialDay);
      const goal = goalForDay(goals, initialDay);
      setValue(goal == null ? emptyGoal : String(goal));
    }
    wasOpen.current = open;
  }, [open, initialDay, goals, emptyGoal]);

  function onDateChange(event) {
    const nextDay = event.target.value;
    setDay(nextDay);
    const goal = goalForDay(goals, nextDay);
    setValue(goal == null ? emptyGoal : String(goal));
  }

  function save() {
    const goal = parseInt(value, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      toast({ title: "Invalid", description: "Choose a date.", variant: "destructive" });
      return;
    }
    if (Number.isNaN(goal) || goal < 0 || goal > 200) {
      toast({
        title: "Invalid",
        description: "Enter a number between 0 and 200.",
        variant: "destructive",
      });
      return;
    }
    onSave({ day, dailyGoal: goal });
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        data-testid={testId}
        onClick={() => onOpenChange(true)}
      >
        {children}
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange} title="Set Daily Goal">
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Date">
            <Input
              type="date"
              value={day}
              onChange={onDateChange}
              data-testid="input-daily-goal-date"
            />
          </Field>
          <Field label="Maximum ciggis per day">
            <Input
              type="number"
              min={0}
              max={200}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              data-testid="input-daily-goal"
            />
          </Field>
          <Button onClick={save} disabled={saving} data-testid="button-save-goal">
            {saving ? "Saving..." : "Save Goal"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
