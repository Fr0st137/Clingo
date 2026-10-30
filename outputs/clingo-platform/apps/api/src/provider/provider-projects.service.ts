import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, EntityManager, In } from "typeorm";
import { createHash, randomUUID } from "crypto";
import { AuthService, objectInput } from "../auth/auth.service";
import { OrderEntity } from "../dashboard/order.entity";
import { ProviderProfileEntity } from "../dashboard/provider-profile.entity";
import { accountBookings, bookingStatus, lockBookingProfile } from "../dashboard/booking-bridge";
import { defaultWorkingHours, durationLabel, localDate, localTime, warsawDate } from "../dashboard/booking";
import { freeEmployees, loadStaffing } from "../dashboard/staffing";
import { ProviderAccountEntity, ProviderMembershipEntity } from "./provider.entity";
import { ProviderOfferEntity } from "./provider-offers.entity";
import { ProviderClientEntity } from "./provider-clients.entity";
import { ProviderJobEntity } from "./provider-jobs.entity";
import { ProviderMultiOrderEntity } from "./provider-multi-orders.entity";
import { allocateProjectPrice, projectInterval, sameSession, validateProjectPlan, type ProjectSession } from "./project-plan";
import { historicalEstimate, projectBalance, type ProjectEdit, type ProjectEstimate } from "./project-work";
import { projectCompletion, projectCompletionInput } from "./project-completion";
import { manualProjectInput } from "./manual-project.input";
import { manualProjectPricing } from "./manual-project-pricing";
import { staffingLimit } from "./provider-staffing";
import { defaultOfferConfiguration } from "./provider-offers.input";
import { projectNotesInput, prepareProjectPhotos } from "./project-notes.input";
import { legacyProjectNotes, projectNotesSummary } from "./project-notes.types";
import { ProviderProjectPhotoEntity } from "./provider-project-photo.entity";
import { attachmentHistoryDiff, historyMoney, orderHistoryDiff, type HistorySession } from "./order-history";

type Source = "booking" | "manual";
type Project = { source: Source; id: string; accountId: string; revision: number; clientName: string; title: string; status: string; priceMinor: number; estimate: ProjectEstimate; sessions: ProjectSession[]; profile: ProviderProfileEntity; publicOrder?: OrderEntity; manualOrder?: ProviderMultiOrderEntity; jobs?: ProviderJobEntity[]; history: ProjectEdit[] };
const minor = (text?: string) => Math.round(Number((text??"0").replace(/\s/g,"").replace(",",".").replace(/[^\d.]/g,""))*100);
const minute = (date: Date) => { const [hour,min]=localTime(date).split(":").map(Number);return hour*60+min; };
const endMinute = (row: Pick<ProjectSession,"startsAt"|"endsAt">) => minute(row.endsAt)===0&&localDate(row.endsAt)!==localDate(row.startsAt)?1440:minute(row.endsAt);
const areaFromId = (value?: string) => /^area-\d+(?:\.\d{1,2})?$/.test(value??"") ? Number(value!.slice(5)) : null;
const historySessions = (sessions: ProjectSession[]): HistorySession[] => sessions.map(row => ({ id: row.id, date: localDate(row.startsAt), startMinute: minute(row.startsAt), endMinute: endMinute(row), employees: row.employees }));

