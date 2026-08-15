"use client";

import { useState } from "react";
import { updateAccountProfile } from "../lib/account";
import type { AccountProfileUpdate } from "../lib/account";

export interface SettingsFieldData {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
}

export interface SettingsSectionData {
  id: string;
  title: string;
  description: string;
  fields?: SettingsFieldData[];
  actionLabel?: string;
}

export interface NotificationSettingData {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface ExternalConnectionData {
  id: string;
  provider: string;
  icon: string;
}

export function SettingsFormSection({ accountEmail, section }: { accountEmail?: string; section: SettingsSectionData }) {
  const [values, setValues] = useState(
    Object.fromEntries((section.fields ?? []).map((field) => [field.id, field.value]))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  const saveSection = async () => {
    if (!accountEmail || (section.id !== "personal" && section.id !== "address")) {
      return;
    }

    const payload: AccountProfileUpdate =
      section.id === "personal"
        ? {
            companyName: values.companyName,
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone
          }
        : {
            apartment: values.apartment,
            city: values.city,
            postalCode: values.postalCode,
            street: values.street
          };

    setIsSaving(true);
    setStatus("");

    try {
      await updateAccountProfile(accountEmail, payload);
      setStatus("Zapisano zmiany.");
    } catch {
      setStatus("Nie udało się zapisać zmian.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="w-full rounded-[18px] border border-[#e6edf3] bg-white p-5 shadow-[0px_8px_24px_0px_rgba(15,23,42,0.06)] md:max-w-[745px] md:p-6">
      <header className="border-b border-[#e4ebf4] pb-4">
        <h3 className="text-[15px] font-bold text-clingo-ink">{section.title}</h3>
        <p className="mt-1 text-[12px] text-clingo-muted">{section.description}</p>
      </header>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {section.fields?.map((field) => (
          <label
            className={["email", "phone", "companyName", "street"].includes(field.id) ? "md:col-span-2" : ""}
            key={field.id}
          >
            <span className="mb-2 block text-[12px] text-[#536479]">{field.label}</span>
            <input
              className={[
                "h-[46px] w-full rounded-[15px] border border-[#e4eaf2] bg-[#f7f9fc] px-4 text-[13px] text-clingo-ink outline-none placeholder:text-[#a2adba]",
                field.id === "email" ? "cursor-not-allowed text-[#7c8691]" : ""
              ].join(" ")}
              onChange={(event) => {
                setStatus("");
                setValues((current) => ({ ...current, [field.id]: event.target.value }));
              }}
              placeholder={field.placeholder}
              readOnly={field.id === "email"}
              type={field.type === "password" ? "password" : field.type ?? "text"}
              value={values[field.id] ?? ""}
            />
          </label>
        ))}
      </div>

      {section.actionLabel ? (
        <button
          className="mt-5 h-[41px] rounded-[30px] bg-[#0079de] px-5 text-[13px] font-bold text-white disabled:cursor-wait disabled:opacity-70"
          disabled={isSaving}
          onClick={saveSection}
          type="button"
        >
          {isSaving ? "Zapisywanie..." : section.actionLabel}
        </button>
      ) : null}

      {status ? <p className="mt-3 text-[12px] font-medium text-[#2e3b4c]">{status}</p> : null}
    </section>
  );
}

export function NotificationSection({ settings }: { settings: NotificationSettingData[] }) {
  const [items, setItems] = useState(settings);

  return (
    <section className="w-full rounded-[18px] border border-[#e6edf3] bg-white p-5 shadow-[0px_8px_24px_0px_rgba(15,23,42,0.06)] md:max-w-[745px] md:p-6">
      <header className="border-b border-[#e4ebf4] pb-4">
        <h3 className="text-[15px] font-bold text-clingo-ink">Powiadomienia</h3>
        <p className="mt-1 text-[12px] text-clingo-muted">Zarządzaj powiadomieniami dotyczącymi Twoich zamówień.</p>
      </header>

      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-4" key={item.id}>
            <div>
              <h4 className="text-[13px] font-bold text-clingo-ink">{item.title}</h4>
              <p className="mt-1 text-[12px] text-clingo-muted">{item.description}</p>
            </div>
            <button
              aria-pressed={item.enabled}
              className={[
                "relative h-[24px] w-[48px] rounded-full transition-all",
                item.enabled ? "bg-clingo-blue" : "bg-[#d7e0eb]"
              ].join(" ")}
              onClick={() =>
                setItems((current) =>
                  current.map((setting) =>
                    setting.id === item.id ? { ...setting, enabled: !setting.enabled } : setting
                  )
                )
              }
              type="button"
            >
              <span
                className={[
                  "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all",
                  item.enabled ? "left-[27px]" : "left-[3px]"
                ].join(" ")}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExternalConnectionsSection({ connections }: { connections: ExternalConnectionData[] }) {
  return (
    <section className="w-full rounded-[18px] border border-[#e6edf3] bg-white p-5 shadow-[0px_8px_24px_0px_rgba(15,23,42,0.06)] md:max-w-[745px] md:p-6">
      <header className="border-b border-[#e4ebf4] pb-4">
        <h3 className="text-[15px] font-bold text-clingo-ink">Połączenia zewnętrzne</h3>
        <p className="mt-1 text-[12px] text-clingo-muted">Łatwiejsze logowanie za pomocą innych kont.</p>
      </header>

      <div className="mt-5 grid gap-3">
        {connections.map((connection) => (
          <button
            className="flex h-[46px] items-center justify-center gap-3 rounded-[30px] border border-[#dfe8f2] bg-white text-[13px] font-semibold text-clingo-ink"
            key={connection.id}
            type="button"
          >
            <span className="font-bold text-clingo-blue">{connection.icon}</span>
            {connection.provider}
          </button>
        ))}
      </div>
    </section>
  );
}
