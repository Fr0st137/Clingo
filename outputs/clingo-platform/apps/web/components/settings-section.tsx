"use client";

import { useState } from "react";
import {
  ExternalConnectionData,
  NotificationSettingData,
  SettingsSectionData
} from "../lib/panel-mock-data";

export function SettingsFormSection({ section }: { section: SettingsSectionData }) {
  const [values, setValues] = useState(
    Object.fromEntries((section.fields ?? []).map((field) => [field.id, field.value]))
  );

  return (
    <section className="w-full rounded-xl border border-[#dce6f2] bg-white p-5 shadow-figma md:max-w-[745px] md:p-6">
      <header className="border-b border-[#e4ebf4] pb-4">
        <h3 className="text-[15px] font-bold text-clingo-ink">{section.title}</h3>
        <p className="mt-1 text-[12px] text-clingo-muted">{section.description}</p>
      </header>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {section.fields?.map((field) => (
          <label className={field.id === "email" || field.id === "phone" ? "md:col-span-2" : ""} key={field.id}>
            <span className="mb-2 block text-[12px] text-[#536479]">{field.label}</span>
            <input
              className="h-[46px] w-full rounded-xl border border-[#e4eaf2] bg-[#f3f5f8] px-4 text-[13px] text-clingo-ink outline-none transition-all placeholder:text-[#a2adba] focus:border-clingo-blue focus:bg-white"
              onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
              placeholder={field.placeholder}
              type={field.type === "password" ? "password" : field.type ?? "text"}
              value={values[field.id] ?? ""}
            />
          </label>
        ))}
      </div>

      {section.actionLabel ? (
        <button className="mt-5 h-[41px] rounded-full bg-clingo-blue px-5 text-[13px] font-bold text-white transition-all hover:bg-clingo-blueDark">
          {section.actionLabel}
        </button>
      ) : null}
    </section>
  );
}

export function NotificationSection({ settings }: { settings: NotificationSettingData[] }) {
  const [items, setItems] = useState(settings);

  return (
    <section className="w-full rounded-xl border border-[#dce6f2] bg-white p-5 shadow-figma md:max-w-[745px] md:p-6">
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
    <section className="w-full rounded-xl border border-[#dce6f2] bg-white p-5 shadow-figma md:max-w-[745px] md:p-6">
      <header className="border-b border-[#e4ebf4] pb-4">
        <h3 className="text-[15px] font-bold text-clingo-ink">Połączenia zewnętrzne</h3>
        <p className="mt-1 text-[12px] text-clingo-muted">Łatwiejsze logowanie za pomocą innych kont.</p>
      </header>

      <div className="mt-5 grid gap-3">
        {connections.map((connection) => (
          <button
            className="flex h-[46px] items-center justify-center gap-3 rounded-full border border-[#dfe8f2] bg-white text-[13px] font-semibold text-clingo-ink transition-all hover:border-clingo-blue hover:text-clingo-blue"
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
