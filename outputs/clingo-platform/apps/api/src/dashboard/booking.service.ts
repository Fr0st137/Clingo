import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { createHash, randomUUID } from "crypto";
import { OrderEntity } from "./order.entity";
import { ProviderProfileEntity } from "./provider-profile.entity";
import { BookingInput, BookingSelection, CustomerAvailability, MultiScheduleInput, WorkingHours, addLocalDays, bookingLimit, daySlots, defaultWorkingHours, durationLabel, localDate, multiSessionDurations, planBookingSessions, quoteBooking } from "./booking";
import { MAX_BOOKING_SESSIONS } from "./booking-policy";
import { serviceAreaStatus } from "./service-area";
import { bookingBusy, lockBookingProfile } from "./booking-bridge";
import { assignStaff, loadStaffing, staffedSlots, planStaffedSessions, withRosterHours, rosterHours, type AssignedEmployee } from "./staffing";

@Injectable()
export class BookingService {
  constructor(private readonly db: DataSource) {}

  private async offer(selection: BookingSelection, manager = this.db.manager, lock = false, existingBooking = false) {
    if (typeof selection.providerId !== "string" || !selection.providerId || selection.providerId.length > 100) throw new BadRequestException("Najpierw wybierz wykonawcę.");
    const offer = lock ? await lockBookingProfile(manager, selection.providerId) : await manager.findOne(ProviderProfileEntity, { where: { id: selection.providerId } });
    if (!offer || offer.published === false) throw new NotFoundException("Ogłoszenie nie jest już dostępne.");
    const current = await withRosterHours(manager, offer);
    if (!existingBooking && current.staffingValid === false) throw new BadRequestException("Oferta wymaga aktualizacji obsady wykonawcy. Wybierz inne ogłoszenie.");
    return current;
  }

  private async busy(providerId: string, manager = this.db.manager, excludingId?: string) {
    return bookingBusy(manager, providerId, excludingId);
  }

  private isMultiOffer(offer: ProviderProfileEntity) {
    return offer.tags?.some(tag => tag.toLocaleLowerCase("pl-PL") === "wielosesyjne") ?? false;
  }

  async quote(selection: BookingSelection) {
    const offer = await this.offer(selection);
    return quoteBooking(offer, selection);
  }

  async availability(selection: BookingSelection, month?: string) {
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new BadRequestException("Nieprawidłowy miesiąc.");
    const now = new Date();
    if (month < localDate(now).slice(0, 7) || month > bookingLimit(now).slice(0, 7)) throw new BadRequestException("Rezerwacje są dostępne na 6 miesięcy do przodu.");
    const offer = await this.offer(selection);
    const quote = quoteBooking(offer, selection);
    const busy = await this.busy(offer.id);
    const staff = await loadStaffing(this.db.manager, offer);
    const [year, m] = month.split("-").map(Number);
    const count = new Date(Date.UTC(year, m, 0)).getUTCDate();
    const days = Array.from({ length: count }, (_, i) => {
      const date = `${month}-${String(i + 1).padStart(2, "0")}`;
      return { date, slots: staff ? staffedSlots(staff, date, quote.durationMinutes, quote.estimatedWorkers ?? 1, offer.bookingSettings ?? defaultWorkingHours, now) : daySlots(date, quote.durationMinutes, busy, offer.bookingSettings ?? defaultWorkingHours, now) };
    });
    return { quote, days, today: localDate(now), maxDate: bookingLimit(now), timeZone: "Europe/Warsaw" };
  }

  private customerHours(providerHours: WorkingHours, availability?: CustomerAvailability) {
    const parseTime = (value: unknown, fallback: number) => {
      if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return fallback;
      const [hours, minutes] = value.split(":").map(Number);
      return hours + minutes / 60;
    };
    const requestedDays = Array.isArray(availability?.days)
      ? new Set(availability.days.filter(day => Number.isInteger(day) && day >= 0 && day <= 6))
      : new Set(providerHours.days);
    return {
      ...providerHours,
      days: providerHours.days.filter(day => requestedDays.has(day)),
      startHour: Math.max(providerHours.startHour, parseTime(availability?.start, providerHours.startHour)),
      endHour: Math.min(providerHours.endHour, parseTime(availability?.end, providerHours.endHour))
    };
  }

