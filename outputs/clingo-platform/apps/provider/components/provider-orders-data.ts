import type { ProviderOrder, ProviderMultiSessionOrder } from "./provider-order-card";
import type { CalendarAppointment } from "./provider-calendar-appointment";

const referenceOrder: ProviderOrder = { start: "8:45", end: "10:30", client: "Anita Kowalska", service: "Sprzątnie obiektów", detail: "Mieszkań i domów", price: "165,00 zł", area: "62 m²", extras: 2, employees: ["one", "two"] };
export type OrderDay = { label: string; day: number; orders: ProviderOrder[]; free?: boolean };
const rawOrderDays: OrderDay[] = [
  { label: "Poniedziałek", day: 13, orders: [referenceOrder, { ...referenceOrder, employees: ["one"] }, { ...referenceOrder, employees: ["two"] }, { ...referenceOrder, employees: ["two"] }, referenceOrder, { ...referenceOrder, employees: [], cancelled: true }] },
  { label: "Wtorek", day: 14, orders: [{ ...referenceOrder, employees: ["two"], external: true }, { ...referenceOrder, employees: ["one"] }] },
  { label: "Środa", day: 15, orders: [referenceOrder] },
  { label: "Czwartek", day: 16, orders: [referenceOrder] },
  { label: "Piątek", day: 17, orders: [{ ...referenceOrder, employees: ["one"] }] },
  { label: "Sobota", day: 18, orders: [{ ...referenceOrder, employees: ["one"] }, { ...referenceOrder, employees: [], cancelled: true }, { ...referenceOrder, employees: ["two"] }] },
  { label: "Niedziela", day: 19, orders: [], free: true }
];


export const orderDays = rawOrderDays.map(day => ({ ...day, orders: day.orders.map((order, i) => ({ ...order, id: `list-${day.day}-${i + 1}` })) }));

const referenceDetails = { service: "Sprzątnie obiektów", detail: "Mieszkań i domów", address: "Warszawa, Floriańska 48/16", employeeAvatar: "/figma-assets/calendar/day/avatar.png" };
const rawDayColumns: ReadonlyArray<ReadonlyArray<CalendarAppointment>> = [
  [
    { ...referenceDetails, start: "08:15", end: "11:15", client: "Justyna Batura", top: 22, height: 174, status: "muted" },
    { ...referenceDetails, start: "12:30", end: "16:00", client: "Anita Kowalska", top: 268.5, height: 203, status: "pending" },
    { ...referenceDetails, start: "16:15", end: "20:00", client: "Magdalenda Tatrzyńska", top: 486, height: 217.5, status: "none" }
  ],
  [{ ...referenceDetails, start: "10:30", end: "15:30", client: "Kazimierz Satyrski", top: 152.5, height: 290, status: "muted" }]
];


export const dayCalendarColumns = rawDayColumns.map((column, c) => column.map((appointment, i) => ({ ...appointment, id: `day-${c + 1}-${i + 1}` })));

export type WeekDay = { date: string; summary: string; today?: boolean; appointments: CalendarAppointment[]; absence?: boolean };
const weekReferenceAppointment: CalendarAppointment = { start: "08:45", end: "10:30", client: "Anita Kowalska", service: "Sprzątanie obiektów", detail: "Mieszkań i domów", top: 51, height: 101.5, status: "confirmed" };
const rawWeekDays: WeekDay[] = [
  { date: "Pn. 7", summary: "8 zamówień", appointments: [{ ...weekReferenceAppointment, status: "muted" }, { ...weekReferenceAppointment, start: "12:30", end: "16:00", top: 239.5, height: 203, status: "muted" }] },
  { date: "Wt. 8", summary: "Przykład · 30 min", appointments: [{ ...weekReferenceAppointment, end: "09:15", height: 29, compact: "30", service: undefined, detail: undefined }] },
  { date: "Śr. 9", summary: "1 zamówienie", appointments: [{ ...weekReferenceAppointment, detail: "Biur i lokali użytkowych", status: "muted" }], absence: true },
  { date: "Czw. 10", summary: "Przykład · 45 min", appointments: [{ ...weekReferenceAppointment, end: "09:30", height: 43.5, compact: "45", service: undefined, detail: undefined }] },
  { date: "Pt. 11", summary: "Przykład · 60 min", appointments: [{ ...weekReferenceAppointment, end: "09:45", height: 58, compact: "60", detail: undefined }] },
  { date: "Sb. 12", summary: "2 zamówienia", today: true, appointments: [weekReferenceAppointment, { ...weekReferenceAppointment, start: "12:30", end: "16:00", top: 268.5, height: 203, status: "none" }] },
  { date: "Nd. 13", summary: "Dzień wolny", appointments: [] }
];


