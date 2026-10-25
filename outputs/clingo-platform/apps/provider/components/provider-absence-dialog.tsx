"use client";

import { ProviderModal } from "./provider-modal";
import { useEffect, useRef, useState } from "react";
import { ProviderAbsenceForm } from "./provider-absence-form";
import { ProviderAbsenceManager } from "./provider-absence-manager";
import { warsawToday } from "../lib/provider-schedule";

export function ProviderAbsenceDialog({ onClose, date = warsawToday() }: { onClose: () => void; date?: string }) {
  const [screen, setScreen] = useState<"menu" | "add" | "manage" | "history">("menu");
  const addButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (screen === "menu") addButton.current?.focus(); }, [screen]);
  return <ProviderModal className={`order-type-modal absence-modal${screen === "add" ? " is-adding" : screen === "manage" ? " is-managing" : screen === "history" ? " is-managing is-history" : ""}`} titleId="absence-title" descriptionId="absence-description" onClose={onClose}>
    {screen === "add" ? <ProviderAbsenceForm date={date} onBack={() => setScreen("menu")} /> : screen === "manage" || screen === "history" ? <ProviderAbsenceManager history={screen === "history"} /> : <>
    <div className="order-type-heading">
      <h2 id="absence-title">Nieobecność (urlop, choroba, inne...)</h2>
      <p id="absence-description">Zaplanuj lub zarządzaj nieobecnościami w kalendarzu.</p>
    </div>
    <button type="button" className="order-type-choice" ref={addButton} onClick={() => setScreen("add")}>Dodaj nieobecność (zablokuj termin)<img src="/figma-assets/calendar/absence/next.svg" alt="" /></button>
    <button type="button" className="order-type-choice" onClick={() => setScreen("manage")}>Zarządzaj aktywnymi nieobecnościami<img src="/figma-assets/calendar/absence/next.svg" alt="" /></button>
    <button type="button" className="order-type-choice" onClick={() => setScreen("history")}>Historia nieobecności<img src="/figma-assets/calendar/absence/next.svg" alt="" /></button>
    </>}
  </ProviderModal>;
}