@Injectable()
export class ProviderProjectsService {
  constructor(private readonly auth: AuthService, private readonly db: DataSource) {}
  private async member(authorization?: string) {
    const user=await this.auth.sessionUser(authorization);
    const membership=await this.db.manager.findOneBy(ProviderMembershipEntity,{userId:user.id});
    if(!membership || !["owner","admin"].includes(membership.role))throw new ForbiddenException("Brak uprawnień do edycji projektów.");
    return {accountId:membership.accountId,actor:user.email};
  }
  private manualProfile(accountId: string, offer: ProviderOfferEntity) {
    const config = Object.keys(offer.configuration ?? {}).length ? offer.configuration : defaultOfferConfiguration();
    return { id: `service-${offer.id}`, accountId, bookingSettings: { ...defaultWorkingHours, bufferMinutes: config.bufferEnabled ? config.bufferMinutes : 0 } } as ProviderProfileEntity;
  }
  async manualAvailability(authorization: string | undefined, value: unknown) {
    const { accountId } = await this.member(authorization), input = objectInput(value);
    if (Object.keys(input).some(key => !["offerId", "date", "startMinute", "endMinute"].includes(key)) || typeof input.offerId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.offerId)) throw new BadRequestException("Wybierz usługę i poprawny termin sesji.");
    const offer = await this.db.manager.findOneBy(ProviderOfferEntity, { id: input.offerId, accountId });
    if (!offer || offer.status === "archived") throw new BadRequestException("Usługa nie jest dostępna w Twojej działalności.");
    const interval = projectInterval(input), profile = this.manualProfile(accountId, offer), staff = await loadStaffing(this.db.manager, profile);
    return { available: staff ? freeEmployees(staff, interval.startsAt, interval.endsAt, profile.bookingSettings!.bufferMinutes) : [] };
  }
  async createManual(authorization: string | undefined, value: unknown) {
    const { accountId, actor } = await this.member(authorization), input = manualProjectInput(value);
    const digest = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    return this.db.transaction(async manager => {
      const account = await manager.findOne(ProviderAccountEntity, { where: { id: accountId }, lock: { mode: "pessimistic_write" } });
      if (!account) throw new NotFoundException("Nie znaleziono działalności.");
      const existing = await manager.findOneBy(ProviderMultiOrderEntity, { id: input.requestId });
      if (existing) {
        if (existing.accountId !== accountId || existing.projectData?.creation?.digest !== digest) throw new ConflictException("Ten formularz został już zapisany. Otwórz zapisany projekt lub rozpocznij nowe zlecenie.");
        return this.view(await this.load(manager, accountId, "manual", existing.id));
      }
      const client = await manager.findOneBy(ProviderClientEntity, { id: input.clientId, accountId });
      const offer = await manager.findOneBy(ProviderOfferEntity, { id: input.offerId, accountId });
      if (!client || !offer || offer.status === "archived") throw new BadRequestException("Wybierz klienta i aktywną usługę ze swojej działalności.");
      if (offer.revision !== input.offerRevision) throw new ConflictException("Konfiguracja usługi zmieniła się. Wczytaj aktualne usługi i sprawdź wycenę oraz bilans pracy.");
      let quote: ReturnType<typeof manualProjectPricing>;
      try { quote = manualProjectPricing(Object.keys(offer.configuration ?? {}).length ? offer.configuration : defaultOfferConfiguration(), input); } catch (error) { throw new BadRequestException((error as Error).message); }
      const estimate = quote.estimate, profile = this.manualProfile(accountId, offer), staff = await loadStaffing(manager, profile);
      if (!staff) throw new BadRequestException("Dodaj pracowników i ich grafiki przed utworzeniem zlecenia.");
      const result = validateProjectPlan({ sessions: input.sessions, confirmUnderplanned: input.confirmUnderplanned, confirmOverplanned: input.confirmOverplanned }, [], estimate, staff, profile.bookingSettings!.bufferMinutes);
      if (result.sessions.some(row => (+row.endsAt - +row.startsAt) / 60000 < 15)) throw new BadRequestException("Każda nowa sesja musi trwać co najmniej 15 minut.");
      if (result.sessions.some(row => row.workers > staffingLimit(account, staff.employees.length))) throw new BadRequestException("Obsada sesji przekracza zadeklarowaną wielkość zespołu.");
      const understaffed = result.sessions.some(row => row.workers < estimate.estimatedWorkers);
      if (understaffed && !input.confirmUnderstaffing) throw new BadRequestException(`Usługa jest przewidziana na ${estimate.estimatedWorkers} osób. Potwierdź realizację z mniejszą obsadą.`);
      const sessions = allocateProjectPrice(quote.total, result.sessions, []);
      const history: ProjectEdit[] = [{ at: new Date().toISOString(), actor, added: sessions.map(row => row.id), removed: [], changed: [], areaChanged: false,
        confirmedShortage: input.confirmUnderplanned, confirmedExcess: input.confirmOverplanned, confirmedUnderstaffing: understaffed && input.confirmUnderstaffing,
        changes: [{ type: "Utworzenie zamówienia", before: "—", after: `${offer.title}, ${historyMoney(quote.total)}` }, ...orderHistoryDiff({ sessions: [] }, { sessions: historySessions(sessions) })] }];
      const noteItems = input.noteItems ?? legacyProjectNotes(input.notes, input.requestId);
      const photos = await prepareProjectPhotos(input.photos ?? []);
      const order = manager.create(ProviderMultiOrderEntity, { id: input.requestId, accountId, clientId: client.id, offerId: offer.id, clientName: client.name, serviceTitle: offer.title, serviceDetail: "Zlecenie własne",
        startDate: localDate(sessions[0].startsAt), endDate: localDate(sessions[sessions.length - 1].startsAt), areaSquareMeters: input.areaSquareMeters, addOnCount: quote.extras.reduce((sum, row) => sum + row.quantity, 0) + quote.positions.length, totalPriceMinor: quote.total, external: true, status: "pending", notes: input.notes, revision: 1,
        sessions: sessions.map(row => ({ id: row.id, date: localDate(row.startsAt), startMinute: minute(row.startsAt), durationMinutes: (+row.endsAt - +row.startsAt) / 60000, employeeId: row.employees[0].id, employees: row.employees })),
        projectData: { estimate, history, noteItems, creation: { digest, address: input.address, clientPhone: client.phone, clientEmail: client.email, quote } } });
      await manager.save(ProviderMultiOrderEntity, order);
      await this.persistPhotos(manager, accountId, order.id, photos);
      const project: Project = { source: "manual", id: order.id, accountId, revision: 1, clientName: client.name, title: offer.title, status: "pending", priceMinor: quote.total, estimate, sessions: [], profile, manualOrder: order, jobs: [], history };
      await this.persist(manager, project, sessions, estimate, history, true);
      return this.view(await this.load(manager, accountId, "manual", order.id));
    });
  }
  private async persistPhotos(manager: EntityManager, accountId: string, projectId: string, photos: Awaited<ReturnType<typeof prepareProjectPhotos>>) {
    const existing = await manager.find(ProviderProjectPhotoEntity, { where: { accountId, projectId } });
    for (const [position, photo] of photos.entries()) {
      const current = await manager.findOneBy(ProviderProjectPhotoEntity, { id: photo.id });
      if (current && (current.accountId !== accountId || current.projectId !== projectId) || !current && !photo.data || current && photo.data) throw new BadRequestException("Nie można dołączyć tego zdjęcia do projektu. Dodaj nowy plik.");
      if (current) { current.position = position; await manager.save(ProviderProjectPhotoEntity, current); }
      else await manager.save(ProviderProjectPhotoEntity, manager.create(ProviderProjectPhotoEntity, { id: photo.id, accountId, projectId, position, data: photo.data! }));
    }
    const removed = existing.filter(row => !photos.some(photo => photo.id === row.id)).map(row => row.id);
    if (removed.length) await manager.delete(ProviderProjectPhotoEntity, { accountId, projectId, id: In(removed) });
  }
  private async notesView(manager: EntityManager, accountId: string, projectId: string) {
    const order = await manager.findOneBy(ProviderMultiOrderEntity, { id: projectId, accountId });
    if (!order) throw new NotFoundException("Nie znaleziono projektu.");
    const photos = await manager.find(ProviderProjectPhotoEntity, { where: { projectId, accountId }, order: { position: "ASC", id: "ASC" } });
    return { revision: order.revision, noteItems: order.projectData?.noteItems ?? legacyProjectNotes(order.notes, order.id), photos: photos.map(photo => ({ id: photo.id, url: `/api/provider-project-photos/${projectId}/${photo.id}` })) };
  }
  async getNotes(authorization: string | undefined, projectId: string) { const { accountId } = await this.member(authorization); return this.notesView(this.db.manager, accountId, projectId); }
  async saveNotes(authorization: string | undefined, projectId: string, value: unknown) {
    const { accountId, actor } = await this.member(authorization), input = objectInput(value);
    if (Object.keys(input).some(key => !["revision", "noteItems", "photos"].includes(key)) || !Number.isSafeInteger(input.revision) || Number(input.revision) < 1) throw new BadRequestException("Odśwież notatki przed zapisem.");
    await this.notesView(this.db.manager, accountId, projectId);
    const validated = projectNotesInput(input.noteItems, input.photos), photos = await prepareProjectPhotos(validated.photos);
    return this.db.transaction(async manager => {
      await manager.findOneOrFail(ProviderAccountEntity, { where: { id: accountId }, lock: { mode: "pessimistic_write" } });
      const order = await manager.findOne(ProviderMultiOrderEntity, { where: { id: projectId, accountId }, lock: { mode: "pessimistic_write" } });
      if (!order) throw new NotFoundException("Nie znaleziono projektu.");
      if (order.revision !== input.revision) throw new ConflictException("Projekt lub notatki zmieniły się w innym oknie. Wczytaj aktualną wersję.");
      const estimate = order.projectData?.estimate ?? (await this.load(manager, accountId, "manual", projectId)).estimate;
      const oldPhotos = await manager.find(ProviderProjectPhotoEntity, { where: { accountId, projectId } });
      const changes = attachmentHistoryDiff({ noteItems: order.projectData?.noteItems ?? legacyProjectNotes(order.notes, order.id), photos: oldPhotos }, validated);
      const history = order.projectData?.history ?? [], last = history.at(-1);
      if (changes.length) history.push({ at: new Date().toISOString(), actor, added: [], removed: [], changed: [], areaChanged: false, confirmedShortage: last?.confirmedShortage ?? false, confirmedExcess: last?.confirmedExcess ?? false, changes });
      order.projectData = { ...order.projectData, estimate, history: history.slice(-100), noteItems: validated.noteItems }; order.notes = projectNotesSummary(validated.noteItems); order.revision++;
      await this.persistPhotos(manager, accountId, projectId, photos); await manager.save(ProviderMultiOrderEntity, order);
      return this.notesView(manager, accountId, projectId);
    });
  }
  async notesPhoto(authorization: string | undefined, projectId: string, photoId: string) {
    const { accountId } = await this.member(authorization);
    const rows: Array<{ data: Buffer }> = await this.db.manager.query("SELECT data FROM provider_project_photos WHERE id=$1 AND project_id=$2 AND account_id=$3", [photoId, projectId, accountId]);
    if (!rows[0]) throw new NotFoundException("Nie znaleziono zdjęcia.");
    return rows[0].data;
  }
  private async load(manager: EntityManager, accountId: string, source: string, id: string, lock=false): Promise<Project> {
    if(source!=="booking" && source!=="manual")throw new NotFoundException("Nie znaleziono projektu.");
    if(lock)await manager.findOneOrFail(ProviderAccountEntity,{where:{id:accountId},lock:{mode:"pessimistic_write"}});
    if(source==="booking") {
      const row=await manager.findOneBy(OrderEntity,{id});
      const owned=row?.providerId ? await manager.findOneBy(ProviderProfileEntity,{id:row.providerId,accountId}) : null;
      if(!row?.userEmail || row.mode!=="Wielosesyjne" || !owned)throw new NotFoundException("Nie znaleziono projektu.");
      const profile=lock?await lockBookingProfile(manager,owned.id):owned;
      const order=lock?await manager.findOneOrFail(OrderEntity,{where:{id},lock:{mode:"pessimistic_write"}}):row;
      const stored=order.selectedOptions?.sessions??[];
      const priceMinor=minor(order.summary?.total);
      const sessions:ProjectSession[]=stored.map((session,index)=>({id:session.id??String(index+1),startsAt:new Date(session.startsAt),endsAt:new Date(session.endsAt),employees:session.employees??[],workers:session.employees?.length||session.workers||order.selectedOptions?.estimatedWorkers||1,priceMinor:session.priceMinor??Math.floor(priceMinor/Math.max(1,stored.length))+(index<priceMinor%Math.max(1,stored.length)?1:0)}));
      const workers=order.selectedOptions?.estimatedWorkers||stored[0]?.workers||1;
      const required=sessions.reduce((sum,row)=>sum+(+row.endsAt-+row.startsAt)/60000*workers,0);
      const estimate=order.selectedOptions?.projectEstimate??historicalEstimate(areaFromId(order.selectedOptions?.pricingId),required,workers);
      return{source,id,accountId,revision:order.revision,clientName:order.selectedOptions?.contactName??"Klient",title:order.serviceType,status:bookingStatus(order.status),priceMinor,estimate,sessions,profile,publicOrder:order,history:order.selectedOptions?.projectHistory??[]};
    }
    const order=lock?await manager.findOne(ProviderMultiOrderEntity,{where:{id,accountId},lock:{mode:"pessimistic_write"}}):await manager.findOneBy(ProviderMultiOrderEntity,{id,accountId});
    if(!order)throw new NotFoundException("Nie znaleziono projektu.");
    const offer=await manager.findOneBy(ProviderOfferEntity,{id:order.offerId,accountId});
    if(!offer)throw new BadRequestException("Usługa projektu nie jest już dostępna.");
    const jobs=await manager.find(ProviderJobEntity,{where:{accountId,multiOrderId:id},order:{date:"ASC",startMinute:"ASC",id:"ASC"}});
    const profile=this.manualProfile(accountId,offer);
    const initial=order.sessions.map((session,index)=>{const startsAt=warsawDate(session.date,`${String(Math.floor(session.startMinute/60)).padStart(2,"0")}:${String(session.startMinute%60).padStart(2,"0")}`);return{id:session.id??`manual:${id}:${index+1}`,startsAt,endsAt:new Date(+startsAt+session.durationMinutes*60000),employees:session.employees??(session.employeeId?[{id:session.employeeId,name:""}]:[]),workers:session.employees?.length||1,priceMinor:Math.floor(order.totalPriceMinor/order.sessions.length)+(index<order.totalPriceMinor%order.sessions.length?1:0)};});
    const sessions:ProjectSession[]=["accepted","completed"].includes(order.status)?jobs.filter(job=>job.status!=="cancelled"||order.projectData?.completion?.releasedSessionIds.includes(job.projectSessionId??job.id)).map(job=>{const startsAt=warsawDate(job.date,`${String(Math.floor(job.startMinute/60)).padStart(2,"0")}:${String(job.startMinute%60).padStart(2,"0")}`);return{id:job.projectSessionId??job.id,startsAt,endsAt:new Date(+startsAt+job.durationMinutes*60000),employees:job.employees??(job.employeeId?[{id:job.employeeId,name:job.employeeName}]:[]),workers:job.employees?.length||1,priceMinor:job.priceMinor};}):initial;
    const estimate=order.projectData?.estimate??historicalEstimate(order.areaSquareMeters||null,initial.reduce((sum,row)=>sum+(+row.endsAt-+row.startsAt)/60000*row.workers,0),initial[0]?.workers||1);
    return{source,id,accountId,revision:order.revision,clientName:order.clientName,title:order.serviceTitle,status:order.status,priceMinor:order.totalPriceMinor,estimate,sessions,profile,manualOrder:order,jobs,history:order.projectData?.history??[]};
  }
  private view(project:Project) {
    const completion=project.publicOrder?.selectedOptions?.projectCompletion??project.manualOrder?.projectData?.completion;
    const sessions=project.sessions.map(row=>({id:row.id,date:localDate(row.startsAt),startMinute:minute(row.startsAt),endMinute:endMinute(row),durationMinutes:(+row.endsAt-+row.startsAt)/60000,employeeIds:row.employees.map(employee=>employee.id),employees:row.employees,workers:row.workers,priceMinor:row.priceMinor,state:completion?.releasedSessionIds.includes(row.id)?"released":completion?"ended":project.status==="pending"?"future":+row.endsAt<=Date.now()?"ended":+row.startsAt<=Date.now()?"ongoing":"future"}));
    return{source:project.source,id:project.id,revision:project.revision,clientName:project.clientName,title:project.title,status:project.status,priceMinor:project.priceMinor,estimate:project.estimate,bufferMinutes:project.profile.bookingSettings?.bufferMinutes??0,
      balance:projectBalance(project.estimate.requiredWorkMinutes,sessions),sessions,completion,canComplete:["scheduled","accepted"].includes(project.status),canEdit:["scheduled","pending","accepted"].includes(project.status),history:project.history,
      ...(project.manualOrder?.projectData?.creation?{pricing:project.manualOrder.projectData.creation.quote,address:project.manualOrder.projectData.creation.address}:{}),
      hasLongGap:sessions.some((row,index)=>index>0&&(Date.parse(row.date)-Date.parse(sessions[index-1].date))/86400000>3)};
  }
  async list(authorization?:string) {
    const {accountId}=await this.member(authorization);
    const publicOrders=(await accountBookings(this.db.manager,accountId)).filter(row=>row.userEmail&&row.mode==="Wielosesyjne");
    const manual=await this.db.manager.find(ProviderMultiOrderEntity,{where:{accountId}});
    return Promise.all([...publicOrders.map(row=>({source:"booking",id:row.id})),...manual.map(row=>({source:"manual",id:row.id}))].map(async row=>this.view(await this.load(this.db.manager,accountId,row.source,row.id))));
  }
  async get(authorization:string|undefined,source:string,id:string) {const{accountId}=await this.member(authorization);return this.view(await this.load(this.db.manager,accountId,source,id));}
  async complete(authorization:string|undefined,source:string,id:string,value:unknown) {
    const {accountId,actor}=await this.member(authorization),input=projectCompletionInput(objectInput(value));
    return this.db.transaction(async manager=>{
      const project=await this.load(manager,accountId,source,id,true);
      if(project.revision!==input.revision||project.status==="completed")throw new ConflictException("Projekt zmienił się lub został już zakończony. Wczytaj aktualne dane.");
      if(!["scheduled","accepted"].includes(project.status))throw new BadRequestException("Możesz zakończyć wyłącznie aktywny, przyjęty projekt.");
      const completion=projectCompletion(project.sessions,actor);
      const last=project.history.at(-1);
      project.history=[...project.history,{at:completion.at,actor,added:[],removed:[],changed:[],areaChanged:false,confirmedShortage:last?.confirmedShortage??false,confirmedExcess:last?.confirmedExcess??false,changes:[{type:"Zakończenie zamówienia",before:project.status==="accepted"?"Przyjęte":"Zaplanowane",after:"Zakończone"},...(completion.releasedSessionIds.length?[{type:"Zwolnienie przyszłych sesji",before:String(completion.releasedSessionIds.length),after:"0 zarezerwowanych terminów"}]:[])]}].slice(-100);
      if(project.publicOrder){
        const order=project.publicOrder;order.selectedOptions??={addOns:[],frequencyId:"",pricingId:""};
        order.selectedOptions.projectEstimate=project.estimate;order.selectedOptions.projectCompletion=completion;order.selectedOptions.projectHistory=project.history;
        order.status="Wykonane zlecenie";order.revision++;await manager.save(OrderEntity,order);
      }else{
        const order=project.manualOrder!;order.projectData={...order.projectData,estimate:project.estimate,history:project.history,completion};order.status="completed";order.revision++;
        for(const job of project.jobs??[]){if(job.status!=="scheduled")continue;job.status=completion.releasedSessionIds.includes(job.projectSessionId??job.id)?"cancelled":"completed";job.revision++;await manager.save(ProviderJobEntity,job);}
        await manager.save(ProviderMultiOrderEntity,order);
      }
      return this.view(await this.load(manager,accountId,source,id));
    });
  }
  private async staff(manager:EntityManager,project:Project) {
    const staff=await loadStaffing(manager,project.profile,project.source==="booking"?{orderId:project.id}:{manualProjectId:project.id});
    if(!staff)throw new BadRequestException("Najpierw połącz projekt z działalnością i pracownikami.");
    staff.category=project.publicOrder?.selectedOptions?.serviceCategory??staff.category;
    return staff;
  }
  async availability(authorization:string|undefined,source:string,id:string,value:unknown) {
    const{accountId}=await this.member(authorization),input=objectInput(value);
    if(Object.keys(input).some(key=>!["date","startMinute","endMinute","revision"].includes(key)))throw new BadRequestException("Nieprawidłowy termin sesji.");
    const project=await this.load(this.db.manager,accountId,source,id);
    if(project.revision!==input.revision)throw new ConflictException("Projekt zmienił się. Wczytaj aktualne dane.");
    const interval=projectInterval(input),staff=await this.staff(this.db.manager,project);
    return{available:freeEmployees(staff,interval.startsAt,interval.endsAt,project.profile.bookingSettings?.bufferMinutes??0),revision:project.revision};
  }
  private async persist(manager:EntityManager,project:Project,sessions:ProjectSession[],estimate:ProjectEstimate,history:ProjectEdit[],accept=false) {
    if(project.publicOrder) {
      const order=project.publicOrder;order.selectedOptions??={addOns:[],frequencyId:"",pricingId:""};
      order.selectedOptions.sessions=sessions.map(row=>({id:row.id,startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString(),workers:row.workers,employees:row.employees,priceMinor:row.priceMinor}));
      order.selectedOptions.projectEstimate=estimate;order.selectedOptions.projectHistory=history;
      order.startsAt=sessions[0].startsAt;order.endsAt=sessions[sessions.length-1].endsAt;
      order.summary={...(order.summary??{total:"0 zł",lines:[]}),duration:durationLabel(sessions.reduce((sum,row)=>sum+(+row.endsAt-+row.startsAt)/60000,0)),lines:(order.summary?.lines??[]).map(line=>line.id===order.selectedOptions?.pricingId&&estimate.areaSquareMeters!==null?{...line,label:`Powierzchnia ${estimate.areaSquareMeters} m²`}:line)};
      order.revision++;await manager.save(order);return;
    }
    const order=project.manualOrder!;
    const storedSessions=sessions.map(row=>({id:row.id,date:localDate(row.startsAt),startMinute:minute(row.startsAt),durationMinutes:(+row.endsAt-+row.startsAt)/60000,employeeId:row.employees[0]?.id??null,employees:row.employees}));
    if(order.status==="accepted"||accept) {
      const client=await manager.findOneBy(ProviderClientEntity,{id:order.clientId,accountId:project.accountId});
      if(!client)throw new BadRequestException("Klient projektu nie jest dostępny.");
      await manager.update(ProviderJobEntity,{accountId:project.accountId,multiOrderId:project.id},{sessionIndex:null});
      const kept=new Set(sessions.map(row=>row.id));
      for(const job of project.jobs??[])if(job.status!=="cancelled"&&!kept.has(job.projectSessionId??job.id))await manager.update(ProviderJobEntity,{id:job.id,accountId:project.accountId},{status:"cancelled",revision:job.revision+1});
      for(const[index,row]of sessions.entries()) {
        const previous=project.jobs?.find(job=>(job.projectSessionId??job.id)===row.id);
        const job=manager.create(ProviderJobEntity,{...(previous??{}),id:previous?.id??randomUUID(),accountId:project.accountId,multiOrderId:project.id,projectSessionId:row.id,clientId:order.clientId,offerId:order.offerId,date:localDate(row.startsAt),startMinute:minute(row.startsAt),durationMinutes:(+row.endsAt-+row.startsAt)/60000,
          employeeId:row.employees[0]?.id??null,employeeName:row.employees[0]?.name??"",employees:row.employees,priceMinor:row.priceMinor,status:previous?.status==="cancelled"?"scheduled":previous?.status??"scheduled",revision:previous?previous.revision+1:1,sessionIndex:index+1,sessionCount:sessions.length,
          clientName:previous?.clientName??order.clientName,clientPhone:previous?.clientPhone??order.projectData?.creation?.clientPhone??client.phone,clientEmail:previous?.clientEmail??order.projectData?.creation?.clientEmail??client.email,address:previous?.address??order.projectData?.creation?.address??[client.street,client.postalCode,client.city].filter(Boolean).join(", "),serviceTitle:previous?.serviceTitle??order.serviceTitle,notes:previous?.notes??order.notes});
        await manager.save(ProviderJobEntity,job);
      }
    }
    order.sessions=storedSessions;order.startDate=storedSessions[0].date;order.endDate=storedSessions[storedSessions.length-1].date;
    if(estimate.areaSquareMeters!==null)order.areaSquareMeters=estimate.areaSquareMeters;
    order.projectData={...order.projectData,estimate,history};if(accept){order.status="accepted";order.acceptedAt=new Date();}order.revision++;
    await manager.save(ProviderMultiOrderEntity,order);
  }
  async save(authorization:string|undefined,source:string,id:string,value:unknown) {
    const{accountId,actor}=await this.member(authorization),input=objectInput(value);
    return this.db.transaction(async manager=>{
      const project=await this.load(manager,accountId,source,id,true);
      if(!Number.isSafeInteger(input.revision)||project.revision!==input.revision)throw new ConflictException("Projekt zmienił się. Wczytaj aktualne dane przed zapisem.");
      if(!["scheduled","pending","accepted"].includes(project.status))throw new BadRequestException("Tego projektu nie można już edytować.");
      const result=validateProjectPlan(input,project.sessions,project.estimate,await this.staff(manager,project),project.profile.bookingSettings?.bufferMinutes??0,new Date(),project.status==="pending");
      const sessions=allocateProjectPrice(project.priceMinor,result.sessions,project.status==="pending"?[]:project.sessions);
      const originals=new Map(project.sessions.map(row=>[row.id,row])),ids=new Set(sessions.map(row=>row.id));
      const event:ProjectEdit={at:new Date().toISOString(),actor,added:sessions.filter(row=>!originals.has(row.id)).map(row=>row.id),removed:project.sessions.filter(row=>!ids.has(row.id)).map(row=>row.id),changed:sessions.filter(row=>originals.has(row.id)&&!sameSession(row,originals.get(row.id)!)).map(row=>row.id),areaChanged:result.estimate.areaSquareMeters!==project.estimate.areaSquareMeters,confirmedShortage:input.confirmUnderplanned===true,confirmedExcess:input.confirmOverplanned===true};
      event.changes=orderHistoryDiff({ sessions: historySessions(project.sessions), fields: { "Zmiana powierzchni": project.estimate.areaSquareMeters === null ? "—" : `${project.estimate.areaSquareMeters} m²` } }, { sessions: historySessions(sessions), fields: { "Zmiana powierzchni": result.estimate.areaSquareMeters === null ? "—" : `${result.estimate.areaSquareMeters} m²` } });
      await this.persist(manager,project,sessions,result.estimate,[...project.history,event].slice(-100));
      return this.view(await this.load(manager,accountId,source,id));
    });
  }
  async acceptManual(authorization:string|undefined,id:string,revision:number) {
    const{accountId}=await this.member(authorization);
    return this.db.transaction(async manager=>{
      const project=await this.load(manager,accountId,"manual",id,true);
      if(project.revision!==revision||project.status!=="pending")throw new ConflictException("Projekt został już rozpatrzony lub zmienił się.");
      const staff=await this.staff(manager,project);
      const offer=await manager.findOneBy(ProviderOfferEntity,{id:project.manualOrder!.offerId,accountId});
      if(offer?.status==="archived")throw new BadRequestException("Przywróć usługę z archiwum przed przyjęciem projektu.");
      const sessions=project.sessions.map(row=>({...row,employees:row.employees.length?row.employees:freeEmployees(staff,row.startsAt,row.endsAt,project.profile.bookingSettings?.bufferMinutes??0).slice(0,row.workers)}));
      const input={revision,sessions:sessions.map(row=>({id:row.id,date:localDate(row.startsAt),startMinute:minute(row.startsAt),endMinute:endMinute(row),employeeIds:row.employees.map(row=>row.id)})),confirmUnderplanned:true,confirmOverplanned:true};
      const result=validateProjectPlan(input,project.sessions,project.estimate,staff,project.profile.bookingSettings?.bufferMinutes??0,new Date(),true);
      // Accepting a proposal never silently waives a missing/excess workload.
      if(result.balance.state==="shortage"&&!project.history.at(-1)?.confirmedShortage || result.balance.state==="excess"&&!project.history.at(-1)?.confirmedExcess)throw new BadRequestException("Najpierw otwórz edytor projektu i potwierdź jego bilans pracy.");
      await this.persist(manager,project,allocateProjectPrice(project.priceMinor,result.sessions,project.sessions),result.estimate,project.history,true);
      return project.manualOrder!;
    });
  }
}
