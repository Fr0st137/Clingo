import { BadRequestException, ConflictException } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { ProviderAccountEntity, ProviderEmployeeEntity } from "./provider.entity";
import { ProviderOfferEntity } from "./provider-offers.entity";
import { defaultOfferConfiguration, type OfferConfiguration } from "./provider-offers.input";

export function staffingLimit(account: Pick<ProviderAccountEntity, "staffingMode" | "declaredStaff">, employeeCount: number) {
  if (account.staffingMode === "solo") return 1;
  return Math.max(1, Math.min(50, account.declaredStaff ?? employeeCount, employeeCount || 1));
}
export function maxOfferWorkers(configuration: OfferConfiguration) {
  return Math.max(1, ...configuration.areaTiers.map(row => row.workers));
}
export async function assertOfferStaffing(manager: EntityManager, account: ProviderAccountEntity, configuration: OfferConfiguration, published: boolean) {
  const employees = await manager.find(ProviderEmployeeEntity, { where: { accountId: account.id } });
  const limit = staffingLimit(account, employees.length);
  if (maxOfferWorkers(configuration) > limit) throw new BadRequestException(account.staffingMode === "solo"
    ? "Przy pracy samodzielnej każdy przedział może mieć tylko 1 osobę."
    : `Maksymalna obsada przedziału wynosi ${limit}. Sprawdź deklarowaną obsadę i listę pracowników w ustawieniach.`);
  if (published && !employees.length) throw new BadRequestException("Przed publikacją dodaj co najmniej jedną osobę w zakładce Pracownicy i ustaw jej grafik.");
  return limit;
}
export async function staffingConflicts(manager: EntityManager, account: ProviderAccountEntity, employeeCount: number) {
  const limit = staffingLimit(account, employeeCount);
  const offers = await manager.find(ProviderOfferEntity, { where: { accountId: account.id } });
  return offers.filter(row => row.status !== "archived").filter(row => maxOfferWorkers(row.configuration?.areaTiers?.length ? row.configuration : defaultOfferConfiguration()) > limit || row.status === "published" && employeeCount === 0)
    .map(row => ({ id: row.id, title: row.title, workers: maxOfferWorkers(row.configuration?.areaTiers?.length ? row.configuration : defaultOfferConfiguration()) }));
}
export async function assertStaffingReduction(manager: EntityManager, account: ProviderAccountEntity, employeeCount: number) {
  const conflicts = await staffingConflicts(manager, account, employeeCount);
  if (employeeCount === 0 && conflicts.length) throw new ConflictException("Przed usunięciem ostatniej osoby wycofaj opublikowane usługi i popraw obsadę szkiców.");
  if (conflicts.length) throw new ConflictException(`Najpierw zmniejsz obsadę w widełkach usług: ${conflicts.slice(0, 3).map(row => row.title).join(", ")}${conflicts.length > 3 ? "…" : ""}. Dopuszczalny limit po zmianie: ${staffingLimit(account, employeeCount)}.`);
}
