import type { SidebarUser } from "../components/sidebar";
import type { SettingsPayload } from "./api";

export type AccountProfile = {
  apartment: string | null;
  city: string | null;
  companyName: string | null;
  email: string;
  firstName: string | null;
  id: string;
  initials: string;
  lastName: string | null;
  name: string;
  phone: string | null;
  postalCode: string | null;
  street: string | null;
};

export type AccountProfileUpdate = {
  apartment?: string;
  city?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  postalCode?: string;
  street?: string;
};

const accountApiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function accountProfileToSidebarUser(profile: AccountProfile | null): SidebarUser | undefined {
  if (!profile) {
    return undefined;
  }

  return {
    initials: profile.initials,
    name: profile.name,
    phone: profile.phone ?? ""
  };
}

export async function getAccountProfile(email?: string): Promise<AccountProfile | null> {
  if (!email) {
    return null;
  }

  const response = await fetch(`${accountApiBaseUrl}/auth/profile?email=${encodeURIComponent(email)}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { user?: AccountProfile };
  return payload.user ?? null;
}

export async function updateAccountProfile(email: string, values: AccountProfileUpdate): Promise<AccountProfile> {
  const response = await fetch(`${accountApiBaseUrl}/auth/profile?email=${encodeURIComponent(email)}`, {
    body: JSON.stringify(values),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });

  if (!response.ok) {
    throw new Error(`Profile update failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { user: AccountProfile };
  return payload.user;
}

export function settingsFromAccountProfile(settings: SettingsPayload, profile: AccountProfile | null): SettingsPayload {
  if (!profile) {
    return settings;
  }

  return {
    ...settings,
    sections: settings.sections.map((section) => {
      if (section.id === "personal") {
        return {
          ...section,
          actionLabel: "Zapisz zmiany",
          fields: [
            { id: "firstName", label: "Imię", value: profile.firstName ?? "" },
            { id: "lastName", label: "Nazwisko", value: profile.lastName ?? "" },
            { id: "companyName", label: "Nazwa firmy", value: profile.companyName ?? "" },
            { id: "email", label: "Adres e-mail", value: profile.email, type: "email" as const },
            { id: "phone", label: "Numer telefonu", value: profile.phone ?? "" }
          ]
        };
      }

      if (section.id === "address") {
        return {
          ...section,
          actionLabel: "Zapisz adres",
          fields: [
            { id: "street", label: "Ulica", value: profile.street ?? "" },
            { id: "apartment", label: "Numer mieszkania", value: profile.apartment ?? "" },
            { id: "city", label: "Miasto", value: profile.city ?? "" },
            { id: "postalCode", label: "Kod pocztowy", value: profile.postalCode ?? "" }
          ]
        };
      }

      return section;
    })
  };
}
