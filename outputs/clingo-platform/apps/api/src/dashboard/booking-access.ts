export const accessMethods = [
  { id: "phone-contact", label: "Prośba o kontakt telefoniczny w celu ustalenia sposobu udostępnienia lokalu objętego usługą." },
  { id: "someone-present", label: "Ktoś będzie w lokalu objętym usługą." }
] as const;

export type AccessMethod = typeof accessMethods[number]["id"];

export function isAccessMethod(value: unknown): value is AccessMethod {
  return accessMethods.some(option => option.id === value);
}

export function accessMethodLabel(value: unknown) {
  return accessMethods.find(option => option.id === value)?.label ?? "Nie podano";
}
