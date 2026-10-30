"use client";
import "../app/project-editor.css";
import {useEffect,useMemo,useState} from "react";
import {ApiError,providerApi} from "../lib/provider-client";
import {timeLabel} from "../lib/provider-jobs";
import {offerPrice} from "../lib/provider-offers";
import {shiftDate,warsawToday} from "../lib/provider-schedule";
import {workLabel,type Project,type ProjectSession} from "../lib/provider-projects";
import {estimateForArea,projectBalance} from "../../api/src/provider/project-work";
import {localDuration} from "../../api/src/dashboard/booking-time";
import {ProviderModal} from "./provider-modal";
import {SettingsLoadState,useSettingsResource,useUnsavedSettings} from "./provider-settings-state";
import {ProviderSavedProjectNotes} from "./provider-project-notes-dialog";
import {ProviderSavedOrderHistory} from "./provider-order-history-dialog";

type Person={id:string;name:string};
const minutes=(value:string)=>Number(value.slice(0,2))*60+Number(value.slice(3));
export function ProjectSessionFields({row,index,project,all,disabled,onChange,onRemove,createOfferId}:{row:ProjectSession;index:number;project:Pick<Project,"source"|"id"|"revision"|"canEdit"|"bufferMinutes">;all:ProjectSession[];disabled:boolean;onChange:(patch:Partial<ProjectSession>)=>void;onRemove:()=>void;createOfferId?:string}){
  const[available,setAvailable]=useState<Person[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>{
    if(row.state!=="future"||!project.canEdit)return;
    const controller=new AbortController();setLoading(true);setError("");
    const timer=window.setTimeout(()=>{void providerApi<{available:Person[]}>(createOfferId?"multi-orders/availability":`projects/${project.source}/${project.id}/availability`,"POST",{...(createOfferId?{offerId:createOfferId}:{revision:project.revision}),date:row.date,startMinute:row.startMinute,endMinute:row.endMinute},controller.signal)
      .then(result=>setAvailable(result.available)).catch(error=>{if(error.name!=="AbortError"){setAvailable([]);setError(error.message);}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});},250);
    return()=>{window.clearTimeout(timer);controller.abort();};
  },[row.date,row.startMinute,row.endMinute,row.state,project.source,project.id,project.revision,project.canEdit,retry,createOfferId]);
  const people=Array.from(new Map([...row.employees,...available].map(person=>[person.id,person])).values());
  const occupied=(id:string)=>all.some(other=>other.id!==row.id&&other.date===row.date&&other.employeeIds.includes(id)&&row.startMinute<other.endMinute+project.bufferMinutes&&other.startMinute<row.endMinute+project.bufferMinutes);
  return <fieldset className="project-session" aria-label={`Sesja ${index+1}`} disabled={disabled}>
    <div className="project-session-heading"><h3>Sesja {index+1}</h3><span>{row.state==="released"?"Zwolniona po zakończeniu projektu":row.state==="ongoing"?"W trakcie":row.state==="ended"?"Termin zakończony":"Zaplanowana"}</span><button type="button" disabled={disabled||row.state!=="future"||all.length<=1} onClick={onRemove}>Usuń sesję</button></div>
    <div className="project-session-times">
      <label>Dzień sesji<input type="date" required value={row.date} disabled={disabled||row.state!=="future"} onChange={event=>onChange({date:event.target.value})}/></label>
      <label>Początek<input type="time" required step={60} value={timeLabel(row.startMinute)} disabled={disabled||row.state!=="future"} onChange={event=>onChange({startMinute:minutes(event.target.value)})}/></label>
      <label>Koniec<input type="time" required step={60} value={timeLabel(row.endMinute===1440?0:row.endMinute)} disabled={disabled||row.state==="ended"} onChange={event=>onChange({endMinute:minutes(event.target.value)===0?1440:minutes(event.target.value)})}/>{row.endMinute===1440&&<small>Północ następnego dnia</small>}</label>
      <p>{workLabel(Math.max(0,localDuration(row.date,row.startMinute,row.endMinute)))} × {row.employeeIds.length||row.workers} osób = <strong>{workLabel(Math.max(0,localDuration(row.date,row.startMinute,row.endMinute))*(row.employeeIds.length||row.workers))}</strong></p>
    </div>
    <h4>Pracownicy sesji</h4>
    {row.state!=="future"?<p>{row.employees.map(person=>person.name).join(", ")||"Historyczna obsada bez kartotek"}. {row.state==="released"?"Ten termin nie blokuje już dostępności pracowników.":row.state==="ongoing"?"Możesz zmienić wyłącznie godzinę końcową.":"Zakończony termin pozostaje bez zmian."}</p>:<>
      {loading&&<p role="status">Sprawdzamy dostępność…</p>}
      <div className="project-crew">{people.map(person=>{const chosen=row.employeeIds.includes(person.id),free=available.some(row=>row.id===person.id)&&!occupied(person.id);return <label key={person.id}><input type="checkbox" checked={chosen} disabled={disabled||loading||!free&&!chosen} onChange={event=>{const ids=event.target.checked?[...row.employeeIds,person.id]:row.employeeIds.filter(id=>id!==person.id);onChange({employeeIds:ids,employees:ids.map(id=>people.find(person=>person.id===id)!),workers:ids.length});}}/>{person.name}{!free&&<small>Niedostępny w tym terminie</small>}</label>;})}</div>
      {!loading&&!people.length&&!error&&<p>Brak dostępnych osób. Wybierz inny termin lub sprawdź grafiki.</p>}
      {error&&<p role="alert" className="provider-feedback is-error">{error}</p>}
      <button className="settings-button" type="button" onClick={()=>setRetry(value=>value+1)}>Odśwież dostępność sesji</button>
    </>}
  </fieldset>;
}

