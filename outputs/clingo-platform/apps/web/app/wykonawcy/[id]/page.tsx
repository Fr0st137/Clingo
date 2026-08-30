import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProviderProfileView } from "../../../components/public-provider-profile-view";
import type { ProviderProfileData } from "../../../components/provider-profile-view";
import { PublicShell } from "../../../components/public-shell";
import { getProviderProfile } from "../../../lib/api";

type PublicProviderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const paulinaFallback: ProviderProfileData = {
  completedOrders: 31,
  description: "Profesjonalne sprzątanie mieszkań, domów i biur na terenie Warszawy.",
  experience: "2 lata",
  gallery: [],
  id: "paulina-jagielska",
  location: "Warszawa",
  metrics: [],
  priceFrom: "1,50 zł / m²",
  provider: "Paulina Jagielska",
  rating: 4.7,
  reviews: [
    {
      author: "Michał T.",
      content: "Paulina wykonała wyjątkową pracę, sprzątając nasze trzypokojowe mieszkanie. Była punktualna, dokładna i bardzo profesjonalna. Dbałość o szczegóły zrobiła na nas duże wrażenie.",
      date: "2 tyg. temu",
      id: "michal-t",
      rating: 5
    },
    {
      author: "Izabela N.",
      content: "Pani Paulina spisała się znakomicie, mieszkanie po sprzątaniu wyglądało jak nowe, a jej sumienność i profesjonalne podejście naprawdę robią wrażenie.",
      date: "7 tyg. temu",
      id: "izabela-n",
      rating: 5
    }
  ],
  reviewsCount: 8,
  service: "Sprzątanie obiektów · Mieszkań i domów",
  standards: [],
  summary: { duration: "", lines: [], total: "" },
  tags: [],
  verified: true
};

function displayNameFromId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: PublicProviderPageProps): Promise<Metadata> {
  const { id } = await params;
  const provider = id === paulinaFallback.id ? paulinaFallback.provider : displayNameFromId(id);

  return {
    description: `Usługi, oceny i opinie wykonawcy ${provider} w Clingo.`,
    title: `${provider} | Clingo`
  };
}

export default async function PublicProviderPage({ params }: PublicProviderPageProps) {
  const { id } = await params;
  let profile: ProviderProfileData;

  if (id === paulinaFallback.id) {
    profile = paulinaFallback;
  } else {
    try {
      profile = await getProviderProfile(id);
    } catch {
      notFound();
    }
  }

  return (
    <PublicShell>
      <PublicProviderProfileView profile={profile} />
    </PublicShell>
  );
}
