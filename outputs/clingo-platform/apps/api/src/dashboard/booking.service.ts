import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { createHash } from "crypto";
import { OrderEntity } from "./order.entity";
import { ProviderProfileEntity } from "./provider-profile.entity";
import { BookingInput, BookingSelection, bookingLimit, daySlots, defaultWorkingHours, localDate, quoteBooking } from "./booking";
import { serviceAreaStatus } from "./service-area";

@Injectable()
export class BookingService {
  constructor(private readonly db: DataSource) {}

  private async offer(selection: BookingSelection, manager = this.db.manager, lock = false) {
    if (typeof selection.providerId !== "string" || !selection.providerId || selection.providerId.length > 100) throw new BadRequestException("Najpierw wybierz wykonawcę.");
    const offer = await manager.findOne(ProviderProfileEntity, { where: { id: selection.providerId }, ...(lock ? { lock: { mode: "pessimistic_write" as const } } : {}) });
    if (!offer) throw new NotFoundException("Ogłoszenie nie jest już dostępne.");
    return offer;
  }

  private async busy(providerId: string, manager = this.db.manager, excludingId?: string) {
    const orders = await manager.find(OrderEntity, { where: { providerId } });
    return orders.filter(o => o.id !== excludingId && o.startsAt && o.endsAt && !/odwo|anul|wykon|zako|cancel|completed|done/i.test(o.status))
      .map(o => ({ startsAt: o.startsAt!, endsAt: o.endsAt! }));
  }

  async quote(selection: BookingSelection) {
    return quoteBooking(await this.offer(selection), selection);
  }

  async availability(selection: BookingSelection, month?: string) {
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new BadRequestException("Nieprawidłowy miesiąc.");
    const now = new Date();
    if (month < localDate(now).slice(0, 7) || month > bookingLimit(now).slice(0, 7)) throw new BadRequestException("Rezerwacje są dostępne na 6 miesięcy do przodu.");
    const offer = await this.offer(selection);
    const quote = quoteBooking(offer, selection);
    const busy = await this.busy(offer.id);
    const [year, m] = month.split("-").map(Number);
    const count = new Date(Date.UTC(year, m, 0)).getUTCDate();
    const days = Array.from({ length: count }, (_, i) => {
      const date = `${month}-${String(i + 1).padStart(2, "0")}`;
      return { date, slots: daySlots(date, quote.durationMinutes, busy, offer.bookingSettings ?? defaultWorkingHours, now) };
    });
    return { quote, days, today: localDate(now), maxDate: bookingLimit(now), timeZone: "Europe/Warsaw" };
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
      const start = new Date(input.startsAt ?? "");
      if (!Number.isFinite(start.getTime())) throw new BadRequestException("Wybierz datę i godzinę realizacji.");
      const busy = await this.busy(offer.id, manager);
      const slot = daySlots(localDate(start), quote.durationMinutes, busy, offer.bookingSettings ?? defaultWorkingHours)
        .find(s => s.startsAt === start.toISOString());
      if (!slot) throw new ConflictException("Wybrany termin nie jest już dostępny. Wróć do kalendarza i wybierz inny.");
      const order = manager.create(OrderEntity, {
        address: `${address}${apartment ? `, lok. ${apartment}` : ""}`, providerId: offer.id, provider: offer.provider,
        startsAt: start, endsAt: new Date(slot.endsAt), mode: "Jednosesyjne", status: "Zaplanowane zlecenie",
        serviceType: offer.service, userEmail: email, location: null, summary: quote.summary,
        selectedOptions: { addOns: quote.addOns, pricingId: quote.pricingId, frequencyId: quote.frequencyId,
          frequencyLabel: quote.frequencyLabel, contactName, contactPhone, apartment, notes, invoice, requestId, requestHash: fingerprint }
      });
      return (await manager.save(order)).id;
    });
  }

  async reschedule(id: string, email: string, startsAt: Date, endsAt: Date) {
    return this.db.transaction(async manager => {
      const current = await manager.findOneBy(OrderEntity, { id, userEmail: email });
      if (!current || !current.providerId) throw new NotFoundException("Nie znaleziono rezerwacji.");
      const offer = await this.offer({ providerId: current.providerId }, manager, true);
      const order = await manager.findOneByOrFail(OrderEntity, { id, userEmail: email });
      if (/odwo|wykon|zako/i.test(order.status) || !order.startsAt || !order.endsAt || order.startsAt.getTime() <= Date.now()) throw new BadRequestException("Nie można już przełożyć tego zamówienia.");
      const duration = (order.endsAt.getTime() - order.startsAt.getTime()) / 60_000;
      if (endsAt.getTime() - startsAt.getTime() !== duration * 60_000) throw new BadRequestException("Przełożenie nie może zmienić czasu trwania usługi.");
      const slot = daySlots(localDate(startsAt), duration, await this.busy(offer.id, manager, id), offer.bookingSettings ?? defaultWorkingHours).find(s => s.startsAt === startsAt.toISOString());
      if (!slot) throw new ConflictException("Wybrany termin jest niedostępny.");
      order.startsAt = startsAt; order.endsAt = endsAt;
      await manager.save(order);
    });
  }
}
