import { BadRequestException, ServiceUnavailableException } from "@nestjs/common";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";

// OWASP scrypt recommendation. Versioned hashes allow gradual upgrades of old accounts.
const parameters = { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };
let activeDerivations = 0;
async function derive(password: string, salt: string, legacy = false): Promise<Buffer> {
  if (activeDerivations >= 2) throw new ServiceUnavailableException("Serwer jest zajęty. Spróbuj ponownie za chwilę.");
  activeDerivations++;
  try {
    return await new Promise<Buffer>((resolve, reject) => scrypt(password, salt, legacy ? 64 : 32,
      legacy ? { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 } : parameters,
      (error, hash) => error ? reject(error) : resolve(hash)));
  } finally { activeDerivations--; }
}

export function passwordInput(value: unknown, isNew = false): string {
  if (typeof value !== "string" || value.length > 128 || value.length < (isNew ? 15 : 1)) {
    throw new BadRequestException(isNew ? "Hasło musi mieć od 15 do 128 znaków." : "Wpisz hasło (maksymalnie 128 znaków).");
  }
  if (isNew && (/^(.)\1+$/.test(value) || ["passwordpassword", "123456789012345", "qwertyuiopasdfgh", "haslohaslohaslohaslo"].includes(value.toLowerCase()))) {
    throw new BadRequestException("To hasło jest zbyt łatwe do odgadnięcia. Wybierz dłuższą, unikalną frazę.");
  }
  return value; // Never trim or silently truncate a new password.
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = `scrypt$131072$8$1$${(await derive(password, salt)).toString("hex")}`;
  return { hash, salt };
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const legacy = /^[a-f0-9]{128}$/.test(hash);
  const valid = legacy || /^scrypt\$131072\$8\$1\$[a-f0-9]{64}$/.test(hash);
  if (!valid) return false;
  const expected = Buffer.from(legacy ? hash : hash.split("$")[4], "hex");
  const actual = await derive(legacy ? password.trim() : password, salt, legacy);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function dummyPasswordCheck(password: string) {
  await derive(password, "00000000000000000000000000000000");
}