export function ProviderProjectEditor({source,id,onClose,onSaved}:{source:Project["source"];id:string;onClose:()=>void;onSaved:()=>void}){
  const resource=useSettingsResource<Project>(`projects/${source}/${id}`);
  const[rows,setRows]=useState<ProjectSession[]>([]),[area,setArea]=useState("");
  const[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState(""),[conflict,setConflict]=useState(false),[under,setUnder]=useState(false),[over,setOver]=useState(false);
  const[completing,setCompleting]=useState(false),[confirmed,setConfirmed]=useState(false);
  const[notesOpen,setNotesOpen]=useState(false);
  const[historyOpen,setHistoryOpen]=useState(false);
  useEffect(()=>{if(resource.data){setRows(structuredClone(resource.data.sessions));setArea(resource.data.estimate.areaSquareMeters===null?"":String(resource.data.estimate.areaSquareMeters));setUnder(false);setOver(false);setConflict(false);setError("");}},[resource.data]);
  const project=resource.data;
  const dirty=!!project&&(JSON.stringify(rows)!==JSON.stringify(project.sessions)||area!==(project.estimate.areaSquareMeters===null?"":String(project.estimate.areaSquareMeters)));
  useUnsavedSettings(dirty);
  const preview=useMemo(()=>{if(!project)return null;try{const estimate=estimateForArea(project.estimate,area?Number(area.replace(",",".")):null);return projectBalance(estimate.requiredWorkMinutes,rows.map(row=>({durationMinutes:Math.max(0,localDuration(row.date,row.startMinute,row.endMinute)),workers:row.employeeIds.length||row.workers})));}catch{return null;}},[project,rows,area]);
  const change=(next:ProjectSession[])=>{setRows(next);setUnder(false);setOver(false);setMessage("");};
  async function save(){
    if(!project||busy||!preview)return;setBusy(true);setError("");setMessage("");
    try{const result=await providerApi<Project>(`projects/${source}/${id}`,"PUT",{revision:project.revision,areaSquareMeters:area?Number(area.replace(",",".")):null,sessions:rows.map(row=>({id:row.id,date:row.date,startMinute:row.startMinute,endMinute:row.endMinute,employeeIds:row.employeeIds})),confirmUnderplanned:under,confirmOverplanned:over});
      resource.setData(result);setMessage("Projekt zapisany. Harmonogram i dostępność pracowników zostały zaktualizowane.");window.dispatchEvent(new Event("provider-bookings-changed"));window.dispatchEvent(new Event("provider-projects-changed"));onSaved();
    }catch(error){setError((error as Error).message);setConflict(error instanceof ApiError&&error.status===409);}finally{setBusy(false);}
  }
  async function accept(){if(!project||dirty||busy)return;setBusy(true);setError("");try{await providerApi(`multi-orders/${id}/action`,"PUT",{action:"accept",revision:project.revision});resource.reload();onSaved();window.dispatchEvent(new Event("provider-bookings-changed"));setMessage("Projekt przyjęty. Sesje są dostępne w kalendarzu.");}catch(error){setError((error as Error).message);}finally{setBusy(false);}}
  async function complete(){if(!project||dirty||busy||!confirmed)return;setBusy(true);setError("");setMessage("");try{const result=await providerApi<Project>(`projects/${source}/${id}/complete`,"POST",{revision:project.revision,confirmCompletion:true});resource.setData(result);setCompleting(false);setConfirmed(false);setMessage("Projekt zakończony. Pozostałe terminy zostały zwolnione.");window.dispatchEvent(new Event("provider-bookings-changed"));window.dispatchEvent(new Event("provider-projects-changed"));onSaved();}catch(error){setError((error as Error).message);setConflict(error instanceof ApiError&&error.status===409);setCompleting(false);setConfirmed(false);}finally{setBusy(false);}}
  function add(){const last=[...rows].sort((a,b)=>a.date.localeCompare(b.date)||a.startMinute-b.startMinute).at(-1);const date=last&&last.date>=warsawToday()?shiftDate(last.date,1):shiftDate(warsawToday(),1);change([...rows,{id:crypto.randomUUID(),date,startMinute:540,endMinute:600,durationMinutes:60,employeeIds:[],employees:[],workers:0,priceMinor:0,state:"future"}]);}
  if(completing)return <ProviderModal className="project-editor" titleId="complete-project-title" onClose={()=>{if(!busy){setCompleting(false);setConfirmed(false);}}}>
    <section className="project-warning" role="alertdialog" aria-modal="true" aria-labelledby="complete-project-title" aria-describedby="complete-project-description"><h2 id="complete-project-title">Zakończyć cały projekt?</h2><p id="complete-project-description">Oznaczysz całe zlecenie jako wykonane. Wszystkie pozostałe terminy przestaną blokować pracowników, a projekt trafi do historii. Uzgodnij zakończenie z klientem. Zaplanowane terminy i kwota pozostaną w historii; ta operacja nie rozlicza płatności.</p><label><input type="checkbox" checked={confirmed} disabled={busy} onChange={event=>setConfirmed(event.target.checked)}/>Potwierdzam wykonanie całego projektu i zwolnienie pozostałych terminów.</label><div className="project-editor-actions"><button autoFocus className="settings-button" type="button" disabled={busy} onClick={()=>{setCompleting(false);setConfirmed(false);}}>Wróć do projektu</button><button className="employee-save-button" type="button" disabled={busy||!confirmed} onClick={()=>void complete()}>{busy?"Kończenie…":"Potwierdź zakończenie projektu"}</button></div></section>
  </ProviderModal>;
  return <ProviderModal className="project-editor" titleId="project-editor-title" onClose={()=>{if(!busy&&(!dirty||window.confirm("Zamknąć edytor i odrzucić niezapisane zmiany?")))onClose();}}>
    <header className="project-editor-heading"><div><h2 id="project-editor-title">Edytor projektu</h2><p>{project?.clientName} · {project?.title}</p></div><button className="settings-button" type="button" disabled={busy} onClick={()=>{if(!dirty||window.confirm("Odrzucić niezapisane zmiany?"))onClose();}}>Zamknij</button></header>
    {resource.loading||resource.error?<SettingsLoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>:project&&<>
      {project.completion&&<p className="project-warning" role="status">Projekt zakończony {new Date(project.completion.at).toLocaleString("pl-PL")}. Zwolnione przyszłe sesje: {project.completion.releasedSessionIds.length}. Poniżej zachowano ostatni plan; jego godziny i procent opisują planowanie, a nie czas faktycznie wykonanej pracy.</p>}
      <div className="project-overview"><label>Powierzchnia projektu (m²)<input type="number" min="0.01" max="10000" step="0.01" value={area} disabled={busy||!project.canEdit||project.estimate.workMinutesPerSquareMeter===null} onChange={event=>{setArea(event.target.value);setUnder(false);setOver(false);setMessage("");}}/></label><p>Uzgodniona kwota: <strong>{offerPrice(project.priceMinor)}</strong><small>Zmiana powierzchni przelicza wymagane godziny. Kwotę uzgodnij z klientem oddzielnie.</small></p></div>
      {project.estimate.source==="historical-plan"&&<p className="team-help">Wymaganą pracę odtworzono z pierwotnego harmonogramu. {project.estimate.workMinutesPerSquareMeter===null?"Brak zapisanej podstawy do zmiany powierzchni.":"Zmiana powierzchni przelicza ją proporcjonalnie."}</p>}
      {preview?<section className="project-balance" aria-label="Bilans roboczogodzin"><div className="project-metrics">{[["Wymagane",preview.requiredMinutes],["Zaplanowane",preview.plannedMinutes],["Pozostało",preview.remainingMinutes],["Nadmiar",preview.excessMinutes]].map(([label,value])=><p key={label}><span>{label}</span><strong>{workLabel(Number(value))}</strong></p>)}</div><p>Pokrycie wymaganej pracy: <strong>{preview.percentage}%</strong></p><div className={`project-progress is-${preview.state}`} role="progressbar" aria-label="Pokrycie wymaganej pracy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,preview.percentage)} aria-valuetext={`${preview.percentage}%`}><span style={{width:`${Math.min(100,preview.percentage)}%`}}/></div></section>:<p role="alert" className="provider-feedback is-error">Podaj poprawną powierzchnię projektu.</p>}
      {project.hasLongGap&&<p className="team-help">W harmonogramie są przerwy dłuższe niż dwa pełne dni. Uzgodnij te terminy z klientem.</p>}
      {dirty&&<p className="project-warning">Przed zmianą harmonogramu uzgodnij terminy z klientem telefonicznie lub na czacie. Zapis aktualizuje terminy na jego koncie.</p>}
      <div className="project-session-list">{rows.map((row,index)=><ProjectSessionFields key={row.id} row={row} index={index} all={rows} project={project} disabled={busy||!project.canEdit} onChange={patch=>change(rows.map(candidate=>candidate.id===row.id?{...candidate,...patch}:candidate))} onRemove={()=>change(rows.filter(candidate=>candidate.id!==row.id))}/>)}</div>
      <button className="settings-button" type="button" disabled={busy||!project.canEdit||rows.length>=186} onClick={add}>Dodaj sesję</button>
      {project.canEdit&&preview?.state==="shortage"&&<label className="project-warning"><input type="checkbox" checked={under} disabled={busy} onChange={event=>setUnder(event.target.checked)}/> Zaplanowano za mało pracy. Potwierdzam realizację mimo brakujących {workLabel(preview.remainingMinutes)} na własne ryzyko.</label>}
      {project.canEdit&&preview?.state==="excess"&&<label className="project-warning"><input type="checkbox" checked={over} disabled={busy} onChange={event=>setOver(event.target.checked)}/> Potwierdzam nadmiar zaplanowanej pracy: {workLabel(preview.excessMinutes)}.</label>}
      {error&&<p role="alert" className="provider-feedback is-error">{error}</p>}{message&&<p role="status" className="provider-feedback">{message}</p>}
      <footer className="project-editor-actions">{conflict&&<button className="settings-button" type="button" disabled={busy} onClick={()=>{if(!dirty||window.confirm("Odrzucić zmiany i wczytać aktualny projekt?"))resource.reload();}}>Wczytaj aktualny projekt</button>}<button className="employee-save-button" type="button" disabled={busy||conflict||!project.canEdit||!dirty||!preview||preview.state==="shortage"&&!under||preview.state==="excess"&&!over} onClick={()=>void save()}>{busy?"Zapisywanie…":"Zapisz projekt"}</button>{source==="manual"&&project.status==="pending"&&<button className="settings-button" type="button" disabled={busy||dirty} onClick={()=>void accept()}>Akceptuj projekt</button>}</footer>
      {project.canComplete&&<button className="settings-button" type="button" disabled={busy||dirty||conflict} onClick={()=>{setCompleting(true);setConfirmed(false);}}>Zakończ projekt</button>}
      {source==="manual"&&<button className="settings-button" type="button" disabled={busy||dirty} onClick={()=>setNotesOpen(true)}>Notatki i zdjęcia</button>}
      <button className="settings-button" type="button" onClick={()=>setHistoryOpen(true)}>Historia zmian</button>
    </>}
    {notesOpen&&<ProviderSavedProjectNotes projectId={id} onClose={()=>setNotesOpen(false)} onSaved={()=>{resource.reload();onSaved();}}/>}
    {historyOpen&&<ProviderSavedOrderHistory source={source} id={id} onClose={()=>setHistoryOpen(false)}/>}
  </ProviderModal>;
}
