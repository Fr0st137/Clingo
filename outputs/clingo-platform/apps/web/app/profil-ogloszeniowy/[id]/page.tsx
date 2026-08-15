import { notFound } from "next/navigation";
import { OfferDetailsView } from "../../../components/offer-details-view";
import { PublicShell } from "../../../components/public-shell";
import { getProviderProfile } from "../../../lib/api";

type ProviderProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProviderProfilePage({ params }: ProviderProfilePageProps) {
  const { id } = await params;

  try {
    const providerProfile = await getProviderProfile(id);

    return (
      <PublicShell>
        <OfferDetailsView profile={providerProfile} />
      </PublicShell>
    );
  } catch {
    notFound();
  }
}
