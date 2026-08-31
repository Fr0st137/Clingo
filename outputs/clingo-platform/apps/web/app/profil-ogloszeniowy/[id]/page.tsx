import { notFound } from "next/navigation";
import { OfferDetailsView } from "../../../components/offer-details-view";
import { PublicShell } from "../../../components/public-shell";
import { getProviderProfile } from "../../../lib/api";

type ProviderProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{
    id: string;
  }>;
};

export default async function ProviderProfilePage({ params, searchParams }: ProviderProfilePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const read = (key: string) => typeof query[key] === "string" ? query[key] as string : "";
  const initialRequest = { area: read("area"), address: read("address") || read("location"), pricing: read("pricing"), frequency: read("frequency"), addons: read("addons") };

  try {
    const providerProfile = await getProviderProfile(id);

    return (
      <PublicShell>
        <OfferDetailsView key={`${id}:${JSON.stringify(initialRequest)}`} profile={providerProfile} initialRequest={initialRequest} />
      </PublicShell>
    );
  } catch {
    notFound();
  }
}