export const weekCalendarDays = rawWeekDays.map((day, d) => ({ ...day, appointments: day.appointments.map((appointment, i) => ({ ...appointment, id: `week-${d + 7}-${i + 1}` })) }));

export type HistoricalOrder = { id?: string; number: string; client: string; category: string; service: string; start: string; end: string; price: string };
const historyReferenceOrder: HistoricalOrder = { number: "20258754178", client: "Aneta Kowalska", category: "Sprzątnie obiektów", service: "Mieszkań i domów", start: "17.10.2025, 13:30", end: "17.10.2025, 16:15", price: "367,50 zł" };
export const historicalOrders = Array.from({ length: 15 }, (_, i) => ({ ...historyReferenceOrder, id: `history-${i + 1}` }));


const multiReferenceOrder = { startDate: "02.12.2025", endDate: "02.12.2025", service: "Sprzątnie obiektów", detail: "Mieszkań i domów", area: "925 m²", extras: 1, sessions: 5 };
const rawMultiOrders: ReadonlyArray<ProviderMultiSessionOrder> = [
  { ...multiReferenceOrder, client: "Rafał Kaspijczyk", price: "2 730,00 zł" },
  { ...multiReferenceOrder, client: "Bożena Malinowska", price: "1 350,00 zł" },
  { ...multiReferenceOrder, client: "Radosław Chrobieski", price: "1 350,00 zł", external: true }
];


export const multiSessionOrders = rawMultiOrders.map((order, i) => ({ ...order, id: `multi-${i + 1}` }));

export type EditableProviderOrder = {
  id: string;
  number?: string;
  client: string;
  service?: string;
  detail?: string;
  start?: string;
  end?: string;
  dateLabel?: string;
  address?: string;
  price?: string;
  area?: string;
  extras?: number;
  sessions?: number;
  employees?: ReadonlyArray<{ name: string; avatar: string }>;
  status?: string;
  returnHref: string;
};

const employeeDirectory = {
  one: { name: "Paulina Jagielska", avatar: "/figma-assets/orders/employee-one.png" },
  two: { name: "Beata Kaszwabendzka", avatar: "/figma-assets/orders/employee-two.png" }
};

export const editableOrders: ReadonlyArray<EditableProviderOrder> = [
  ...orderDays.flatMap(day => day.orders.map(order => ({ ...order, dateLabel: `${day.label}, ${day.day} października`, employees: order.employees.map(employee => employeeDirectory[employee]), status: order.cancelled ? "Odwołane" : "Zaplanowane", returnHref: "/orders" }))),
  ...dayCalendarColumns.flatMap(column => column.map(appointment => ({ ...appointment, dateLabel: "Sobota, 13 października", employees: appointment.employeeAvatar ? [{ name: "Paulina Jagielska", avatar: appointment.employeeAvatar }] : undefined, status: appointment.status === "pending" ? "Oczekujące" : undefined, returnHref: "/calendar/day" }))),
  ...weekCalendarDays.flatMap(day => day.appointments.map(appointment => ({ ...appointment, dateLabel: `${day.date} października`, returnHref: "/calendar/week" }))),
  ...historicalOrders.map(order => ({ ...order, service: order.category, detail: order.service, status: "Wykonane", returnHref: "/orders/history" })),
  ...multiSessionOrders.map(order => ({ ...order, start: order.startDate, end: order.endDate, status: "Wielosesyjne", returnHref: "/orders/multi-session" })),
  { id: "multi-details", number: "20258754178", client: "Anita Kowalska", service: "Sprzątanie obiektów", detail: "Mieszkań i domów", address: "ul. Floriańska 48/16, 00-001 Warszawa", price: "2 730,00 zł", area: "925 m²", extras: 1, sessions: 5, employees: Object.values(employeeDirectory), returnHref: "/orders/multi-session/details" }
];

const ordersById = new Map(editableOrders.map(order => [order.id, order]));

export function getEditableOrder(id: string) {
  return ordersById.get(id);
}
