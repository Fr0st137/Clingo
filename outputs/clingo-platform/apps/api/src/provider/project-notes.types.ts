export type ProjectNote = { id: string; title: string; body: string };
export type ProjectPhoto = { id: string; dataUrl?: string; url?: string };
export type ProjectNotes = { noteItems: ProjectNote[]; photos: ProjectPhoto[] };
export const MAX_PROJECT_NOTES = 20;
export const MAX_PROJECT_PHOTOS = 10;
export function legacyProjectNotes(text: string, id: string): ProjectNote[] { return text.trim() ? [{ id, title: "Notatka", body: text }] : []; }
export function projectNotesSummary(items: ProjectNote[]) { return items.map(row => `${row.title}\n${row.body}`).join("\n\n").slice(0, 2000); }
