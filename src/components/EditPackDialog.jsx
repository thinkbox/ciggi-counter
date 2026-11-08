// Edits one pack already in the list. There is no missed-ciggi step:
// given_away stays whatever was stored when the next pack was opened.

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  brandFields,
  centsToCostInput,
  dollarsToCents,
  neighborOpenTimes,
  packEditTimeError,
  packSizeFields,
  selectedPackSize,
  toDatetimeLocalValue,
} from "../logic.js";
import { sendJson } from "../api.js";
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

export function EditPackDialog({
  open,
  onOpenChange,
  pack,
  packs,
  brands,
  brandsLoading,
  onSaved,
}) {
  const { toast } = useToast();
  const [openedLocal, setOpenedLocal] = useState("");
  const [sizeChoice, setSizeChoice] = useState("20");
  const [customSize, setCustomSize] = useState("");
  const [brandId, setBrandId] = useState("");
  const [brandText, setBrandText] = useState("");
  const [cost, setCost] = useState("");

  useEffect(() => {
    if (!open || !pack) return;
    const size = packSizeFields(pack.size);
    const brand = brandFields(pack.brand, brands);
    setOpenedLocal(toDatetimeLocalValue(pack.openedAt));
    setSizeChoice(size.sizeChoice);
    setCustomSize(size.customSize);
    setBrandId(brand.brandId);
    setBrandText(brand.brandText);
    setCost(centsToCostInput(pack.costCents));
  }, [open, pack, brands]);

  const save = useMutation({
    mutationFn: (body) => sendJson("PUT", `/api/packs/${pack.id}`, body),
    onSuccess: (_data, body) => {
      onOpenChange(false);
      onSaved();
      toast({ title: "Pack updated", description: `${body.brand}, ${body.size}.` });
    },
    onError: (error) => reportError(toast, error),
  });

  function savePack() {
    if (!pack) return;
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
    const timeError = packEditTimeError({
      openedAt: opened.toISOString(),
      ...neighborOpenTimes(packs, pack.id),
    });
    if (timeError) {
      toast({ title: "Invalid date", description: timeError, variant: "destructive" });
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
    save.mutate({
      brand: name,
      size,
      costCents,
      openedAt: opened.toISOString(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Edit Pack">
      <div className="mt-4 flex flex-col gap-4">
        <Field label="Opened">
          <Input
            type="datetime-local"
            value={openedLocal}
            onChange={(event) => setOpenedLocal(event.target.value)}
            data-testid="input-edit-pack-opened"
          />
        </Field>
        <Field label="Size">
          <select
            className={selectClass}
            value={sizeChoice}
            data-testid="select-edit-pack-size"
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
              data-testid="input-edit-pack-size-custom"
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
              data-testid="input-edit-pack-brand"
              autoComplete="off"
            />
          </Field>
        ) : (
          <Field label="Brand">
            <select
              className={selectClass}
              value={brandId}
              data-testid="select-edit-pack-brand"
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
                data-testid="input-edit-pack-brand"
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
            data-testid="input-edit-pack-cost"
          />
        </Field>
        <Button
          onClick={savePack}
          disabled={save.isPending || brandsLoading || !pack}
          data-testid="button-edit-pack-save"
        >
          {save.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </Dialog>
  );
}
