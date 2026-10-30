export type OrderHistoryChange = { type: string; before: string; after: string };
export type OrderHistoryEntry = { at: string; changes: OrderHistoryChange[] };
type Note = { id: string; title: string; body: string };
export type HistorySession = { id: string; date: string; startMinute: number; endMinute: number; employees: Array<{ id: string; name: string }> };
export type HistorySnapshot = { fields?: Record<string, string>; sessions?: HistorySession[] };
export const historyMoney = (minor: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(minor / 100) + " zł";
const day = (value: string) => value.split("-").reverse().join(".");
const time = (value: number) => value === 1440 ? "00:00 (+1 dzień)" : `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const interval = (row: HistorySession) => `${day(row.date)}, ${time(row.startMinute)} - ${time(row.endMinute)}`;
export function orderHistoryDiff(before: HistorySnapshot, after: HistorySnapshot): OrderHistoryChange[] {
  const changes: OrderHistoryChange[] = [];
  const add = (type: string, previous?: string, next?: string) => { if (previous !== next) changes.push({ type, before: previous || "—", after: next || "—" }); };
  for (const key of new Set([...Object.keys(before.fields ?? {}), ...Object.keys(after.fields ?? {})])) add(key, before.fields?.[key], after.fields?.[key]);
  const originals = new Map((before.sessions ?? []).map(row => [row.id, row]));
  for (const row of after.sessions ?? []) {
    const old = originals.get(row.id);
    if (!old) { add("Dodanie sesji", undefined, interval(row)); continue; }
    originals.delete(row.id);
    if (old.date !== row.date || old.startMinute !== row.startMinute) add("Przełożenie terminu", interval(old), interval(row));
    else if (old.endMinute !== row.endMinute) add("Zmiana godziny końca zamówienia", `${day(old.date)}, ${time(old.endMinute)}`, `${day(row.date)}, ${time(row.endMinute)}`);
    const ids = (session: HistorySession) => session.employees.map(person => person.id).sort().join("|");
    if (ids(old) !== ids(row)) add("Zmiana pracowników", old.employees.map(person => person.name).join(", "), row.employees.map(person => person.name).join(", "));
  }
  for (const row of originals.values()) add("Usunięcie sesji", interval(row), undefined);
  return changes;
}
export function attachmentHistoryDiff(before: { noteItems: Note[]; photos: Array<{ id: string }> }, after: { noteItems: Note[]; photos: Array<{ id: string }> }): OrderHistoryChange[] {
  const changes: OrderHistoryChange[] = [], notes = new Map(before.noteItems.map(row => [row.id, row]));
  for (const row of after.noteItems) {
    const old = notes.get(row.id); notes.delete(row.id);
    if (!old) changes.push({ type: "Dodanie notatki", before: "—", after: row.title });
    else {
      if (old.title !== row.title) changes.push({ type: "Zmiana tytułu notatki", before: old.title, after: row.title });
      if (old.body !== row.body) changes.push({ type: `Zmiana treści notatki „${row.title}”`, before: old.body, after: row.body });
    }
  }
  for (const row of notes.values()) changes.push({ type: "Usunięcie notatki", before: row.title, after: "—" });
  const removed = before.photos.filter(row => !after.photos.some(photo => photo.id === row.id)).length, added = after.photos.filter(row => !before.photos.some(photo => photo.id === row.id)).length;
  if (removed || added) changes.push({ type: `Zmiana zdjęć (dodano: ${added}, usunięto: ${removed})`, before: String(before.photos.length), after: String(after.photos.length) });
  return changes;
}
