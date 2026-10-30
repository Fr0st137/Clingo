"use client";

import "../app/project-notes.css";
import { useEffect, useRef, useState } from "react";
import { ApiError, providerApi } from "../lib/provider-client";
import { MAX_PROJECT_NOTES, MAX_PROJECT_PHOTOS, type ProjectNote, type ProjectNotes, type ProjectPhoto } from "../../api/src/provider/project-notes.types";
import { ProviderModal } from "./provider-modal";
import { SettingsField } from "./provider-settings-fields";
import { readProviderPhoto } from "./provider-offer-media";
import { useUnsavedSettings } from "./provider-settings-state";

const asset = (file: string) => file === "add.svg" ? "/figma-assets/clients/plus-design.svg" : `/figma-assets/orders/notes/${file}`;
export function ProviderProjectNotesDialog({ value, onChange, onClose, error: externalError = "", reload }: {
  value: ProjectNotes; onChange: (next: ProjectNotes) => Promise<void> | void; onClose: () => void; error?: string; reload?: () => void;
}) {
  const [tab, setTab] = useState<"notes" | "photos">("notes"), [editing, setEditing] = useState<ProjectNote | null>(null), [original, setOriginal] = useState<ProjectNote | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null), [deleting, setDeleting] = useState<ProjectNote | ProjectPhoto | null>(null), [preview, setPreview] = useState<ProjectPhoto | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [discard, setDiscard] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null), pending = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dirty = !!editing && JSON.stringify(editing) !== JSON.stringify(original);
  useUnsavedSettings(dirty);
  useEffect(() => { if (menuId) menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus(); }, [menuId]);
  useEffect(() => { if (!menuId) return; const close = (event: MouseEvent) => { if (!(event.target instanceof Element && event.target.closest(".project-note-menu-area"))) setMenuId(null); }; document.addEventListener("click", close); return () => document.removeEventListener("click", close); }, [menuId]);
  function close() { if (!pending.current) { if (editing && dirty) setDiscard(true); else if (editing) setEditing(null); else onClose(); } }
  async function commit(next: ProjectNotes) {
    if (pending.current) return false;
    pending.current = true; setBusy(true); setError("");
    try { await onChange(next); return true; } catch (failure) { setError((failure as Error).message); return false; }
    finally { pending.current = false; setBusy(false); }
  }
  async function saveNote() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.body.trim()) { setError("Uzupełnij tytuł i treść notatki."); return; }
    const note = { ...editing, title: editing.title.trim(), body: editing.body.trim() };
    const notes = value.noteItems.some(row => row.id === note.id) ? value.noteItems.map(row => row.id === note.id ? note : row) : [...value.noteItems, note];
    if (await commit({ ...value, noteItems: notes })) { setEditing(null); setOriginal(null); }
  }
  async function addPhotos(files: FileList | null) {
    if (!files?.length || pending.current) return;
    if (value.photos.length + files.length > MAX_PROJECT_PHOTOS) { setError("Możesz dodać maksymalnie 10 zdjęć."); if (fileInput.current) fileInput.current.value = ""; return; }
    pending.current = true; setBusy(true); setError("");
    try {
      const photos: ProjectPhoto[] = [];
      for (const file of Array.from(files)) photos.push({ id: crypto.randomUUID(), dataUrl: await readProviderPhoto(file) });
      await onChange({ ...value, photos: [...value.photos, ...photos] });
    } catch (failure) { setError((failure as Error).message); }
    finally { pending.current = false; setBusy(false); if (fileInput.current) fileInput.current.value = ""; }
  }
  function openNote(note?: ProjectNote) { const row = note ? { ...note } : { id: crypto.randomUUID(), title: "", body: "" }; setEditing(row); setOriginal({ ...row }); setError(""); setMenuId(null); }
  if (discard) return <ProviderModal className="project-notes-dialog project-note-editor" titleId="project-note-discard-title" onClose={() => setDiscard(false)}><h2 id="project-note-discard-title">Odrzucić zmiany notatki?</h2><p>Niezapisane zmiany zostaną utracone.</p><div className="project-notes-actions"><button type="button" onClick={() => setDiscard(false)}>Wróć do edycji</button><button type="button" className="is-primary" onClick={() => { setDiscard(false); setEditing(null); }}>Odrzuć zmiany</button></div></ProviderModal>;
  if (deleting) return <ProviderModal className="project-notes-dialog project-note-editor" titleId="project-note-delete-title" onClose={() => { if (!busy) setDeleting(null); }}><h2 id="project-note-delete-title">{"body" in deleting ? "Usunąć notatkę?" : "Usunąć zdjęcie?"}</h2><p>{"body" in deleting ? deleting.title : "Zdjęcie zostanie usunięte ze zlecenia."}</p>{error && <div role="alert" className="project-notes-error">{error}{reload && externalError && <button type="button" onClick={reload}>Odrzuć zmiany i wczytaj aktualne notatki</button>}</div>}<div className="project-notes-actions"><button type="button" disabled={busy} onClick={() => setDeleting(null)}>Anuluj</button><button type="button" className="is-primary" disabled={busy} onClick={async () => { const next = "body" in deleting ? { ...value, noteItems: value.noteItems.filter(row => row.id !== deleting.id) } : { ...value, photos: value.photos.filter(row => row.id !== deleting.id) }; if (await commit(next)) setDeleting(null); }}>Usuń</button></div></ProviderModal>;
  if (preview) return <ProviderModal className="project-notes-dialog project-photo-preview" titleId="project-photo-preview-title" onClose={() => setPreview(null)}><h2 id="project-photo-preview-title">Zdjęcie obiektu</h2><img className="project-photo-preview-image" src={preview.dataUrl ?? preview.url} alt="Zdjęcie obiektu" /></ProviderModal>;
  return <ProviderModal className={`project-notes-dialog${editing ? " project-note-editor project-note-form-dialog" : ""}`} titleId="project-notes-title" descriptionId={editing ? "project-note-description" : undefined} onClose={close}>
    {editing ? <>
      <div className="project-note-form-header">
        <h2 id="project-notes-title">{value.noteItems.some(row => row.id === editing.id) ? "Edytuj notatkę" : "Dodaj własną notatkę"}</h2>
        <p id="project-note-description">Opisz dodatkowe ustalania z klientem lub informacje dotyczące zlecenia.</p>
      </div>
      <form onSubmit={event => { event.preventDefault(); void saveNote(); }}>
        <fieldset disabled={busy}>
          <SettingsField label="Tytuł notatki" placeholder="Wpisz nazwę..." required maxLength={100} value={editing.title} onChange={event => setEditing(previous => previous ? { ...previous, title: event.target.value } : previous)} />
          <div className="settings-field-row project-note-body-field">
            <label className="settings-field">
              <span className="settings-field-label">Treść notatki</span>
              <textarea required maxLength={2000} placeholder="Miejsca na dodatkową notatkę do zamówienia" value={editing.body} onChange={event => setEditing(previous => previous ? { ...previous, body: event.target.value } : previous)} />
            </label>
          </div>
        </fieldset>
        {error && <div role="alert" className="project-notes-error">{error}{reload && externalError && <button type="button" onClick={reload}>Odrzuć zmiany i wczytaj aktualne notatki</button>}</div>}
        <div className="project-notes-actions"><button type="button" disabled={busy} onClick={close}>Anuluj</button><button type="submit" className="is-primary" disabled={busy}>{busy ? "Zapisywanie…" : "Zapisz"}</button></div>
      </form>
    </> : <>
      <div className="project-notes-heading"><h2 id="project-notes-title">Notatki i zdjęcia</h2><button type="button" className="project-notes-add" disabled={busy || (tab === "notes" ? value.noteItems.length >= MAX_PROJECT_NOTES : value.photos.length >= MAX_PROJECT_PHOTOS)} onClick={() => tab === "notes" ? openNote() : fileInput.current?.click()}>{tab === "notes" ? "Dodaj notatkę" : "Dodaj zdjęcie"}<img src={asset("add.svg")} alt="" /></button></div>
      <div className="project-notes-tabs" role="tablist" aria-label="Notatki i zdjęcia" onKeyDown={event => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); const next = event.key === "Home" ? "notes" : event.key === "End" ? "photos" : tab === "notes" ? "photos" : "notes"; setTab(next); event.currentTarget.querySelector<HTMLButtonElement>(`#project-${next}-tab`)?.focus(); }}><button id="project-notes-tab" type="button" role="tab" tabIndex={tab === "notes" ? 0 : -1} aria-selected={tab === "notes"} aria-controls="project-notes-panel" onClick={() => { setTab("notes"); setMenuId(null); }}>Notatki<span aria-live="polite">{value.noteItems.length}</span></button><button id="project-photos-tab" type="button" role="tab" tabIndex={tab === "photos" ? 0 : -1} aria-selected={tab === "photos"} aria-controls="project-photos-panel" onClick={() => { setTab("photos"); setMenuId(null); }}>Zdjęcia</button></div>
      {tab === "notes" ? <div className="project-note-list" role="tabpanel" id="project-notes-panel" aria-labelledby="project-notes-tab">{value.noteItems.length ? value.noteItems.map(note => <article className="project-note" key={note.id}><header><h3>{note.title}</h3><div className="project-note-menu-area"><button type="button" className="project-note-options" aria-label={`Opcje notatki: ${note.title}`} aria-haspopup="menu" aria-expanded={menuId === note.id} disabled={busy} onClick={() => setMenuId(current => current === note.id ? null : note.id)}><img src={asset("options.svg")} alt="" /></button>{menuId === note.id && <div className="project-note-menu" role="menu" ref={menuRef} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setMenuId(null); } }}><button type="button" role="menuitem" onClick={() => openNote(note)}>Edytuj</button><button type="button" role="menuitem" onClick={() => { setDeleting(note); setMenuId(null); setError(""); }}>Usuń</button></div>}</div></header><p>{note.body}</p></article>) : <p className="project-note-empty">Brak notatek. Dodaj pierwszą notatkę do zlecenia.</p>}</div> : <div role="tabpanel" id="project-photos-panel" aria-labelledby="project-photos-tab">
        <input className="sr-only" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple tabIndex={-1} aria-label="Zdjęcia obiektu" onChange={event => void addPhotos(event.target.files)} />
        {value.photos.length ? <div className="project-photo-grid">{value.photos.map((photo, index) => <div className="project-photo" key={photo.id}><button type="button" onClick={() => setPreview(photo)} aria-label={`Powiększ zdjęcie ${index + 1}`}><img src={photo.dataUrl ?? photo.url} alt={`Zdjęcie obiektu ${index + 1}`} /></button><button type="button" className="project-photo-remove" aria-label={`Usuń zdjęcie ${index + 1}`} disabled={busy} onClick={() => { setDeleting(photo); setError(""); }}>×</button></div>)}</div> : <button type="button" className="project-photos-empty" disabled={busy} onClick={() => fileInput.current?.click()}><img src={asset("image.svg")} alt="" /><span>Dodaj zdjęcia obiektu</span></button>}
      </div>}
      {busy && <p className="project-notes-status" role="status">Zapisywanie…</p>}{(error || externalError) && <div className="project-notes-error" role="alert">{error || externalError}{reload && <button type="button" onClick={reload}>Wczytaj aktualne notatki</button>}</div>}
    </>}
  </ProviderModal>;
}

