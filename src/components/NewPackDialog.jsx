// Asks for the new pack, then how many missing ciggis were actually smoked.
// More than zero hands the same draft to the review page.

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  dollarsToCents,
  packShortfall,
  selectedPackSize,
  toDatetimeLocalValue,
} from "../logic.js";
import { sendJson } from "../api.js";
import { clearPackDraft, readPackDraft, writePackDraft } from "../packDraft.js";
import { Button, Dialog, Field, Input } from "./ui.jsx";
import { useToast } from "../toast.jsx";

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function brandName(brandId, brandText, brands) {
  if (!brands.length || brandId === "new") return brandText.trim();
  return brands.find((brand) => brand.id === brandId)?.name ?? "";
}

function reportError(toast, error) {
  if (error.cancelled) return;
  toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
}

export function NewPackDialog({
  open,
  onOpenChange,
  cigarettes,
  packs,
  brands,
  brandsLoading,
  onReview,
  onSaved,
}) {
  const { toast } = useToast();
  const [step, setStep] = useState("details");
  const [openedLocal, setOpenedLocal] = useState("");
  const [sizeChoice, setSizeChoice] = useState("20");
  const [customSize, setCustomSize] = useState("");
  const [brandId, setBrandId] = useState("");
  const [brandText, setBrandText] = useState("");
  const [cost, setCost] = useState("");
  const [logged, setLogged] = useState(0);
  const [missing, setMissing] = useState(0);
  const [toAddText, setToAddText] = useState("");
  const [previousBrand, setPreviousBrand] = useState("");

  useEffect(() => {
    if (!open) return;
    const draft = readPackDraft();
    if (draft?.openedLocal) {
      setOpenedLocal(draft.openedLocal);
      setSizeChoice(draft.sizeChoice ?? "20");
      setCustomSize(draft.customSize ?? "");
      setBrandId(draft.brandId ?? "");
      setBrandText(draft.brandText ?? "");
      setCost(draft.cost ?? "");
      setLogged(draft.logged ?? 0);
      setMissing(draft.missing ?? 0);
      setToAddText(draft.toAdd == null ? "" : String(draft.toAdd));
      setPreviousBrand(draft.previousBrand ?? "");
      setStep(draft.step === "shortfall" ? "shortfall" : "details");
      return;
    }
    setOpenedLocal(toDatetimeLocalValue(new Date()));
    setSizeChoice("20");
    setCustomSize("");
    setBrandId("");
    setBrandText("");
    setCost("");
    setLogged(0);
    setMissing(0);
    setToAddText("");
    setPreviousBrand("");
    setStep("details");
  }, [open]);

  const save = useMutation({
    mutationFn: (draft) =>
      sendJson("POST", "/api/packs", {
        brand: draft.brandName,
        size: draft.size,
        costCents: draft.costCents,
        openedAt: draft.openedAt,
        missed: [],
        toAdd: draft.toAdd,
      }),
    onSuccess: (_data, draft) => {
      clearPackDraft();
      onOpenChange(false);
      onSaved();
      const description =
        draft.logged > draft.previousSize
          ? `You've already logged ${draft.logged} for a ${draft.previousSize} pack.`
          : `${draft.brandName}, ${draft.size}.`;
      toast({ title: "Pack opened", description });
    },
    onError: (error) => reportError(toast, error),
  });

  function formSnapshot(extra) {
    return {
      openedLocal,
      sizeChoice,
      customSize,
      brandId,
      brandText,
      cost,
      logged,
      missing,
      previousBrand,
      step,
      ...extra,
    };
  }

  function continuePack() {
    const size = selectedPackSize(sizeChoice, customSize);
    const name = brandName(brandId, brandText, brands);
    const costCents = dollarsToCents(cost);
    if (!openedLocal) {
      toast({
        title: "Missing info",
        description: "Set when the pack was opened.",
        variant: "destructive",
      });
      return;
    }
    const opened = new Date(openedLocal);
    if (Number.isNaN(opened.getTime())) {
      toast({
        title: "Invalid date",
        description: "Check the open time.",
        variant: "destructive",
      });
      return;
    }
    if (opened.getTime() > Date.now()) {
      toast({
        title: "Invalid date",
        description: "Open time can't be in the future.",
        variant: "destructive",
      });
      return;
    }
    const previous = packs[0] ?? null;
    if (previous && opened.getTime() <= new Date(previous.openedAt).getTime()) {
      toast({
        title: "Invalid date",
        description: "Open time must be after the previous pack.",
        variant: "destructive",
      });
      return;
    }
    if (size == null) {
      toast({
        title: "Missing info",
        description: "Choose a pack size from 1 to 100.",
        variant: "destructive",
      });
      return;
    }
    if (!name) {
      toast({
        title: "Missing info",
        description: "Enter a brand.",
        variant: "destructive",
      });
      return;
    }
    if (costCents == null) {
      toast({
        title: "Missing info",
        description: "Enter a cost like 45.50.",
        variant: "destructive",
      });
      return;
    }

    const openedAt = opened.toISOString();
    const gap = packShortfall(
      previous,
      cigarettes.map((cigarette) => cigarette.smokedAt),
      openedAt,
    );
    const draft = formSnapshot({
      brandName: name,
      size,
      costCents,
      openedAt,
      logged: gap.logged,
      missing: gap.missing,
      previousBrand: previous?.brand ?? "",
      previousSize: previous?.size ?? null,
      step: "details",
    });

    if (!previous || gap.missing === 0) {
      save.mutate({ ...draft, toAdd: 0 });
      return;
    }

    setLogged(gap.logged);
    setMissing(gap.missing);
    setPreviousBrand(previous.brand);
    setToAddText(String(gap.missing));
    setStep("shortfall");
    writePackDraft({ ...draft, step: "shortfall", toAdd: gap.missing });
  }

  function submitShortfall() {
    if (!/^\d+$/.test(toAddText)) {
      toast({
        title: "Missing info",
        description: `Enter a whole number from 0 to ${missing}.`,
        variant: "destructive",
      });
      return;
    }
    const toAdd = Number(toAddText);
    if (toAdd > missing) {
      toast({
        title: "Missing info",
        description: `Enter a whole number from 0 to ${missing}.`,
        variant: "destructive",
      });
      return;
    }
    const draft = readPackDraft() ?? {};
    const next = { ...draft, ...formSnapshot({ step: "shortfall", toAdd }) };
    if (toAdd === 0) {
      save.mutate(next);
      return;
    }
    onReview(next);
  }

  const parsedToAdd = /^\d+$/.test(toAddText) ? Number(toAddText) : null;
  const title = step === "shortfall" ? "Missed ciggis" : "New Pack";

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title}>
      {step === "details" ? (
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Opened">
            <Input
              type="datetime-local"
              value={openedLocal}
              onChange={(event) => setOpenedLocal(event.target.value)}
              data-testid="input-pack-opened"
            />
          </Field>
          <Field label="Size">
            <select
              className={selectClass}
              value={sizeChoice}
              data-testid="select-pack-size"
              onChange={(event) => setSizeChoice(event.target.value)}
            >
              <option value="20">20</option>
              <option value="25">25</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="custom">Custom</option>
            </select>
          </Field>
          {sizeChoice === "custom" ? (
            <Field label="Custom size">
              <Input
                type="number"
                min={1}
                max={100}
                value={customSize}
                onChange={(event) => setCustomSize(event.target.value)}
                data-testid="input-pack-size-custom"
              />
            </Field>
          ) : null}
          {brandsLoading ? (
            <p className="text-sm text-muted-foreground">Loading brands…</p>
          ) : brands.length === 0 ? (
            <Field label="Brand">
              <Input
                value={brandText}
                onChange={(event) => setBrandText(event.target.value)}
                data-testid="input-pack-brand"
                autoComplete="off"
              />
            </Field>
          ) : (
            <Field label="Brand">
              <select
                className={selectClass}
                value={brandId}
                data-testid="select-pack-brand"
                onChange={(event) => setBrandId(event.target.value)}
              >
                <option value="">Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
                <option value="new">New brand…</option>
              </select>
              {brandId === "new" ? (
                <Input
                  className="mt-2"
                  value={brandText}
                  onChange={(event) => setBrandText(event.target.value)}
                  data-testid="input-pack-brand"
                  autoComplete="off"
                  placeholder="Brand name"
                />
              ) : null}
            </Field>
          )}
          <Field label="Cost ($)">
            <Input
              inputMode="decimal"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              placeholder="0.00"
              data-testid="input-pack-cost"
            />
          </Field>
          <Button
            onClick={continuePack}
            disabled={save.isPending || brandsLoading}
            data-testid="button-pack-continue"
          >
            {save.isPending ? "Saving..." : "Continue"}
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-sm" data-testid="text-pack-shortfall">
            Logged {logged} of {logged + missing}
            {previousBrand ? ` since the ${previousBrand} pack was opened` : ""}. {missing}{" "}
            {missing === 1 ? "wasn't" : "weren't"} logged.
          </p>
          <Field label="How many of those did you smoke?">
            <Input
              type="number"
              min={0}
              max={missing}
              step={1}
              value={toAddText}
              onChange={(event) => setToAddText(event.target.value)}
              data-testid="input-pack-missed-count"
            />
          </Field>
          <p className="text-sm text-muted-foreground">
            The rest were given away or not smoked and won't be added.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("details")} data-testid="button-pack-back-details">
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={submitShortfall}
              disabled={save.isPending || parsedToAdd == null || parsedToAdd > missing}
              data-testid="button-pack-review"
            >
              {save.isPending ? "Saving..." : parsedToAdd === 0 ? "Open pack" : "Review"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