  private multiWorkerCount(offer: ProviderProfileEntity, selection: BookingSelection) {
    if (offer.areaPricing) return quoteBooking(offer, selection).estimatedWorkers!;
    const pricing = offer.pricing?.find(item => item.id === selection.pricingId) ?? offer.pricing?.[0];
    const area = Number(pricing?.label.match(/(\d+(?:[.,]\d+)?)\s*m(?:²|2)/i)?.[1]?.replace(",", ".") ?? 0);
    return area >= 100 ? 2 : 1;
  }

  private assertMultiOffer(offer: ProviderProfileEntity) {
    if (!offer.areaPricing && !this.isMultiOffer(offer)) {
      throw new BadRequestException("Ten wykonawca nie obsługuje zamówień wielosesyjnych.");
    }
  }

  async multiAvailability(selection: BookingSelection & { durationMinutes?: number; availability?: CustomerAvailability; excludedDates?: string[] }, month?: string) {
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new BadRequestException("Nieprawidłowy miesiąc.");
    const now = new Date();
    if (month < localDate(now).slice(0, 7) || month > bookingLimit(now).slice(0, 7)) throw new BadRequestException("Rezerwacje są dostępne na 6 miesięcy do przodu.");
    const offer = await this.offer(selection);
    this.assertMultiOffer(offer);
    const quote = quoteBooking(offer, selection);
    const generatedDuration = offer.areaPricing ? 15 : multiSessionDurations(quote.durationMinutes)[0];
    const requestedDuration = Number(selection.durationMinutes);
    const durationMinutes = Number.isInteger(requestedDuration) && requestedDuration > 0 && requestedDuration <= 12 * 60
      ? requestedDuration : generatedDuration;
    const busy = await this.busy(offer.id);
    const hours = this.customerHours(offer.bookingSettings ?? defaultWorkingHours, selection.availability);
    const staff = await loadStaffing(this.db.manager, offer);
    const [year, numericMonth] = month.split("-").map(Number);
    const count = new Date(Date.UTC(year, numericMonth, 0)).getUTCDate();
    const days = Array.from({ length: count }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, "0")}`;
      return { date, slots: Array.isArray(selection.excludedDates) && selection.excludedDates.includes(date) ? [] : staff ? staffedSlots(staff, date, durationMinutes, this.multiWorkerCount(offer, selection), hours, now) : daySlots(date, durationMinutes, busy, hours, now) };
    });
    return { quote, durationMinutes, days, today: localDate(now), maxDate: bookingLimit(now), timeZone: "Europe/Warsaw" };
  }

  async multiSchedule(input: MultiScheduleInput) {
    const offer = await this.offer(input);
    this.assertMultiOffer(offer);
    const quote = quoteBooking(offer, input);
    const start = new Date(input.startsAt ?? "");
    if (!Number.isFinite(start.getTime())) throw new BadRequestException("Wybierz datę i godzinę pierwszej sesji.");
    const now = new Date();
    const hours = this.customerHours(offer.bookingSettings ?? defaultWorkingHours, input.availability);
    if (!hours.days.length || hours.endHour <= hours.startHour) throw new BadRequestException("Ustaw co najmniej jeden dostępny dzień i prawidłowy zakres godzin.");
    const busy = await this.busy(offer.id);
    const staff = await loadStaffing(this.db.manager, offer);
    if (staff) {
      const workers = this.multiWorkerCount(offer, input);
      const sessions = planStaffedSessions(staff, quote.durationMinutes, workers, start, hours, now, input.excludedDates);
      return { quote, sessions: sessions.map((session, index) => ({ id: index + 1, startsAt: session.startsAt.toISOString(), endsAt: session.endsAt.toISOString(), durationMinutes: (+session.endsAt - +session.startsAt) / 60000, duration: durationLabel((+session.endsAt - +session.startsAt) / 60000), workers: session.employees.length })) };
    }
    if (offer.areaPricing) {
      const sessions = planBookingSessions(quote.durationMinutes, start, busy, hours, now, input.excludedDates);
      const workers = this.multiWorkerCount(offer, input);
      return { quote, sessions: sessions.map((session, index) => ({ id: index + 1, startsAt: session.startsAt.toISOString(), endsAt: session.endsAt.toISOString(), durationMinutes: (session.endsAt.getTime() - session.startsAt.getTime()) / 60_000, duration: durationLabel((session.endsAt.getTime() - session.startsAt.getTime()) / 60_000), workers })) };
    }
    const durations = multiSessionDurations(quote.durationMinutes);
    const planned: Array<{ startsAt: Date; endsAt: Date; durationMinutes: number; workers: number }> = [];
    let previousDate = localDate(start);

    for (let index = 0; index < durations.length; index += 1) {
      const durationMinutes = durations[index];
      let selected: { startsAt: string; endsAt: string } | undefined;
      if (index === 0) {
        selected = daySlots(previousDate, durationMinutes, busy, hours, now).find(slot => slot.startsAt === start.toISOString());
      } else {
        const occupied = [...busy, ...planned.map(session => ({ startsAt: session.startsAt, endsAt: session.endsAt }))];
        for (let offset = 1; offset <= 3 && !selected; offset += 1) {
          const date = addLocalDays(previousDate, offset);
          selected = daySlots(date, durationMinutes, occupied, hours, now)[0];
          if (selected) previousDate = date;
        }
      }
      if (!selected) {
        throw new ConflictException(index === 0
          ? "Wybrany termin nie jest już dostępny. Wybierz inną datę lub godzinę."
          : "Nie udało się ułożyć pełnego harmonogramu w podanej dostępności. Zmień pierwszy termin lub swoją dostępność.");
      }
      planned.push({ startsAt: new Date(selected.startsAt), endsAt: new Date(selected.endsAt), durationMinutes, workers: this.multiWorkerCount(offer, input) });
    }

    return {
      quote,
      sessions: planned.map((session, index) => ({
        id: index + 1,
        startsAt: session.startsAt.toISOString(),
        endsAt: session.endsAt.toISOString(),
        durationMinutes: session.durationMinutes,
        duration: durationLabel(session.durationMinutes),
        workers: session.workers
      }))
    };
  }

  async create(input: BookingInput, email: string) {
    const required = (value: unknown, label: string, max: number) => {
      if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new BadRequestException(`Uzupełnij poprawnie pole: ${label}.`);
      return value.trim();
    };
    const address = required(input.address, "adres realizacji", 350);
    const contactName = required(input.contactName, "imię i nazwisko", 150);
    const contactPhone = required(input.contactPhone, "numer telefonu", 30);
    if (!/^[+\d ()-]+$/.test(contactPhone) || !/^\d{9,15}$/.test(contactPhone.replace(/\D/g, ""))) throw new BadRequestException("Podaj poprawny numer telefonu.");
    const apartment = typeof input.apartment === "string" ? input.apartment.trim() : "";
    const notes = typeof input.notes === "string" ? input.notes.trim() : "";
    if (apartment.length > 30 || notes.length > 2000) throw new BadRequestException("Numer mieszkania lub uwagi są zbyt długie.");
    const requestId = required(input.requestId, "identyfikator rezerwacji", 100);
    if (!/^[a-f0-9-]{36}$/i.test(requestId)) throw new BadRequestException("Odśwież podsumowanie i spróbuj ponownie.");
    let invoice = null;
    if (input.invoice) {
      invoice = { companyName: required(input.invoice.companyName, "nazwa firmy", 200), taxId: required(input.invoice.taxId, "NIP", 20).replace(/[ -]/g, ""), address: required(input.invoice.address, "adres firmy", 350) };
      if (!/^\d{10}$/.test(invoice.taxId)) throw new BadRequestException("NIP powinien zawierać 10 cyfr.");
    }
    const fingerprint = createHash("sha256").update(JSON.stringify({ ...input, requestId: undefined })).digest("hex");
    return this.db.transaction(async manager => {
      // One provider lock serializes reservations, including concurrent requests from other clients.
      const offer = await this.offer(input, manager, true);
      const previous = await manager.createQueryBuilder(OrderEntity, "o").where("o.user_email = :email", { email })
        .andWhere("o.provider_id = :providerId", { providerId: offer.id })
        .andWhere("CAST(o.selected_options AS jsonb) ->> 'requestId' = :requestId", { requestId }).getOne();
      if (previous) {
        if (previous.selectedOptions?.requestHash !== fingerprint) throw new ConflictException("To zamówienie zostało już zapisane z innymi danymi. Rozpocznij nową rezerwację.");
        return previous.id;
      }
      const coverage = serviceAreaStatus(offer.metrics, address);
      if (coverage === "unsupported") throw new BadRequestException("Lokalizacja poza zasięgiem. Ten wykonawca nie realizuje usług pod wskazanym adresem. Podaj adres razem z miejscowością.");
      if (coverage !== "supported") throw new BadRequestException("Nie możemy potwierdzić obsługi tej lokalizacji. Wróć do ogłoszenia i sprawdź adres.");
      const quote = quoteBooking(offer, input);
      if (input.expectedTotal !== undefined && input.expectedTotal !== quote.totalValue) {
        throw new ConflictException("Cena oferty zmieniła się. Odśwież podsumowanie, sprawdź nową kwotę i potwierdź zamówienie ponownie.");
      }
      const busy = await this.busy(offer.id, manager);
      const staff = await loadStaffing(manager, offer);
      const isMultiSession = Array.isArray(input.sessions);
      let startsAt: Date;
      let endsAt: Date;
      let sessions: Array<{ id?: string; startsAt: string; endsAt: string; workers: number; employees?: AssignedEmployee[] }> | undefined;
      let employees: AssignedEmployee[] | undefined;

      if (isMultiSession) {
        this.assertMultiOffer(offer);
        if (input.sessions!.length < (offer.areaPricing ? 1 : 2) || input.sessions!.length > MAX_BOOKING_SESSIONS) {
          throw new BadRequestException("Harmonogram zawiera nieprawidłową liczbę sesji.");
        }
        const hours = this.customerHours(offer.bookingSettings ?? defaultWorkingHours, input.availability);
        const parsed = input.sessions!.map((session, index) => {
          const start = new Date(session?.startsAt ?? "");
          const end = new Date(session?.endsAt ?? "");
          if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
            throw new BadRequestException(`Sesja ${index + 1} ma nieprawidłowy termin.`);
          }
          const duration = end.getTime() - start.getTime();
          if (duration > 12 * 60 * 60_000) throw new BadRequestException(`Sesja ${index + 1} jest zbyt długa.`);
          const date = localDate(start);
          if (start.getTime() <= Date.now() || date < localDate(new Date()) || date > bookingLimit(new Date())) {
            throw new BadRequestException(`Sesja ${index + 1} jest poza dostępnym zakresem rezerwacji.`);
          }
          if (Array.isArray(input.excludedDates) && input.excludedDates.includes(date)) throw new BadRequestException("Sesja przypada na wyłączony dzień. Wygeneruj harmonogram ponownie.");
          const available = daySlots(date, duration / 60_000, staff ? [] : busy, hours)
            .some(slot => slot.startsAt === start.toISOString());
          if (!available) throw new ConflictException(`Sesja ${index + 1} nie jest już dostępna w kalendarzu wykonawcy.`);
          return { startsAt: start, endsAt: end };
        }).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
        const plannedMinutes = parsed.reduce((total, session) => total + (session.endsAt.getTime() - session.startsAt.getTime()) / 60_000, 0);
        if (plannedMinutes !== quote.durationMinutes) throw new BadRequestException("Łączny czas sesji nie zgadza się z czasem zamówienia. Wygeneruj harmonogram ponownie.");
        for (let index = 1; index < parsed.length; index += 1) {
          const buffer = (offer.bookingSettings?.bufferMinutes ?? 0) * 60_000;
          if (parsed[index].startsAt.getTime() < parsed[index - 1].endsAt.getTime() + buffer) throw new BadRequestException("Sesje w harmonogramie nie mogą na siebie nachodzić i muszą zachować bufor.");
          const gapDays = (Date.parse(`${localDate(parsed[index].startsAt)}T12:00:00Z`) - Date.parse(`${localDate(parsed[index - 1].startsAt)}T12:00:00Z`)) / 86_400_000;
          if (gapDays > 3) throw new BadRequestException("Przerwa między sesjami nie może przekraczać dwóch pełnych dni.");
        }
        if (parsed.some(session => busy.some(interval => session.startsAt < interval.endsAt && session.endsAt > interval.startsAt))) {
          throw new ConflictException("Jeden z terminów harmonogramu nie jest już dostępny. Wróć do harmonogramu i wybierz inny.");
        }
        startsAt = parsed[0].startsAt;
        endsAt = parsed[parsed.length - 1].endsAt;
        const workers = this.multiWorkerCount(offer, input);
        sessions = parsed.map(session => ({ id: randomUUID(), startsAt: session.startsAt.toISOString(), endsAt: session.endsAt.toISOString(), workers,
          ...(staff ? { employees: assignStaff(staff, session.startsAt, session.endsAt, workers, hours.bufferMinutes) } : {}) }));
      } else {
        if (offer.areaPricing && quote.mode === "multi") throw new BadRequestException("To zamówienie wymaga harmonogramu sesji. Przejdź do planowania realizacji.");
        const start = new Date(input.startsAt ?? "");
        if (!Number.isFinite(start.getTime())) throw new BadRequestException("Wybierz datę i godzinę realizacji.");
        const slot = daySlots(localDate(start), quote.durationMinutes, staff ? [] : busy, offer.bookingSettings ?? defaultWorkingHours)
          .find(candidate => candidate.startsAt === start.toISOString());
        if (!slot) throw new ConflictException("Wybrany termin nie jest już dostępny. Wróć do kalendarza i wybierz inny.");
        startsAt = start;
        if (staff) employees = assignStaff(staff, startsAt, new Date(slot.endsAt), quote.estimatedWorkers ?? 1, offer.bookingSettings?.bufferMinutes ?? 0);
        endsAt = new Date(slot.endsAt);
      }
      const order = manager.create(OrderEntity, {
        address: `${address}${apartment ? `, lok. ${apartment}` : ""}`, providerId: offer.id, provider: offer.provider,
        startsAt, endsAt, mode: (sessions?.length ?? 0) > 1 ? "Wielosesyjne" : "Jednosesyjne", status: "Zaplanowane zlecenie",
        serviceType: offer.service, userEmail: email, location: null, summary: quote.summary,
        selectedOptions: { addOns: quote.addOns, pricingId: quote.pricingId, frequencyId: quote.frequencyId,
          frequencyLabel: quote.frequencyLabel, estimatedWorkers: quote.estimatedWorkers, serviceCategory: staff?.category, employees,
          ...(offer.areaPricing ? { projectEstimate: { source: "area" as const, areaSquareMeters: Number(quote.pricingId.slice(5)), workMinutesPerSquareMeter: offer.areaPricing.minutesPer100 / 100,
            fixedWorkMinutes: (input.addOns ?? []).reduce((sum, row) => sum + (offer.addOns?.find(addOn => addOn.id === row.id)?.durationMinutes ?? 0) * (row.quantity ?? 0), 0) * (quote.estimatedWorkers ?? 1),
            requiredWorkMinutes: Math.round((Number(quote.pricingId.slice(5)) * offer.areaPricing.minutesPer100 / 100 + (input.addOns ?? []).reduce((sum, row) => sum + (offer.addOns?.find(addOn => addOn.id === row.id)?.durationMinutes ?? 0) * (row.quantity ?? 0), 0) * (quote.estimatedWorkers ?? 1)) * 10000) / 10000,
            estimatedWorkers: quote.estimatedWorkers ?? 1 } } : {}), contactName, contactPhone, apartment, notes, invoice, sessions, requestId, requestHash: fingerprint }
      });
      return (await manager.save(order)).id;
    });
  }

  private rescheduleTarget(order: OrderEntity, sessionIndex?: number) {
    const sessions = order.selectedOptions?.sessions;
    if (sessions?.length) {
      if (!Number.isInteger(sessionIndex) || sessionIndex! < 0 || sessionIndex! >= sessions.length) throw new BadRequestException("Wybierz sesję do przełożenia.");
    } else if (sessionIndex !== undefined) throw new BadRequestException("To zamówienie nie zawiera sesji.");
    const target = sessions?.length ? sessions[sessionIndex!] : order;
    const start = target.startsAt ? new Date(target.startsAt) : null;
    const end = target.endsAt ? new Date(target.endsAt) : null;
    if (/odwo|anul|wykon|zako|cancel|completed|done/i.test(order.status) || !start || !end || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || start.getTime() <= Date.now()) throw new BadRequestException("Nie można już przełożyć tego terminu.");
    return { start, end, duration: (end.getTime() - start.getTime()) / 60_000 };
  }

  private rescheduleFits(order: OrderEntity, startsAt: string, endsAt: string, sessionIndex?: number, bufferMinutes = 0) {
    const sessions = order.selectedOptions?.sessions;
    if (!sessions?.length) return true;
    const planned = sessions.map((session, index) => index === sessionIndex ? { startsAt, endsAt } : session)
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    return planned.every((session, index) => {
      if (!index) return true;
      const previous = planned[index - 1];
      const gapDays = (Date.parse(`${localDate(new Date(session.startsAt))}T12:00:00Z`) - Date.parse(`${localDate(new Date(previous.startsAt))}T12:00:00Z`)) / 86_400_000;
      return Date.parse(session.startsAt) >= Date.parse(previous.endsAt) + bufferMinutes * 60000 && gapDays <= 3;
    });
  }

  private async rescheduleSlots(order: OrderEntity, date: string, duration: number, hours: WorkingHours, manager: EntityManager, sessionIndex?: number) {
    const profile = await manager.findOneBy(ProviderProfileEntity, { id: order.providerId! });
    const staff = profile ? await loadStaffing(manager, profile, { orderId: order.id, sessionIndex }) : null;
    if (staff) {
      staff.category = order.selectedOptions?.serviceCategory ?? staff.category;
      hours = rosterHours(staff.employees.filter(row => !staff.category || row.services.includes(staff.category)), hours);
      const count = order.selectedOptions?.sessions?.[sessionIndex ?? 0]?.employees?.length || order.selectedOptions?.employees?.length || order.selectedOptions?.estimatedWorkers || 1;
      return staffedSlots(staff, date, duration, count, hours).filter(slot => this.rescheduleFits(order, slot.startsAt, slot.endsAt, sessionIndex, hours.bufferMinutes));
    }
    const busy = await this.busy(order.providerId!, manager, order.id);
    const otherSessions = (order.selectedOptions?.sessions ?? []).filter((_, index) => index !== sessionIndex)
      .map(session => ({ startsAt: new Date(session.startsAt), endsAt: new Date(session.endsAt) }));
    return daySlots(date, duration, [...busy, ...otherSessions], hours)
      .filter(slot => this.rescheduleFits(order, slot.startsAt, slot.endsAt, sessionIndex, hours.bufferMinutes));
  }

  async rescheduleAvailability(id: string, email: string, month: string, sessionIndex?: number) {
    const now = new Date();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month < localDate(now).slice(0, 7) || month > bookingLimit(now).slice(0, 7)) throw new BadRequestException("Wybierz miesiąc w ciągu najbliższych 6 miesięcy.");
    const order = await this.db.manager.findOneBy(OrderEntity, { id, userEmail: email });
    if (!order?.providerId) throw new NotFoundException("Nie znaleziono rezerwacji.");
    if (order.selectedOptions?.sessions?.length === 1 && sessionIndex === undefined) sessionIndex = 0;
    const target = this.rescheduleTarget(order, sessionIndex);
    const offer = await this.offer({ providerId: order.providerId }, this.db.manager, false, true);
    const staff = await loadStaffing(this.db.manager, offer, { orderId: order.id, sessionIndex });
    if (staff) staff.category = order.selectedOptions?.serviceCategory ?? staff.category;
    const hours = staff ? rosterHours(staff.employees.filter(row => !staff.category || row.services.includes(staff.category)), offer.bookingSettings ?? defaultWorkingHours) : offer.bookingSettings ?? defaultWorkingHours;
    const count = order.selectedOptions?.sessions?.[sessionIndex ?? 0]?.employees?.length || order.selectedOptions?.employees?.length || order.selectedOptions?.estimatedWorkers || 1;
    const busy = staff ? [] : await this.busy(order.providerId, this.db.manager, order.id);
    const otherSessions = (order.selectedOptions?.sessions ?? []).filter((_, index) => index !== sessionIndex).map(row => ({ startsAt: new Date(row.startsAt), endsAt: new Date(row.endsAt) }));
    const [year, m] = month.split("-").map(Number);
    const days = Array.from({ length: new Date(Date.UTC(year, m, 0)).getUTCDate() }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, "0")}`;
      const slots = staff ? staffedSlots(staff, date, target.duration, count, hours, now) : daySlots(date, target.duration, [...busy, ...otherSessions], hours, now);
      return { date, slots: slots.filter(slot => this.rescheduleFits(order, slot.startsAt, slot.endsAt, sessionIndex, hours.bufferMinutes)) };
    });
    return { days, today: localDate(now), maxDate: bookingLimit(now), currentStartsAt: target.start.toISOString(), currentEndsAt: target.end.toISOString(), duration: durationLabel(target.duration) };
  }

  async reschedule(id: string, email: string, startsAt: Date, endsAt: Date, sessionIndex?: number, providerAction?: { accountId: string; revision: number; message: string }, expectedRevision?: number) {
    return this.db.transaction(async manager => {
      const current = await manager.findOneBy(OrderEntity, { id, userEmail: email });
      if (!current || !current.providerId) throw new NotFoundException("Nie znaleziono rezerwacji.");
      const offer = await this.offer({ providerId: current.providerId }, manager, true, true);
      if (providerAction && offer.accountId !== providerAction.accountId) throw new NotFoundException("Nie znaleziono rezerwacji.");
      const order = await manager.findOneOrFail(OrderEntity, { where: { id, userEmail: email }, lock: { mode: "pessimistic_write" } });
      if (expectedRevision !== undefined && (!Number.isSafeInteger(expectedRevision) || order.revision !== expectedRevision)) throw new ConflictException("Harmonogram zamówienia zmienił się. Odśwież stronę i ponownie wybierz sesję.");
      if (providerAction && order.revision !== providerAction.revision) throw new ConflictException("Rezerwacja zmieniła się. Wczytaj aktualne dane.");
      if (order.selectedOptions?.sessions?.length === 1 && sessionIndex === undefined) sessionIndex = 0;
      const { duration } = this.rescheduleTarget(order, sessionIndex);
      if (endsAt.getTime() - startsAt.getTime() !== duration * 60_000) throw new BadRequestException("Przełożenie nie może zmienić czasu trwania usługi.");
      const slot = (await this.rescheduleSlots(order, localDate(startsAt), duration, offer.bookingSettings ?? defaultWorkingHours, manager, sessionIndex)).find(s => s.startsAt === startsAt.toISOString());
      if (!slot) throw new ConflictException("Wybrany termin jest niedostępny.");
      const staff = await loadStaffing(manager, offer, { orderId: order.id, sessionIndex });
      if (staff) staff.category = order.selectedOptions?.serviceCategory ?? staff.category;
      const count = order.selectedOptions?.sessions?.[sessionIndex ?? 0]?.employees?.length || order.selectedOptions?.employees?.length || order.selectedOptions?.estimatedWorkers || 1;
      const employees = staff ? assignStaff(staff, startsAt, endsAt, count, offer.bookingSettings?.bufferMinutes ?? 0) : undefined;
      if (order.selectedOptions?.sessions?.length) {
        order.selectedOptions.sessions = order.selectedOptions.sessions.map((session, index) => index === sessionIndex ? { ...session, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), ...(employees ? { employees, workers: employees.length } : {}) } : session)
          .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
        order.startsAt = new Date(order.selectedOptions.sessions[0].startsAt);
        order.endsAt = new Date(order.selectedOptions.sessions[order.selectedOptions.sessions.length - 1].endsAt);
      } else {
        order.startsAt = startsAt; order.endsAt = endsAt;
        if (employees && order.selectedOptions) order.selectedOptions.employees = employees;
      }
      order.revision += 1;
      if (providerAction?.message) {
        order.selectedOptions ??= { addOns: [], frequencyId: "", pricingId: "" };
        order.selectedOptions.providerMessages = [...(order.selectedOptions.providerMessages ?? []), { type: "rescheduled" as const, message: providerAction.message, createdAt: new Date().toISOString() }].slice(-100);
      }
      await manager.save(order);
    });
  }
}