export function ProviderSavedProjectNotes({ projectId, onClose, onSaved }: { projectId: string; onClose: () => void; onSaved: () => void }) {
  const [data, setData] = useState<(ProjectNotes & { revision: number }) | null>(null), [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => { const controller = new AbortController(); setError(""); providerApi<ProjectNotes & { revision: number }>(`projects/manual/${projectId}/notes`, "GET", undefined, controller.signal).then(setData).catch(error => { if (error.name !== "AbortError") setError(error.message); }); return () => controller.abort(); }, [projectId, retry]);
  if (!data) return <ProviderModal className="project-notes-dialog" titleId="project-notes-loading-title" onClose={onClose}><h2 id="project-notes-loading-title">Notatki i zdjęcia</h2>{error ? <p role="alert">{error}<button type="button" onClick={() => setRetry(value => value + 1)}>Spróbuj ponownie</button></p> : <p role="status">Wczytywanie…</p>}</ProviderModal>;
  return <ProviderProjectNotesDialog value={data} error={error} reload={() => { setData(null); setRetry(value => value + 1); }} onClose={onClose} onChange={async next => { try { const fresh = await providerApi<ProjectNotes & { revision: number }>(`projects/manual/${projectId}/notes`, "PUT", { revision: data.revision, noteItems: next.noteItems, photos: next.photos.map(photo => ({ id: photo.id, ...(photo.dataUrl ? { dataUrl: photo.dataUrl } : {}) })) }); setData(fresh); setError(""); onSaved(); } catch (failure) { if (failure instanceof ApiError && failure.status === 409) setError(failure.message); throw failure; } }} />;
}
