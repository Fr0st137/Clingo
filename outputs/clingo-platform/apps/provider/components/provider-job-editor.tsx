"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ProviderModal } from "./provider-modal";
import { SettingsInput, useSettingsResource, useUnsavedSettings } from "./provider-settings-state";
import { ApiError, providerApi, type Employee } from "../lib/provider-client";
import { priceMinor, type Offer } from "../lib/provider-offers";
import { jobDraft, jobStatuses, type Job, type JobDraft } from "../lib/provider-jobs";
type Client = { id: string; name: string };
export function ProviderJobEditor({ job, date, onClose, onSaved, onReloaded }: { job?: Job; date: string; onClose: () => void; onSaved: (job: Job) => void; onReloaded: (job: Job) => void }) {
  const clients = useSettingsResource<Client[]>("clients"), offers = useSettingsResource<Offer[]>("services"), employees = useSettingsResource<Employee[]>("employees");
  const [original,setOriginal] = useState(job);
  const [draft,setDraft] = useState(()=>jobDraft(job,date));
  const [busy,setBusy] = useState(false), [error,setError] = useState(""), [conflict,setConflict] = useState(false);
  const [confirm,setConfirm] = useState<"close"|"reload"|null>(null);
  const pending = useRef(false);
  const dirty = JSON.stringify(draft)!==JSON.stringify(jobDraft(original,date));
  useUnsavedSettings(dirty);
  const loading = clients.loading || offers.loading || employees.loading;
  const loadError = clients.error || offers.error || employees.error;
  const change = (key: keyof JobDraft,value: string)=>setDraft(previous=>({...previous,[key]:value}));
  const close = ()=>{if(!pending.current){if(dirty)setConfirm("close");else onClose();}};
  async function discard() {
    if(confirm==="close"){onClose();return;} if(!original||pending.current)return;
    pending.current=true;setBusy(true);setError("");
    try { const fresh=await providerApi<Job>(`jobs/${original.id}`);setOriginal(fresh);setDraft(jobDraft(fresh));setConflict(false);setConfirm(null);onReloaded(fresh); }
    catch(error){setError((error as Error).message);} finally{pending.current=false;setBusy(false);}
  }
  async function save(event:FormEvent){
    event.preventDefault();if(pending.current||conflict||loading||loadError||!dirty)return;
    const cents=priceMinor(draft.price), duration=Number(draft.duration);
    if(cents===null){setError("Podaj poprawną kwotę z maksymalnie dwoma miejscami po przecinku.");return;}
    if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.time)||!/^\d+$/.test(draft.duration)||duration<15||duration>1440){setError("Podaj poprawną godzinę i czas trwania od 15 do 1440 minut.");return;}
    const [hour,minute]=draft.time.split(":").map(Number), startMinute=hour*60+minute;
    if(startMinute+duration>1440){setError("Zlecenie musi kończyć się w tym samym dniu.");return;}
    pending.current=true;setBusy(true);setError("");
    try { onSaved(await providerApi<Job>(original?`jobs/${original.id}`:"jobs",original?"PUT":"POST",{clientId:draft.clientId,offerId:draft.offerId,employeeId:draft.employeeId||null,date:draft.date,startMinute,durationMinutes:duration,priceMinor:cents,notes:draft.notes,status:draft.status,...(original?{revision:original.revision}:{})})); }
    catch(error){setError((error as Error).message);setConflict(error instanceof ApiError&&error.status===409);}finally{pending.current=false;setBusy(false);}
  }
  const availableOffers = (offers.data??[]).filter(offer=>offer.status==="draft"||offer.id===original?.offerId);
  return <ProviderModal className="client-editor job-editor" titleId="job-editor-title" onClose={close}><h2 id="job-editor-title">{confirm?"Odrzucić zmiany?":original?"Edytuj zlecenie":"Dodaj zlecenie"}</h2>
    {confirm?<><p>{confirm==="reload"?"Formularz zostanie zastąpiony ostatnią zapisaną wersją.":"Niezapisane zmiany zostaną utracone."}</p>{error&&<p role="alert">{error}</p>}<div className="settings-live-actions"><button className="settings-button" disabled={busy} onClick={()=>setConfirm(null)}>Wróć do edycji</button><button className="employee-save-button" disabled={busy} onClick={discard}>{busy?"Wczytywanie…":confirm==="reload"?"Odrzuć zmiany i wczytaj":"Odrzuć zmiany"}</button></div></>:loading||loadError?<div className="provider-state" role={loadError?"alert":"status"}>{loading?"Wczytywanie klientów, usług i pracowników…":<><p>{loadError}</p><button className="settings-button" onClick={()=>{clients.reload();offers.reload();employees.reload();}}>Spróbuj ponownie</button></>}</div>:!clients.data?.length||!availableOffers.length?<div className="provider-state"><p>Do utworzenia zlecenia potrzebujesz klienta i szkicu usługi.</p><Link href="/clients">Dodaj klienta</Link><br/><Link href="/services">Dodaj usługę</Link></div>:<form onSubmit={save}>
      <p>Zlecenie ręczne, widoczne w Twoim panelu. Nie wysyła wiadomości klientowi ani nie pobiera płatności. Terminy według czasu polskiego.</p>
      {original&&<p className="team-help">Kontakt, adres i nazwa usługi pochodzą z chwili utworzenia zlecenia. Zmiana klienta lub usługi pobierze nowe dane.</p>}
      <fieldset className="settings-live-fields" disabled={busy}>
        <label className="settings-live-field"><span>Klient</span><select required value={draft.clientId} onChange={e=>change("clientId",e.target.value)}><option value="">Wybierz klienta</option>{clients.data.map(client=><option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        <label className="settings-live-field"><span>Usługa</span><select required value={draft.offerId} onChange={e=>{const offer=availableOffers.find(row=>row.id===e.target.value);setDraft(previous=>({...previous,offerId:e.target.value,...(offer?{price:(offer.priceMinor/100).toFixed(2).replace(".",","),duration:String(offer.durationMinutes)}:{})}));}}><option value="">Wybierz usługę</option>{availableOffers.map(offer=><option key={offer.id} value={offer.id}>{offer.title}{offer.status==="archived"?" (archiwum)":""}</option>)}</select></label>
        <label className="settings-live-field"><span>Pracownik</span><select value={draft.employeeId} onChange={e=>change("employeeId",e.target.value)}><option value="">Bez przypisania</option>{(employees.data??[]).map(employee=><option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
        <SettingsInput label="Data zlecenia" type="date" required min="2000-01-01" max="2099-12-31" value={draft.date} onChange={e=>change("date",e.target.value)}/>
        <SettingsInput label="Godzina rozpoczęcia" type="time" required value={draft.time} onChange={e=>change("time",e.target.value)}/>
        <SettingsInput label="Czas trwania (minuty)" type="number" required min={15} max={1440} step={1} value={draft.duration} onChange={e=>change("duration",e.target.value)}/>
        <SettingsInput label="Kwota zlecenia (zł)" inputMode="decimal" required maxLength={9} value={draft.price} onChange={e=>change("price",e.target.value)}/>
        {original&&<label className="settings-live-field"><span>Status zlecenia</span><select value={draft.status} onChange={e=>change("status",e.target.value)}>{Object.entries(jobStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}
        <label className="settings-live-field client-notes-field"><span>Notatki do zlecenia</span><textarea maxLength={2000} rows={4} value={draft.notes} onChange={e=>change("notes",e.target.value)}/></label>
      </fieldset><p className="team-help">Sprawdzamy kolizje zleceń przypisanego pracownika. Grafik pracy, dojazd i nieobecności nie są jeszcze uwzględniane.</p>
      {error&&<div className="provider-feedback is-error" role="alert">{error}{conflict&&<button type="button" className="settings-button" onClick={()=>setConfirm("reload")}>Wczytaj aktualne dane</button>}</div>}
      <div className="settings-live-actions"><button type="button" className="settings-button" disabled={busy} onClick={close}>Anuluj</button><button className="employee-save-button" disabled={busy||conflict||!dirty}>{busy?"Zapisywanie…":"Zapisz zlecenie"}</button></div>
    </form>}
  </ProviderModal>;
}
